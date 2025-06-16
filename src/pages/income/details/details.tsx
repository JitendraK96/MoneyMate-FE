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
import Page from "@/components/page";
import Card from "@/components/card";
import { Calculator, TrendingUp, Info } from "lucide-react";

// Types
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
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-800",
    recommendedPercentage: 50,
    description: "Essential expenses like rent, utilities, groceries",
  },
  {
    key: "wants",
    label: "Wants",
    color: "#3b82f6",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    textColor: "text-blue-800",
    recommendedPercentage: 30,
    description: "Entertainment, dining out, hobbies",
  },
  {
    key: "savings",
    label: "Savings",
    color: "#22c55e",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    textColor: "text-green-800",
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
    )
    .max(
      INCOME_CONSTRAINTS.MAX_SOURCE_LENGTH,
      `Source must be less than ${INCOME_CONSTRAINTS.MAX_SOURCE_LENGTH} characters`
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
    )
    .max(
      INCOME_CONSTRAINTS.MAX_AMOUNT,
      `Amount must be less than ₹${INCOME_CONSTRAINTS.MAX_AMOUNT}`
    ),
  frequency: z.enum(["monthly", "yearly", "weekly", "bi-weekly"]),
  needs_percentage: z.number().min(0).max(100),
  wants_percentage: z.number().min(0).max(100),
  savings_percentage: z.number().min(0).max(100),
  is_active: z.boolean(),
});

const IncomeForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [income, setIncome] = useState<EnhancedIncome | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Determine if we're in edit mode
  const isEditMode = id;
  const isCreateMode = !id;
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

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) {
        navigate("/dashboard/income");
        return;
      }

      setIsLoading(true);
      try {
        // Fetch income data if editing
        if (isEditMode && id) {
          try {
            // Try enhanced view first
            const { data: enhancedData, error } = await supabase
              .from("incomes_with_category_allocations")
              .select("*")
              .eq("id", id)
              .eq("user_id", user.id)
              .single();

            if (enhancedData && !error) {
              const enhancedIncome = enhancedData as EnhancedIncome;
              setIncome(enhancedIncome);

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
              setIncome(basicData);
              form.reset({
                source: basicData.source,
                description: basicData.description || "",
                amount: basicData.amount,
                frequency: basicData.frequency,
                needs_percentage: basicData.needs_percentage,
                wants_percentage: basicData.wants_percentage,
                savings_percentage: basicData.savings_percentage,
                is_active: basicData.is_active,
              });
            }
          }
        } else if (isCreateMode) {
          // Reset form for create mode
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
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load data. Please try again.");
        navigate("/dashboard/income");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, isEditMode, isCreateMode, user?.id, navigate, form]);

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

  const resetToDefault = () => {
    form.setValue("needs_percentage", DEFAULT_SPLIT.needs_percentage);
    form.setValue("wants_percentage", DEFAULT_SPLIT.wants_percentage);
    form.setValue("savings_percentage", DEFAULT_SPLIT.savings_percentage);
    toast.success("Reset to 50/30/20 split!");
  };

  const onSubmit = async (values: z.infer<typeof IncomeFormSchema>) => {
    if (!isPercentageValid) {
      toast.error("Percentages must add up to 100%");
      return;
    }

    setIsSaving(true);
    try {
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
      } else if (isCreateMode) {
        const { error } = await supabase
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
      }

      toast.success(
        isEditMode
          ? "Income updated successfully!"
          : "Income created successfully!"
      );
      navigate("/dashboard/income");
    } catch (error) {
      console.error("Error saving income:", error);
      toast.error("Failed to save income. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  console.log(isLoading);

  return (
    <Page
      title={isEditMode ? "Edit Income Source" : "Add New Income Source"}
      subTitle={
        isEditMode
          ? "Update your income source and budget allocation percentages."
          : "Add a new income source and set your budget allocation using the 50/30/20 rule."
      }
      breadcrumbs={[
        { name: "Income Management", to: "/dashboard/income" },
        {
          name: isCreateMode ? "Add New Income Source" : "Edit Income Source",
        },
      ]}
    >
      <Form {...form}>
        <Card
          title="Income Details"
          cardContent={
            <div className="space-y-4">
              <div className="form-wrapper two-column">
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
              </div>
              <div className="form-wrapper two-column">
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
              <div className="form-wrapper two-column">
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
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                  <div className="font-size-extra-small text-blue-700">
                    <p className="font-semibold mb-1">
                      50/30/20 Rule Recommended:
                    </p>
                    <p>
                      50% for Needs (essentials) • 30% for Wants (lifestyle) •
                      20% for Savings (future)
                    </p>
                    <p className="mt-1 font-size-extra-small">
                      💡 Set your budget percentages here. You can allocate
                      specific amounts to categories later.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview calculations */}
              {(monthlyAmount > 0 || yearlyAmount > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-4 h-4 text-blue-600" />
                      <span className="font-size-extra-small font-semibold text-blue-800">
                        Monthly Equivalent
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-blue-900">
                      {formatCurrency(monthlyAmount)}
                    </div>
                    <div className="font-size-extra-small text-blue-700">
                      For budget planning
                    </div>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                      <span className="font-size-extra-small font-semibold text-green-800">
                        Yearly Total
                      </span>
                    </div>
                    <div className="text-lg font-semibold text-green-900">
                      {formatCurrency(yearlyAmount)}
                    </div>
                    <div className="font-size-extra-small text-green-700">
                      Annual projection
                    </div>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {BUCKETS.map((bucket) => {
                  const bucketPercentage = form.watch(
                    `${bucket.key}_percentage`
                  ) as number;
                  const bucketAmount = (monthlyAmount * bucketPercentage) / 100;

                  return (
                    <div
                      key={bucket.key}
                      className={`rounded-xl border-2 ${bucket.borderColor} ${bucket.bgColor} p-6 transition-all duration-200 hover:shadow-sm`}
                    >
                      {/* Bucket Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div>
                          <div
                            className={`font-semibold text-lg ${bucket.textColor}`}
                          >
                            {bucket.label}
                          </div>
                          <div className="font-size-extra-small text-gray-600">
                            {bucket.description} • Target:{" "}
                            {bucket.recommendedPercentage}%
                          </div>
                        </div>
                      </div>

                      {/* Bucket Percentage Input */}
                      <FormField
                        control={form.control}
                        name={`${bucket.key}_percentage` as any}
                        render={({ field }) => (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Input
                                field={field}
                                type="number"
                                step="1"
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 text-center text-lg font-semibold"
                              />
                              <span className="text-lg font-size-extra-small text-gray-600">
                                %
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">=</span>
                              <span className="text-lg font-bold text-gray-900">
                                {formatCurrency(bucketAmount)}
                              </span>
                              <span className="font-size-extra-small text-gray-500">
                                /month
                              </span>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  );
                })}
              </div>
              <div
                className={`text-center p-6 rounded-xl font-medium border-2 ${
                  isPercentageValid
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-red-50 text-red-700 border-red-200"
                }`}
              >
                <div className="text-2xl font-bold mb-2">
                  Total: {totalPercentage}%
                </div>
                <div className="text-base">
                  {isPercentageValid
                    ? "✓ Perfect! Percentages add up to 100%"
                    : `${
                        totalPercentage > 100 ? "Over" : "Under"
                      } by ${Math.abs(
                        totalPercentage - 100
                      )}% - Must equal 100%`}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  title={
                    isSaving
                      ? "Saving..."
                      : isEditMode
                      ? "Update Income"
                      : "Create Income"
                  }
                  disabled={
                    !form.formState.isValid ||
                    !isPercentageValid ||
                    isSaving ||
                    (Boolean(isEditMode) && !form.formState.isDirty)
                  }
                  onClick={form.handleSubmit(onSubmit)}
                  className="w-fit"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={resetToDefault}
                  title="Reset to 50/30/20"
                  className="w-fit"
                />
              </div>
            </div>
          }
        />
      </Form>
    </Page>
  );
};

export default IncomeForm;
