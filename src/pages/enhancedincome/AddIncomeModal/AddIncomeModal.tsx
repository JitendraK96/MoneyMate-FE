/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField } from "@/components/ui/form";
import { Input, Button } from "@/components/inputs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

// Types (should be in your types file)
interface CategoryAllocation {
  category_id: string;
  category_name?: string;
  category_color?: string;
  allocated_percentage: number;
  allocated_amount?: number;
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
  monthly_amount?: number;
  needs_category_allocations?: CategoryAllocation[];
  wants_category_allocations?: CategoryAllocation[];
  savings_category_allocations?: CategoryAllocation[];
}

interface Category {
  id: string;
  name: string;
  description?: string;
  bucket: "needs" | "wants" | "savings";
  color?: string;
  icon?: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  income?: EnhancedIncome | any; // any for backward compatibility
  categories?: Category[];
  mode?: "create" | "edit";
}

const INCOME_FREQUENCIES = [
  { key: "monthly", label: "Monthly", multiplier: 12 },
  { key: "yearly", label: "Yearly", multiplier: 1 },
  { key: "weekly", label: "Weekly", multiplier: 52 },
  { key: "bi-weekly", label: "Bi-Weekly", multiplier: 26 },
] as const;

const DEFAULT_SPLIT = {
  needs_percentage: 50,
  wants_percentage: 30,
  savings_percentage: 20,
} as const;

const BUCKETS = [
  {
    key: "needs",
    label: "Needs",
    color: "#ef4444",
    recommendedPercentage: 50,
    description: "Essential expenses like rent, utilities, groceries",
  },
  {
    key: "wants",
    label: "Wants",
    color: "#3b82f6",
    recommendedPercentage: 30,
    description: "Entertainment, dining out, hobbies",
  },
  {
    key: "savings",
    label: "Savings",
    color: "#22c55e",
    recommendedPercentage: 20,
    description: "Emergency fund, investments, debt repayment",
  },
] as const;

const INCOME_CONSTRAINTS = {
  MIN_AMOUNT: 0.01,
  MAX_AMOUNT: 99999999.99,
  MIN_SOURCE_LENGTH: 2,
  MAX_SOURCE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_PERCENTAGE: 0,
  MAX_PERCENTAGE: 100,
  REQUIRED_PERCENTAGE_SUM: 100,
} as const;

const IncomeFormSchema = z.object({
  source: z
    .string()
    .min(
      INCOME_CONSTRAINTS.MIN_SOURCE_LENGTH,
      `Source must be at least ${INCOME_CONSTRAINTS.MIN_SOURCE_LENGTH} characters`
    ),
  description: z
    .string()
    .max(
      INCOME_CONSTRAINTS.MAX_DESCRIPTION_LENGTH,
      `Description must be less than ${INCOME_CONSTRAINTS.MAX_DESCRIPTION_LENGTH} characters`
    )
    .optional(),
  amount: z
    .number()
    .min(
      INCOME_CONSTRAINTS.MIN_AMOUNT,
      `Amount must be at least ₹${INCOME_CONSTRAINTS.MIN_AMOUNT}`
    ),
  frequency: z.enum(["monthly", "yearly", "weekly", "bi-weekly"]),
  needs_percentage: z.number().min(0).max(100),
  wants_percentage: z.number().min(0).max(100),
  savings_percentage: z.number().min(0).max(100),
  is_active: z.boolean(),
});

const AddIncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  income,
  categories = [],
  mode = income ? "edit" : "create",
}) => {
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = mode === "edit" || !!income;
  console.log(isSaving);

  // Category allocation state
  const [categoryAllocations, setCategoryAllocations] = useState<{
    needs: CategoryAllocation[];
    wants: CategoryAllocation[];
    savings: CategoryAllocation[];
  }>({
    needs: [],
    wants: [],
    savings: [],
  });

  const [expandedBuckets, setExpandedBuckets] = useState<
    Record<string, boolean>
  >({
    needs: true,
    wants: false,
    savings: false,
  });

  const form = useForm<z.infer<typeof IncomeFormSchema>>({
    resolver: zodResolver(IncomeFormSchema),
    defaultValues: {
      source: "",
      description: "",
      amount: 0,
      frequency: "monthly",
      needs_percentage: DEFAULT_SPLIT.needs_percentage,
      wants_percentage: DEFAULT_SPLIT.wants_percentage,
      savings_percentage: DEFAULT_SPLIT.savings_percentage,
      is_active: true,
    },
  });

  // Fetch enhanced income data if editing
  useEffect(() => {
    const fetchEnhancedIncomeData = async () => {
      if (income?.id && isEditMode) {
        try {
          // Try to fetch enhanced data
          const { data: enhancedData, error } = await supabase
            .from("incomes_with_category_allocations")
            .select("*")
            .eq("id", income.id)
            .single();

          if (enhancedData && !error) {
            // Use enhanced data
            const enhancedIncome = enhancedData as EnhancedIncome;

            form.reset({
              source: enhancedIncome.source,
              description: enhancedIncome.description || "",
              amount: enhancedIncome.amount,
              frequency: enhancedIncome.frequency,
              needs_percentage: enhancedIncome.needs_percentage,
              wants_percentage: enhancedIncome.wants_percentage,
              savings_percentage: enhancedIncome.savings_percentage,
              is_active: enhancedIncome.is_active,
            });

            setCategoryAllocations({
              needs: enhancedIncome.needs_category_allocations || [],
              wants: enhancedIncome.wants_category_allocations || [],
              savings: enhancedIncome.savings_category_allocations || [],
            });
          }
        } catch (error) {
          console.log(
            "Enhanced view not available, using basic income data",
            error
          );
        }
      }
    };

    if (income) {
      if (isEditMode && income.id) {
        fetchEnhancedIncomeData();
      } else {
        // Use provided income data
        form.reset({
          source: income.source || "",
          description: income.description || "",
          amount: income.amount || 0,
          frequency: income.frequency || "monthly",
          needs_percentage:
            income.needs_percentage || DEFAULT_SPLIT.needs_percentage,
          wants_percentage:
            income.wants_percentage || DEFAULT_SPLIT.wants_percentage,
          savings_percentage:
            income.savings_percentage || DEFAULT_SPLIT.savings_percentage,
          is_active: income.is_active ?? true,
        });

        setCategoryAllocations({
          needs: income.needs_category_allocations || [],
          wants: income.wants_category_allocations || [],
          savings: income.savings_category_allocations || [],
        });
      }
    } else {
      // Reset for new income
      form.reset({
        source: "",
        description: "",
        amount: 0,
        frequency: "monthly",
        needs_percentage: DEFAULT_SPLIT.needs_percentage,
        wants_percentage: DEFAULT_SPLIT.wants_percentage,
        savings_percentage: DEFAULT_SPLIT.savings_percentage,
        is_active: true,
      });
      setCategoryAllocations({
        needs: [],
        wants: [],
        savings: [],
      });
    }
  }, [income, isEditMode, form]);

  // Watch form values for calculations
  const watchedPercentages = form.watch([
    "needs_percentage",
    "wants_percentage",
    "savings_percentage",
  ]);
  const watchedAmount = form.watch("amount");
  const watchedFrequency = form.watch("frequency");

  const totalPercentage = watchedPercentages.reduce(
    (sum, val) => sum + (val || 0),
    0
  );
  const isPercentageValid =
    totalPercentage === INCOME_CONSTRAINTS.REQUIRED_PERCENTAGE_SUM;

  const calculateMonthlyAmount = () => {
    if (!watchedAmount || !watchedFrequency) return 0;
    const freq = INCOME_FREQUENCIES.find((f) => f.key === watchedFrequency);
    return freq ? (watchedAmount * freq.multiplier) / 12 : watchedAmount;
  };

  const calculateYearlyAmount = () => {
    if (!watchedAmount || !watchedFrequency) return 0;
    const freq = INCOME_FREQUENCIES.find((f) => f.key === watchedFrequency);
    return freq ? watchedAmount * freq.multiplier : watchedAmount;
  };

  const monthlyAmount = calculateMonthlyAmount();
  const yearlyAmount = calculateYearlyAmount();

  // Category allocation helpers
  const getCategoriesForBucket = (bucketKey: "needs" | "wants" | "savings") => {
    return categories.filter(
      (cat) => cat.bucket === bucketKey && cat.is_active
    );
  };

  const getUnallocatedPercentage = (
    bucketKey: "needs" | "wants" | "savings"
  ) => {
    const totalAllocated = categoryAllocations[bucketKey].reduce(
      (sum, alloc) => sum + alloc.allocated_percentage,
      0
    );
    return form.getValues(`${bucketKey}_percentage`) - totalAllocated;
  };

  const updateCategoryAllocation = (
    bucketKey: "needs" | "wants" | "savings",
    categoryId: string,
    newPercentage: number
  ) => {
    setCategoryAllocations((prev) => ({
      ...prev,
      [bucketKey]: prev[bucketKey].map((alloc) =>
        alloc.category_id === categoryId
          ? { ...alloc, allocated_percentage: Math.max(0, newPercentage) }
          : alloc
      ),
    }));
  };

  const addCategoryAllocation = (
    bucketKey: "needs" | "wants" | "savings",
    categoryId: string
  ) => {
    const category = categories.find((cat) => cat.id === categoryId);
    const unallocated = getUnallocatedPercentage(bucketKey);

    if (category && unallocated > 0) {
      setCategoryAllocations((prev) => ({
        ...prev,
        [bucketKey]: [
          ...prev[bucketKey],
          {
            category_id: categoryId,
            category_name: category.name,
            category_color: category.color,
            allocated_percentage: Math.min(1, unallocated),
          },
        ],
      }));
    }
  };

  const removeCategoryAllocation = (
    bucketKey: "needs" | "wants" | "savings",
    categoryId: string
  ) => {
    setCategoryAllocations((prev) => ({
      ...prev,
      [bucketKey]: prev[bucketKey].filter(
        (alloc) => alloc.category_id !== categoryId
      ),
    }));
  };

  const resetToDefault = () => {
    form.setValue("needs_percentage", DEFAULT_SPLIT.needs_percentage);
    form.setValue("wants_percentage", DEFAULT_SPLIT.wants_percentage);
    form.setValue("savings_percentage", DEFAULT_SPLIT.savings_percentage);
    setCategoryAllocations({
      needs: [],
      wants: [],
      savings: [],
    });
    toast.success("Reset to 50/30/20 split!");
  };

  const balancePercentages = () => {
    const currentNeeds = form.getValues("needs_percentage") || 0;
    const currentWants = form.getValues("wants_percentage") || 0;
    const currentSavings = form.getValues("savings_percentage") || 0;
    const total = currentNeeds + currentWants + currentSavings;

    if (total === 0) {
      resetToDefault();
      return;
    }

    // Proportionally adjust to sum to 100
    const factor = 100 / total;
    form.setValue("needs_percentage", Math.round(currentNeeds * factor));
    form.setValue("wants_percentage", Math.round(currentWants * factor));
    form.setValue("savings_percentage", Math.round(currentSavings * factor));

    toast.success("Percentages balanced to 100%!");
  };

  const toggleBucketExpansion = (bucketKey: "needs" | "wants" | "savings") => {
    setExpandedBuckets((prev) => ({
      ...prev,
      [bucketKey]: !prev[bucketKey as keyof typeof prev],
    }));
  };

  const onSubmit = async (values: z.infer<typeof IncomeFormSchema>) => {
    if (!isPercentageValid) {
      toast.error("Percentages must add up to 100%");
      return;
    }

    setIsSaving(true);
    try {
      let incomeId = income?.id;

      // Save or update income
      if (isEditMode && income?.id) {
        const { error } = await supabase
          .from("incomes")
          .update({
            source: values.source,
            description: values.description,
            amount: values.amount,
            frequency: values.frequency,
            needs_percentage: values.needs_percentage,
            wants_percentage: values.wants_percentage,
            savings_percentage: values.savings_percentage,
            is_active: values.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", income.id)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("incomes")
          .insert([
            {
              user_id: user.id,
              source: values.source,
              description: values.description,
              amount: values.amount,
              frequency: values.frequency,
              needs_percentage: values.needs_percentage,
              wants_percentage: values.wants_percentage,
              savings_percentage: values.savings_percentage,
              is_active: values.is_active,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        incomeId = data.id;
      }

      // Save category allocations (if enhanced table exists)
      if (incomeId) {
        try {
          // Delete existing allocations
          await supabase
            .from("income_category_allocations")
            .delete()
            .eq("income_id", incomeId);

          // Insert new allocations
          const allAllocations = [
            ...categoryAllocations.needs,
            ...categoryAllocations.wants,
            ...categoryAllocations.savings,
          ].filter((alloc) => alloc.allocated_percentage > 0);

          if (allAllocations.length > 0) {
            const { error: allocError } = await supabase
              .from("income_category_allocations")
              .insert(
                allAllocations.map((alloc) => ({
                  income_id: incomeId,
                  category_id: alloc.category_id,
                  allocated_percentage: alloc.allocated_percentage,
                }))
              );

            if (allocError) {
              console.log(
                "Category allocations not saved (table may not exist):",
                allocError
              );
            }
          }
        } catch (allocError) {
          console.log("Category allocation feature not available:", allocError);
          // Continue without category allocations
        }
      }

      toast.success(
        isEditMode
          ? "Income updated successfully!"
          : "Income created successfully!"
      );
      onClose();
    } catch (error) {
      console.error("Error saving income:", error);
      toast.error("Failed to save income. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setCategoryAllocations({
      needs: [],
      wants: [],
      savings: [],
    });
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasCategories = categories.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto bg-[var(--accesscontrol-background)]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Income Source" : "Add New Income Source"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your income source and budget allocation with category-level detail."
              : "Add a new income source and allocate it to specific categories within each budget bucket."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Income Details
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="text"
                      placeholder="e.g., Salary, Freelance, Business, Rental Income"
                      label="Income Source"
                      required
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="textarea"
                      placeholder="Optional description for this income source"
                      label="Description"
                      rows={2}
                    />
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="number"
                      placeholder="50000"
                      label="Amount (₹)"
                      required
                      step="0.01"
                      onChange={(e) =>
                        field.onChange(parseFloat(e.target.value) || 0)
                      }
                    />
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-900">
                        Frequency *
                      </label>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          {INCOME_FREQUENCIES.map((freq) => (
                            <SelectItem key={freq.key} value={freq.key}>
                              <div className="flex flex-col">
                                <span>{freq.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                />
              </div>

              {/* Preview calculations */}
              {(monthlyAmount > 0 || yearlyAmount > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Monthly Equivalent
                      </span>
                    </div>
                    <div className="text-lg font-bold text-blue-900">
                      {formatCurrency(monthlyAmount)}
                    </div>
                    <div className="text-xs text-blue-700">
                      For budget planning
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Yearly Total
                      </span>
                    </div>
                    <div className="text-lg font-bold text-green-900">
                      {formatCurrency(yearlyAmount)}
                    </div>
                    <div className="text-xs text-green-700">
                      Annual projection
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Budget Allocation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  Budget Allocation
                </h3>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={balancePercentages}
                    title="Auto Balance"
                    className="text-xs"
                  ></Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetToDefault}
                    title="Reset to 50/30/20"
                    className="text-xs"
                  ></Button>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">
                      50/30/20 Rule Recommended:
                    </p>
                    <p>
                      50% for Needs (essentials) • 30% for Wants (lifestyle) •
                      20% for Savings (future)
                    </p>
                    {hasCategories && (
                      <p className="mt-1 text-xs">
                        ✨ You can now allocate specific amounts to categories
                        within each bucket!
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {BUCKETS.map((bucket) => {
                  const bucketPercentage = form.watch(
                    `${bucket.key}_percentage`
                  ) as number;
                  const bucketAmount = (monthlyAmount * bucketPercentage) / 100;
                  const allocations = categoryAllocations[bucket.key];
                  const unallocatedPercentage = getUnallocatedPercentage(
                    bucket.key
                  );
                  const unallocatedAmount =
                    (monthlyAmount * unallocatedPercentage) / 100;
                  const isExpanded = expandedBuckets[bucket.key];
                  const availableCategories = getCategoriesForBucket(
                    bucket.key
                  ).filter(
                    (cat) =>
                      !allocations.some((alloc) => alloc.category_id === cat.id)
                  );
                  const hasCategoriesForBucket =
                    getCategoriesForBucket(bucket.key).length > 0;

                  return (
                    <div
                      key={bucket.key}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      {/* Bucket Header */}
                      <div className="flex items-center justify-between mb-4">
                        {hasCategoriesForBucket ? (
                          <button
                            type="button"
                            onClick={() => toggleBucketExpansion(bucket.key)}
                            className="flex items-center gap-2 text-left flex-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: bucket.color }}
                            />
                            <span className="font-medium text-gray-900">
                              {bucket.label}
                            </span>
                            <span className="text-sm text-gray-500">
                              (Target: {bucket.recommendedPercentage}%)
                            </span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2 text-left flex-1">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: bucket.color }}
                            />
                            <span className="font-medium text-gray-900">
                              {bucket.label}
                            </span>
                            <span className="text-sm text-gray-500">
                              (Target: {bucket.recommendedPercentage}%)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bucket Percentage Input */}
                      <div className="mb-4">
                        <FormField
                          control={form.control}
                          name={`${bucket.key}_percentage` as any}
                          render={({ field }) => (
                            <div className="flex items-center gap-4">
                              <Input
                                field={field}
                                type="number"
                                step="1"
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 text-center"
                              />
                              <span className="text-sm text-gray-600">%</span>
                              <span className="text-sm font-medium text-gray-900">
                                = {formatCurrency(bucketAmount)}
                              </span>
                              {unallocatedPercentage !== bucketPercentage &&
                                unallocatedPercentage > 0 && (
                                  <span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded">
                                    {unallocatedPercentage.toFixed(1)}%
                                    unallocated
                                  </span>
                                )}
                            </div>
                          )}
                        />
                      </div>

                      {/* Category Allocations */}
                      {hasCategoriesForBucket && isExpanded && (
                        <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                          <div className="text-sm font-medium text-gray-700">
                            Category Allocations:
                          </div>

                          {/* Existing Allocations */}
                          {allocations.map((allocation) => (
                            <div
                              key={allocation.category_id}
                              className="flex items-center gap-3 p-2 bg-gray-50 rounded"
                            >
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{
                                  backgroundColor:
                                    allocation.category_color || "#6b7280",
                                }}
                              />
                              <span className="flex-1 text-sm font-medium">
                                {allocation.category_name}
                              </span>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.1"
                                  value={allocation.allocated_percentage}
                                  onChange={(e) =>
                                    updateCategoryAllocation(
                                      bucket.key,
                                      allocation.category_id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-16 text-xs text-center"
                                />
                                <span className="text-xs text-gray-500">%</span>
                                <span className="text-xs text-gray-600 w-20 text-right">
                                  {formatCurrency(
                                    (monthlyAmount *
                                      allocation.allocated_percentage) /
                                      100
                                  )}
                                </span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  onClick={() =>
                                    removeCategoryAllocation(
                                      bucket.key,
                                      allocation.category_id
                                    )
                                  }
                                  className="p-1 h-6 w-6"
                                  title="X"
                                ></Button>
                              </div>
                            </div>
                          ))}

                          {/* Unallocated Amount */}
                          {unallocatedPercentage > 0 && (
                            <div className="flex items-center gap-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                              <div className="w-3 h-3 rounded-full bg-yellow-400" />
                              <span className="flex-1 text-sm text-yellow-800">
                                {bucket.label} (Unallocated)
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-yellow-700">
                                  {unallocatedPercentage.toFixed(1)}%
                                </span>
                                <span className="text-sm text-yellow-600 w-20 text-right">
                                  {formatCurrency(unallocatedAmount)}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Add Category Buttons */}
                          {availableCategories.length > 0 &&
                            unallocatedPercentage > 0 && (
                              <div className="pt-2 border-t border-gray-200">
                                <div className="text-xs text-gray-500 mb-2">
                                  Add categories:
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {availableCategories.map((category) => (
                                    <Button
                                      key={category.id}
                                      type="button"
                                      variant="outline"
                                      onClick={() =>
                                        addCategoryAllocation(
                                          bucket.key,
                                          category.id
                                        )
                                      }
                                      className="text-xs h-7"
                                      title={category.name}
                                    ></Button>
                                  ))}
                                </div>
                              </div>
                            )}

                          {/* No categories available */}
                          {availableCategories.length === 0 &&
                            allocations.length === 0 && (
                              <div className="text-center text-gray-500 text-sm py-2">
                                No categories available for this bucket
                              </div>
                            )}
                        </div>
                      )}

                      {/* No categories message */}
                      {!hasCategoriesForBucket && (
                        <div className="text-xs text-gray-500 italic">
                          No categories available for this bucket. Create
                          categories to enable detailed allocation.
                        </div>
                      )}

                      {/* Description */}
                      <div className="text-xs text-gray-500 mt-3">
                        {bucket.description}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary */}
              <div
                className={`text-center p-4 rounded-lg font-medium ${
                  isPercentageValid
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                <div className="text-lg">Total: {totalPercentage}%</div>
                <div className="text-sm mt-1">
                  {isPercentageValid
                    ? "✓ Perfect! Percentages add up to 100%"
                    : `${
                        totalPercentage > 100 ? "Over" : "Under"
                      } by ${Math.abs(
                        totalPercentage - 100
                      )}% - Must equal 100%`}
                </div>
              </div>
            </div>

            {/* Active Status */}
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={field.value}
                    onChange={field.onChange}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="is_active" className="text-sm text-gray-900">
                    Include this income source in budget calculations
                  </label>
                </div>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                title="Cancel"
                className="w-fit"
              />
              <Button
                type="submit"
                title={isEditMode ? "Update Income" : "Create Income"}
                disabled={!form.formState.isValid || !isPercentageValid}
                onClick={form.handleSubmit(onSubmit)}
                className="w-fit"
              />
            </div>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddIncomeModal;
