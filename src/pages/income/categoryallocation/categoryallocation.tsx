/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { decryptIncomeData, encryptAllocationData, decryptAllocationData } from "@/utils/encryption";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/inputs";
import Page from "@/components/page";
import Card from "@/components/card";
import DataTable from "@/components/table";
import { getCategoryAllocationTableColumns } from "./columnDefs";
import { Calculator, Info } from "lucide-react";

interface CategoryAllocation {
  category_id: string;
  category_name: string;
  category_color?: string;
  allocated_percentage: number;
  allocated_amount: number;
}

interface Category {
  id: string;
  name: string;
  bucket: "needs" | "wants" | "savings";
  color?: string;
  is_active: boolean;
}

interface EnhancedIncome {
  id: string;
  user_id: string;
  source: string;
  description?: string;
  amount: number;
  frequency: "monthly" | "yearly" | "weekly" | "bi-weekly";
  needs_percentage: number;
  wants_percentage: number;
  savings_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  monthly_amount: number;
  needs_category_allocations?: CategoryAllocation[];
  wants_category_allocations?: CategoryAllocation[];
  savings_category_allocations?: CategoryAllocation[];
}

interface CategoryAllocationRow {
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  allocatedAmount: number;
  bucketKey: string;
  bucketTotal: number;
  percentageOfBucket: number;
  isAllocated: boolean;
}

type BucketKey = "needs" | "wants" | "savings";

interface BucketConfig {
  key: BucketKey;
  label: string;
  color: string;
  description: string;
}

const BUCKETS: BucketConfig[] = [
  {
    key: "needs",
    label: "Needs",
    color: "#ef4444",
    description: "Essential expenses like rent, utilities, groceries",
  },
  {
    key: "wants",
    label: "Wants",
    color: "#3b82f6",
    description: "Entertainment, dining out, hobbies",
  },
  {
    key: "savings",
    label: "Savings",
    color: "#22c55e",
    description: "Emergency fund, investments, debt repayment",
  },
];

// Form data structure for amounts
interface AllocationFormData {
  [key: string]: number;
}

