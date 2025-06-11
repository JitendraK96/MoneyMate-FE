/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField } from "@/components/ui/form";
import { Input, Button } from "@/components/inputs";
import { Separator } from "@/components/ui/separator";
import Page from "@/components/page";
import Card from "@/components/card";
import {
  Calculator,
  Info,
  ArrowLeft,
  Save,
  Plus,
  Minus,
  Target,
} from "lucide-react";

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
            incomeData = enhancedData as EnhancedIncome;
          }
        } catch (error) {
          console.log(
            "Enhanced view not available, using basic income data",
            error
          );
          // Fallback to regular incomes table
          const { data: basicData, error: basicError } = await supabase
            .from("incomes")
            .select("*")
            .eq("id", id)
            .eq("user_id", user.id)
            .single();

          if (basicError) throw basicError;
          if (basicData) {
            // Convert to enhanced format
            const frequency = basicData.frequency;
            const multipliers: Record<string, number> = {
              monthly: 1,
              yearly: 1 / 12,
              weekly: 52 / 12,
              "bi-weekly": 26 / 12,
            };
            const monthlyAmount =
              basicData.amount * (multipliers[frequency] || 1);

            incomeData = {
              ...basicData,
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

        // Initialize form with existing allocations (convert percentages to amounts)
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
              // Convert percentage to amount
              const amount = existingAllocation
                ? (incomeData.monthly_amount *
                    existingAllocation.allocated_percentage) /
                  100
                : 0;
              defaultValues[fieldKey] = Math.round(amount);
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

  const addCategoryToForm = (bucketKey: BucketKey, categoryId: string) => {
    const unallocatedAmount = getUnallocatedAmountForBucket(bucketKey);
    if (unallocatedAmount > 0) {
      const initialValue = Math.min(1000, Math.round(unallocatedAmount));
      const fieldKey = `${bucketKey}_${categoryId}`;
      form.setValue(fieldKey, initialValue);
    }
  };

  const removeCategoryFromForm = (bucketKey: BucketKey, categoryId: string) => {
    const fieldKey = `${bucketKey}_${categoryId}`;
    form.setValue(fieldKey, 0);
  };

  const quickAllocateRemainder = (bucketKey: BucketKey, categoryId: string) => {
    const unallocatedAmount = getUnallocatedAmountForBucket(bucketKey);
    if (unallocatedAmount > 0) {
      const fieldKey = `${bucketKey}_${categoryId}`;
      const currentValue = form.getValues(fieldKey) || 0;
      form.setValue(fieldKey, currentValue + Math.round(unallocatedAmount));
    }
  };

  const allocateEqually = (bucketKey: BucketKey) => {
    const bucketCategories = getCategoriesForBucket(bucketKey);
    const bucketTotal = getBucketTotalAmount(bucketKey);

    if (bucketCategories.length === 0) return;

    const amountPerCategory = Math.floor(bucketTotal / bucketCategories.length);

    bucketCategories.forEach((category) => {
      const fieldKey = `${bucketKey}_${category.id}`;
      form.setValue(fieldKey, amountPerCategory);
    });

    toast.success(
      `Allocated ${formatCurrency(amountPerCategory)} to each ${BUCKETS.find(
        (b) => b.key === bucketKey
      )?.label.toLowerCase()} category`
    );
  };

  const clearBucketAllocations = (bucketKey: BucketKey) => {
    const bucketCategories = getCategoriesForBucket(bucketKey);

    bucketCategories.forEach((category) => {
      const fieldKey = `${bucketKey}_${category.id}`;
      form.setValue(fieldKey, 0);
    });

    toast.success(
      `Cleared all ${BUCKETS.find(
        (b) => b.key === bucketKey
      )?.label.toLowerCase()} allocations`
    );
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
        if (totalAllocated > bucketTotal) {
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

      // Prepare new allocations (convert amounts back to percentages for storage)
      const allAllocations: any[] = [];

      BUCKETS.forEach((bucket) => {
        const bucketCategories = getCategoriesForBucket(bucket.key);

        bucketCategories.forEach((category) => {
          const fieldKey = `${bucket.key}_${category.id}`;
          const amount = values[fieldKey] || 0;

          if (amount > 0) {
            // Convert amount to percentage for storage
            const percentage = (amount / income.monthly_amount) * 100;
            allAllocations.push({
              income_id: income.id,
              category_id: category.id,
              allocated_percentage: percentage,
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
    >
      <div className="max-w-5xl mx-auto">
        {/* Income Summary Card */}
        <Card
          title="Income Summary"
          cardContent={
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
                <div className="text-sm text-gray-600">
                  Needs / Wants / Savings
                </div>
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
          }
        />

        {/* Tips Card */}
        <Card
          cardContent={
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">💡 Allocation Tips</p>
                  <ul className="space-y-1 text-xs">
                    <li>
                      • Set specific amounts (like ₹5,000 for groceries) for
                      better budget control
                    </li>
                    <li>
                      • Use "Add Remaining" to quickly allocate leftover amounts
                    </li>
                    <li>
                      • "Allocate Equally" distributes the bucket amount evenly
                      across categories
                    </li>
                    <li>
                      • You don't have to allocate 100% - unallocated amounts
                      remain flexible
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          }
        />

        <Form {...form}>
          <div className="space-y-6">
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
              const isExpanded = true;
              const hasCategories = bucketCategories.length > 0;
              const isOverAllocated = totalAllocatedAmount > bucketTotalAmount;
              const hasAllocations = bucketCategories.some(
                (cat) => (form.getValues(`${bucket.key}_${cat.id}`) || 0) > 0
              );

              return (
                <Card
                  key={bucket.key}
                  className={isOverAllocated ? "border-red-300 bg-red-50" : ""}
                  title={`${bucket.label} ${bucketPercentage}%`}
                  headerContent={
                    <div className="flex items-center gap-2">
                      {hasCategories && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => allocateEqually(bucket.key)}
                            title="Allocate Equally"
                            className="text-xs"
                            icon={<Target />}
                          />
                          {hasAllocations && (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => clearBucketAllocations(bucket.key)}
                              title="Clear All"
                              className="text-xs"
                              icon={<Minus />}
                            />
                          )}
                        </>
                      )}
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(bucketTotalAmount)}
                        </div>
                        {totalAllocatedAmount > 0 && (
                          <div
                            className={`text-sm ${
                              isOverAllocated ? "text-red-600" : "text-gray-600"
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
                    isExpanded && (
                      <div className="space-y-4">
                        {hasCategories ? (
                          <div className="space-y-3">
                            {bucketCategories.map((category) => {
                              const fieldKey = `${bucket.key}_${category.id}`;
                              const currentAmount =
                                form.getValues(fieldKey) || 0;
                              const currentPercentage = getPercentageFromAmount(
                                currentAmount,
                                bucket.key
                              );

                              return (
                                <div key={category.id} className="space-y-2">
                                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div
                                      className="w-3 h-3 rounded-full"
                                      style={{
                                        backgroundColor:
                                          category.color || "#6b7280",
                                      }}
                                    />
                                    <span className="flex-1 font-medium text-gray-900">
                                      {category.name}
                                    </span>

                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500 w-8">
                                        ₹
                                      </span>
                                      <FormField
                                        control={form.control}
                                        name={fieldKey}
                                        render={({ field }) => (
                                          <Input
                                            field={field}
                                            type="number"
                                            step="100"
                                            min="0"
                                            onChange={(e) => {
                                              const value =
                                                parseFloat(e.target.value) || 0;
                                              field.onChange(Math.round(value));
                                            }}
                                            className="w-24 text-center text-sm"
                                            placeholder="0"
                                          />
                                        )}
                                      />

                                      <div className="flex flex-col items-end min-w-16">
                                        <span className="text-xs text-gray-500">
                                          {currentPercentage.toFixed(1)}%
                                        </span>
                                        {currentAmount > 0 && (
                                          <span className="text-xs text-gray-400">
                                            of bucket
                                          </span>
                                        )}
                                      </div>

                                      {currentAmount > 0 ? (
                                        <div className="flex gap-1">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                              quickAllocateRemainder(
                                                bucket.key,
                                                category.id
                                              )
                                            }
                                            className="p-1 h-7 w-7 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                            title="Add remaining amount"
                                            disabled={unallocatedAmount <= 0}
                                            icon={<Plus />}
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={() =>
                                              removeCategoryFromForm(
                                                bucket.key,
                                                category.id
                                              )
                                            }
                                            className="p-1 h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                            title="Remove allocation"
                                            icon={<Minus />}
                                          />
                                        </div>
                                      ) : (
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          onClick={() =>
                                            addCategoryToForm(
                                              bucket.key,
                                              category.id
                                            )
                                          }
                                          className="p-1 h-7 w-7 text-green-500 hover:text-green-700 hover:bg-green-50"
                                          title="Add allocation"
                                          disabled={unallocatedAmount <= 0}
                                          icon={<Plus />}
                                        />
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                            {/* Unallocated Amount Display */}
                            {totalAllocatedAmount !== bucketTotalAmount && (
                              <>
                                <Separator />
                                <div
                                  className={`flex items-center gap-3 p-3 rounded-lg border ${
                                    unallocatedAmount >= 0
                                      ? "bg-yellow-50 border-yellow-200"
                                      : "bg-red-50 border-red-200"
                                  }`}
                                >
                                  <div
                                    className={`w-3 h-3 rounded-full ${
                                      unallocatedAmount >= 0
                                        ? "bg-yellow-400"
                                        : "bg-red-400"
                                    }`}
                                  />
                                  <span
                                    className={`flex-1 font-medium ${
                                      unallocatedAmount >= 0
                                        ? "text-yellow-800"
                                        : "text-red-800"
                                    }`}
                                  >
                                    {unallocatedAmount >= 0
                                      ? "Unallocated"
                                      : "Over-allocated"}{" "}
                                    {bucket.label}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-sm font-medium ${
                                        unallocatedAmount >= 0
                                          ? "text-yellow-700"
                                          : "text-red-700"
                                      }`}
                                    >
                                      {formatCurrency(
                                        Math.abs(unallocatedAmount)
                                      )}
                                    </span>
                                    <span
                                      className={`text-xs ${
                                        unallocatedAmount >= 0
                                          ? "text-yellow-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {Math.abs(
                                        getPercentageFromAmount(
                                          unallocatedAmount,
                                          bucket.key
                                        )
                                      ).toFixed(1)}
                                      %
                                    </span>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 text-sm py-8">
                            <Calculator className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <div>No categories available for this bucket.</div>
                            <div className="text-xs mt-1">
                              Create categories in the Category Management page
                              first.
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }
                />
              );
            })}

            {/* Summary Card */}
            <Card
              title="Allocation Summary"
              cardContent={
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {BUCKETS.map((bucket) => {
                    const totalAllocated = getTotalAllocatedAmountForBucket(
                      bucket.key
                    );
                    const bucketTotal = getBucketTotalAmount(bucket.key);
                    const remaining = bucketTotal - totalAllocated;
                    const percentageAllocated = getPercentageFromAmount(
                      totalAllocated,
                      bucket.key
                    );

                    return (
                      <div
                        key={bucket.key}
                        className="text-center p-4 bg-white rounded border"
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
              }
            />
          </div>

          {/* Action Buttons */}
          <Card
            cardContent={
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/dashboard/income")}
                  title="Cancel"
                  icon={<ArrowLeft />}
                />
                <Button
                  type="submit"
                  onClick={form.handleSubmit(onSubmit)}
                  title={isSaving ? "Saving..." : "Save Allocations"}
                  icon={<Save />}
                  disabled={isSaving || !form.formState.isValid}
                />
              </div>
            }
          />
        </Form>
      </div>
    </Page>
  );
};

export default CategoryAllocation;