const CategoryAllocation: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [income, setIncome] = useState<EnhancedIncome | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({
    needs: "",
    wants: "",
    savings: "",
  });

  // Simple validation schema for amounts
  const AllocationSchema = z
    .object({})
    .catchall(z.number().min(0, "Amount must be 0 or greater"));

  const form = useForm<AllocationFormData>({
    resolver: zodResolver(AllocationSchema),
    defaultValues: {},
  });

  const [, setFormWatch] = useState({});

  // Watch all form values to trigger re-renders
  useEffect(() => {
    const subscription = form.watch(() => {
      setFormWatch({});
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user?.id) {
        navigate("/dashboard/income");
        return;
      }

      setIsLoading(true);
      try {
        // Fetch income data
        let incomeData;
        try {
          const { data: enhancedData, error } = await supabase
            .from("incomes_with_category_allocations")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

          if (enhancedData && !error) {
            // Decrypt enhanced view data if needed
            let processedEnhancedData = enhancedData;
            let processedCategoryAllocations = enhancedData.category_allocations || [];
            
            // Decrypt main income amount
            if (typeof enhancedData.amount === 'string') {
              try {
                const decrypted = decryptIncomeData({
                  ...enhancedData,
                  amount: enhancedData.amount,
                });
                const decryptedAmount = decrypted.amount;
                const frequency = enhancedData.frequency;
                const multipliers: Record<string, number> = {
                  monthly: 1,
                  yearly: 1 / 12,
                  weekly: 52 / 12,
                  "bi-weekly": 26 / 12,
                };
                const monthlyAmount = decryptedAmount * (multipliers[frequency] || 1);
                
                processedEnhancedData = {
                  ...enhancedData,
                  amount: decryptedAmount,
                  monthly_amount: monthlyAmount,
                };
              } catch (decryptError) {
                console.error("Error decrypting enhanced view income data:", enhancedData.id, decryptError);
              }
            }
            
            // Decrypt category allocations
            if (processedCategoryAllocations.length > 0) {
              processedCategoryAllocations = processedCategoryAllocations.map((allocation: any) => {
                let decryptedAmount = allocation.allocation_amount;
                try {
                  if (typeof allocation.allocation_amount === 'string') {
                    const decrypted = decryptAllocationData({
                      allocation_amount: allocation.allocation_amount,
                    });
                    decryptedAmount = decrypted.allocation_amount;
                  }
                } catch (decryptError) {
                  console.error("Error decrypting allocation data:", allocation, decryptError);
                  // Fallback to original value if decryption fails
                  decryptedAmount = parseFloat(allocation.allocation_amount) || 0;
                }
                return {
                  ...allocation,
                  allocation_amount: decryptedAmount,
                };
              });
            }
            
            // Group category allocations by bucket
            const needsAllocations = processedCategoryAllocations.filter(
              (alloc: any) => alloc.category_bucket === 'needs'
            );
            const wantsAllocations = processedCategoryAllocations.filter(
              (alloc: any) => alloc.category_bucket === 'wants'
            );
            const savingsAllocations = processedCategoryAllocations.filter(
              (alloc: any) => alloc.category_bucket === 'savings'
            );
            
            // Convert to enhanced format with proper allocations
            incomeData = {
              ...processedEnhancedData,
              needs_category_allocations: needsAllocations.map((alloc: any) => ({
                category_id: alloc.category_id,
                category_name: alloc.category_name,
                category_color: alloc.category_color,
                allocated_percentage: alloc.allocation_percentage,
                allocated_amount: alloc.allocation_amount,
              })),
              wants_category_allocations: wantsAllocations.map((alloc: any) => ({
                category_id: alloc.category_id,
                category_name: alloc.category_name,
                category_color: alloc.category_color,
                allocated_percentage: alloc.allocation_percentage,
                allocated_amount: alloc.allocation_amount,
              })),
              savings_category_allocations: savingsAllocations.map((alloc: any) => ({
                category_id: alloc.category_id,
                category_name: alloc.category_name,
                category_color: alloc.category_color,
                allocated_percentage: alloc.allocation_percentage,
                allocated_amount: alloc.allocation_amount,
              })),
            } as EnhancedIncome;
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          // Fallback to regular incomes table
          const { data: basicData, error: basicError } = await supabase
            .from("incomes")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

          if (basicError) throw basicError;
          if (basicData) {
            // Decrypt the income amount
            let decryptedAmount = basicData.amount;
            try {
              const decrypted = decryptIncomeData({
                ...basicData,
                amount: basicData.amount,
              });
              decryptedAmount = decrypted.amount;
            } catch (decryptError) {
              console.error("Error decrypting income data:", basicData.id, decryptError);
            }

            // Convert to enhanced format
            const frequency = basicData.frequency;
            const multipliers: Record<string, number> = {
              monthly: 1,
              yearly: 1 / 12,
              weekly: 52 / 12,
              "bi-weekly": 26 / 12,
            };
            const monthlyAmount =
              decryptedAmount * (multipliers[frequency] || 1);

            incomeData = {
              ...basicData,
              amount: decryptedAmount,
              monthly_amount: monthlyAmount,
              needs_category_allocations: [],
              wants_category_allocations: [],
              savings_category_allocations: [],
            };
          }
        }

        if (!incomeData) {
          throw new Error("Income not found");
        }

        setIncome(incomeData);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("bucket", { ascending: true })
          .order("name", { ascending: true });

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Initialize form with existing allocations
        if (categoriesData && categoriesData.length > 0) {
          const defaultValues: AllocationFormData = {};

          BUCKETS.forEach((bucket) => {
            const bucketAllocations =
              incomeData[`${bucket.key}_category_allocations`] || [];
            const bucketCategories = categoriesData.filter(
              (cat: Category) => cat.bucket === bucket.key && cat.is_active
            );

            bucketCategories.forEach((category: Category) => {
              const existingAllocation = bucketAllocations.find(
                (alloc: CategoryAllocation) => alloc.category_id === category.id
              );
              const fieldKey = `${bucket.key}_${category.id}`;

              if (existingAllocation) {
                let decryptedAmount = existingAllocation.allocated_amount;
                // Decrypt if allocation amount is encrypted (string)
                if (typeof existingAllocation.allocated_amount === 'string') {
                  try {
                    const decrypted = decryptAllocationData({
                      allocation_amount: existingAllocation.allocated_amount,
                    });
                    decryptedAmount = decrypted.allocation_amount;
                  } catch (decryptError) {
                    console.error("Error decrypting allocation data:", existingAllocation, decryptError);
                  }
                }
                defaultValues[fieldKey] = decryptedAmount;
              } else {
                defaultValues[fieldKey] = 0;
              }
            });
          });

          form.reset(defaultValues);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load income data. Please try again.");
        navigate("/dashboard/income");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, user?.id, navigate, form]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoriesForBucket = (bucketKey: BucketKey) => {
    return categories.filter(
      (cat) => cat.bucket === bucketKey && cat.is_active
    );
  };

  const getBucketTotalAmount = (bucketKey: BucketKey) => {
    if (!income) return 0;
    const bucketPercentage = income[`${bucketKey}_percentage`] || 0;
    return (income.monthly_amount * bucketPercentage) / 100;
  };

  const getTotalAllocatedAmountForBucket = (bucketKey: BucketKey) => {
    const bucketCategories = getCategoriesForBucket(bucketKey);
    return bucketCategories.reduce((total, category) => {
      const fieldKey = `${bucketKey}_${category.id}`;
      const fieldValue = form.getValues(fieldKey) || 0;
      return total + fieldValue;
    }, 0);
  };

  const getUnallocatedAmountForBucket = (bucketKey: BucketKey) => {
    const bucketTotal = getBucketTotalAmount(bucketKey);
    const totalAllocated = getTotalAllocatedAmountForBucket(bucketKey);
    return bucketTotal - totalAllocated;
  };

  const getPercentageFromAmount = (amount: number, bucketKey: BucketKey) => {
    const bucketTotal = getBucketTotalAmount(bucketKey);
    return bucketTotal > 0 ? (amount / bucketTotal) * 100 : 0;
  };

  // Generate table data for a specific bucket
  const generateTableDataForBucket = (
    bucketKey: BucketKey
  ): CategoryAllocationRow[] => {
    const bucketCategories = getCategoriesForBucket(bucketKey);
    const bucketTotal = getBucketTotalAmount(bucketKey);

    return bucketCategories.map((category) => {
      const fieldKey = `${bucketKey}_${category.id}`;
      const allocatedAmount = form.getValues(fieldKey) || 0;
      const percentageOfBucket = getPercentageFromAmount(
        allocatedAmount,
        bucketKey
      );

      return {
        categoryId: category.id,
        categoryName: category.name,
        categoryColor: category.color,
        allocatedAmount,
        bucketKey,
        bucketTotal,
        percentageOfBucket,
        isAllocated: allocatedAmount > 0,
      };
    });
  };

  // Filter table data based on search query
  const getFilteredTableData = (bucketKey: BucketKey) => {
    const tableData = generateTableDataForBucket(bucketKey);
    const searchQuery = searchQueries[bucketKey];

    if (!searchQuery) return tableData;

    const searchLower = searchQuery.toLowerCase();
    return tableData.filter(
      (row) =>
        row.categoryName.toLowerCase().includes(searchLower) ||
        row.allocatedAmount.toString().includes(searchLower) ||
        row.percentageOfBucket.toFixed(1).includes(searchLower)
    );
  };

  // Handle search for a specific bucket
  const handleSearch = (bucketKey: BucketKey, search: string) => {
    setSearchQueries((prev) => ({
      ...prev,
      [bucketKey]: search.trim(),
    }));
  };

  // Handle amount change from DataTable
  const handleAmountChange = (
    categoryId: string,
    bucketKey: string,
    amount: number
  ) => {
    const fieldKey = `${bucketKey}_${categoryId}`;
    form.setValue(fieldKey, amount, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // Quick allocate remaining amount to a category
  const handleQuickAllocate = (categoryId: string, bucketKey: string) => {
    const unallocatedAmount = getUnallocatedAmountForBucket(
      bucketKey as BucketKey
    );
    if (unallocatedAmount > 0) {
      const fieldKey = `${bucketKey}_${categoryId}`;
      const currentValue = form.getValues(fieldKey) || 0;
      form.setValue(fieldKey, currentValue + Math.round(unallocatedAmount), {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  // Remove allocation from a category
  const handleRemoveAllocation = (categoryId: string, bucketKey: string) => {
    const fieldKey = `${bucketKey}_${categoryId}`;
    form.setValue(fieldKey, 0, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  // Add initial allocation to a category
  const handleAddAllocation = (categoryId: string, bucketKey: string) => {
    const unallocatedAmount = getUnallocatedAmountForBucket(
      bucketKey as BucketKey
    );
    if (unallocatedAmount > 0) {
      const initialValue = Math.min(1000, Math.round(unallocatedAmount));
      const fieldKey = `${bucketKey}_${categoryId}`;
      form.setValue(fieldKey, initialValue, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const onSubmit = async (values: AllocationFormData) => {
    if (!income) return;

    setIsSaving(true);
    try {
      // Validate that no bucket is over-allocated
      const errors: string[] = [];
      BUCKETS.forEach((bucket) => {
        const totalAllocated = getTotalAllocatedAmountForBucket(bucket.key);
        const bucketTotal = getBucketTotalAmount(bucket.key);
        if (totalAllocated > bucketTotal + 1) {
          errors.push(
            `${bucket.label} is over-allocated by ${formatCurrency(
              totalAllocated - bucketTotal
            )}`
          );
        }
      });

      if (errors.length > 0) {
        toast.error(`Cannot save: ${errors.join(", ")}`);
        setIsSaving(false);
        return;
      }

      // Delete existing allocations
      await supabase
        .from("income_category_allocations")
        .delete()
        .eq("income_id", income.id);

      // Prepare new allocations
      const allAllocations: any[] = [];

      BUCKETS.forEach((bucket) => {
        const bucketCategories = getCategoriesForBucket(bucket.key);

        bucketCategories.forEach((category) => {
          const fieldKey = `${bucket.key}_${category.id}`;
          const amount = values[fieldKey] || 0;

          if (amount > 0) {
            const encryptedAllocation = encryptAllocationData({
              allocation_amount: Math.round(amount),
            });
            
            allAllocations.push({
              income_id: income.id,
              category_id: category.id,
              allocation_amount: encryptedAllocation.allocation_amount,
              user_id: user.id,
              allocation_percentage: getPercentageFromAmount(amount, bucket.key),
            });
          }
        });
      });

      // Insert new allocations
      if (allAllocations.length > 0) {
        const { error } = await supabase
          .from("income_category_allocations")
          .insert(allAllocations);

        if (error) throw error;
      }

      toast.success("Category allocations saved successfully!");
      navigate("/dashboard/income");
    } catch (error) {
      console.error("Error saving allocations:", error);
      toast.error("Failed to save allocations. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Page title="Allocate to Categories" subTitle="Loading...">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Page>
    );
  }

  if (!income) {
    return (
      <Page
        title="Income Not Found"
        subTitle="The requested income source could not be found."
      >
        <div className="text-center py-12">
          <p className="text-gray-500">
            Income source not found or access denied.
          </p>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={`Allocate to Categories`}
      subTitle={`${income.source} • ${formatCurrency(
        income.monthly_amount
      )}/month • Allocate your income to specific categories using actual amounts within each budget bucket.`}
      breadcrumbs={[
        { name: "Income Management", to: "/dashboard/income" },
        {
          name: "Allocate to Categories",
        },
      ]}
    >
      <div className="flex flex-col gap-4 mt-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(income.monthly_amount)}
            </div>
            <div className="text-sm text-blue-700">Monthly Amount</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-lg font-semibold text-gray-800">
              {income.needs_percentage}% / {income.wants_percentage}% /{" "}
              {income.savings_percentage}%
            </div>
            <div className="text-sm text-gray-600">Needs / Wants / Savings</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-lg font-semibold text-green-800">
              {categories.length} Categories
            </div>
            <div className="text-sm text-green-600">
              Available for allocation
            </div>
          </div>
        </div>

        {/* Bucket Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          {BUCKETS.map((bucket) => {
            const totalAllocated = getTotalAllocatedAmountForBucket(bucket.key);
            const bucketTotal = getBucketTotalAmount(bucket.key);
            const remaining = bucketTotal - totalAllocated;
            const percentageAllocated = getPercentageFromAmount(
              totalAllocated,
              bucket.key
            );

            return (
              <div
                key={bucket.key}
                className="text-center p-4 bg-white rounded"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: bucket.color }}
                  />
                  <span className="font-medium text-gray-900">
                    {bucket.label}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-800">
                  {formatCurrency(totalAllocated)}
                </div>
                <div className="text-gray-600 text-xs">
                  of {formatCurrency(bucketTotal)} (
                  {percentageAllocated.toFixed(1)}%)
                </div>
                <div
                  className={`text-xs mt-1 ${
                    remaining >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {remaining >= 0
                    ? `${formatCurrency(remaining)} remaining`
                    : `${formatCurrency(Math.abs(remaining))} over`}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tips */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-500 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">💡 Allocation Tips</p>
              <ul className="space-y-1 text-xs">
                <li>
                  • Set specific amounts (like ₹5,000 for groceries) for better
                  budget control
                </li>
                <li>
                  • Use "Add Remaining" button to quickly allocate leftover
                  amounts
                </li>
                <li>
                  • "Allocate Equally" distributes the bucket amount evenly
                  across categories
                </li>
                <li>
                  • You don't have to allocate 100% - unallocated amounts remain
                  flexible
                </li>
              </ul>
            </div>
          </div>
        </div>

        <Form {...form}>
          {/* DataTable for each bucket */}
          <div className="grid grid-cols-1 gap-6">
            {BUCKETS.map((bucket) => {
              const bucketPercentage = income[`${bucket.key}_percentage`] || 0;
              const bucketTotalAmount = getBucketTotalAmount(bucket.key);
              const bucketCategories = getCategoriesForBucket(bucket.key);
              const totalAllocatedAmount = getTotalAllocatedAmountForBucket(
                bucket.key
              );
              const unallocatedAmount = getUnallocatedAmountForBucket(
                bucket.key
              );
              const hasCategories = bucketCategories.length > 0;
              const isOverAllocated =
                totalAllocatedAmount > bucketTotalAmount + 1;
              const filteredTableData = getFilteredTableData(bucket.key);

              return (
                <Card
                  key={bucket.key}
                  title={`${bucket.label} ${bucketPercentage}%`}
                  headerContent={
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[var(--content-textprimary)] font-size-small">
                          {formatCurrency(bucketTotalAmount)}
                        </div>
                        {totalAllocatedAmount > 0 && (
                          <div
                            className={`font-size-extra-small ${
                              isOverAllocated
                                ? "text-red-600"
                                : "text-[var(--content-textplaceholder)]"
                            }`}
                          >
                            {formatCurrency(totalAllocatedAmount)} allocated
                          </div>
                        )}
                        {isOverAllocated && (
                          <div className="text-xs text-red-600 font-medium">
                            Over by{" "}
                            {formatCurrency(
                              totalAllocatedAmount - bucketTotalAmount
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  }
                  cardContent={
                    hasCategories ? (
                      <DataTable
                        data={filteredTableData}
                        columns={getCategoryAllocationTableColumns(
                          bucket.key,
                          unallocatedAmount,
                          handleAmountChange,
                          handleQuickAllocate,
                          handleRemoveAllocation,
                          handleAddAllocation
                        )}
                        onSearch={(search: any) =>
                          handleSearch(bucket.key, search)
                        }
                      />
                    ) : (
                      <div className="text-center text-gray-500 text-sm py-8">
                        <Calculator className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <div>No categories available for this bucket.</div>
                        <div className="text-xs mt-1">
                          Create categories in the Category Management page
                          first.
                        </div>
                      </div>
                    )
                  }
                />
              );
            })}
          </div>

          <Button
            type="submit"
            onClick={form.handleSubmit(onSubmit)}
            title={isSaving ? "Saving..." : "Save Allocations"}
            disabled={
              isSaving || !form.formState.isValid || !form.formState.isDirty
            }
            className="w-fit"
          />
        </Form>
      </div>
    </Page>
  );
};

export default CategoryAllocation;
