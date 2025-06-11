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
import { RotateCcw, Calculator, TrendingUp, Info } from "lucide-react";
import {
  INCOME_FREQUENCIES,
  DEFAULT_SPLIT,
  BUCKETS,
  FREQUENCY_CONVERTER,
  INCOME_CONSTRAINTS,
  IncomeModalProps,
} from "../../types";

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
      `Amount cannot exceed ₹${INCOME_CONSTRAINTS.MAX_AMOUNT}`
    ),
  frequency: z.enum(["monthly", "yearly", "weekly", "bi-weekly"]),
  needs_percentage: z
    .number()
    .min(INCOME_CONSTRAINTS.MIN_PERCENTAGE)
    .max(INCOME_CONSTRAINTS.MAX_PERCENTAGE),
  wants_percentage: z
    .number()
    .min(INCOME_CONSTRAINTS.MIN_PERCENTAGE)
    .max(INCOME_CONSTRAINTS.MAX_PERCENTAGE),
  savings_percentage: z
    .number()
    .min(INCOME_CONSTRAINTS.MIN_PERCENTAGE)
    .max(INCOME_CONSTRAINTS.MAX_PERCENTAGE),
  is_active: z.boolean(),
});

const AddIncomeModal: React.FC<IncomeModalProps> = ({
  isOpen,
  onClose,
  income,
  mode = income ? "edit" : "create",
}) => {
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = mode === "edit" || !!income;

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

  useEffect(() => {
    if (income) {
      form.reset({
        source: income.source,
        description: income.description || "",
        amount: income.amount,
        frequency: income.frequency,
        needs_percentage: income.needs_percentage,
        wants_percentage: income.wants_percentage,
        savings_percentage: income.savings_percentage,
        is_active: income.is_active,
      });
    } else {
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
  }, [income, form]);

  // Watch percentages to ensure they add up to 100%
  const watchedPercentages = form.watch([
    "needs_percentage",
    "wants_percentage",
    "savings_percentage",
  ]);
  const totalPercentage = watchedPercentages.reduce(
    (sum, val) => sum + (val || 0),
    0
  );
  const isPercentageValid =
    totalPercentage === INCOME_CONSTRAINTS.REQUIRED_PERCENTAGE_SUM;

  // Watch amount and frequency for preview calculations
  const watchedAmount = form.watch("amount");
  const watchedFrequency = form.watch("frequency");

  const calculateMonthlyAmount = () => {
    if (!watchedAmount || !watchedFrequency) return 0;
    return FREQUENCY_CONVERTER.toMonthly(watchedAmount, watchedFrequency);
  };

  const calculateYearlyAmount = () => {
    if (!watchedAmount || !watchedFrequency) return 0;
    return FREQUENCY_CONVERTER.toYearly(watchedAmount, watchedFrequency);
  };

  const monthlyAmount = calculateMonthlyAmount();
  const yearlyAmount = calculateYearlyAmount();

  const resetToDefault = () => {
    form.setValue("needs_percentage", DEFAULT_SPLIT.needs_percentage);
    form.setValue("wants_percentage", DEFAULT_SPLIT.wants_percentage);
    form.setValue("savings_percentage", DEFAULT_SPLIT.savings_percentage);
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

  const onSubmit = async (values: z.infer<typeof IncomeFormSchema>) => {
    if (!isPercentageValid) {
      toast.error("Percentages must add up to 100%");
      return;
    }

    setIsSaving(true);
    try {
      if (isEditMode && income) {
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
        toast.success("Income updated successfully!");
      } else {
        const { error } = await supabase.from("incomes").insert([
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
        ]);

        if (error) throw error;
        toast.success("Income created successfully!");
      }

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
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!bg-[var(--content)] !border-[var(--common-inputborder)] max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[var(--content-textprimary)]">
            {isEditMode ? "Edit Income Source" : "Add New Income Source"}
          </DialogTitle>
          <DialogDescription className="text-[var(--content-textsecondary)]">
            {isEditMode
              ? "Update your income source and budget allocation."
              : "Add a new income source and set your budget allocation."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-[var(--content-textprimary)] flex items-center gap-2">
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
                      placeholder="Optional description for this income source (e.g., Company name, project details)"
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
                      <label className="text-sm font-medium text-[var(--content-textprimary)]">
                        Frequency *
                      </label>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                          {INCOME_FREQUENCIES.map((freq) => (
                            <SelectItem key={freq.key} value={freq.key}>
                              <div className="flex flex-col">
                                <span>{freq.label}</span>
                                {freq.description && (
                                  <span className="text-xs text-[var(--content-textsecondary)]">
                                    {freq.description}
                                  </span>
                                )}
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
                  <div className="p-4 bg-[var(--common-backgroundmuted)] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-4 h-4 text-[var(--common-brand)]" />
                      <span className="text-sm font-medium text-[var(--content-textprimary)]">
                        Monthly Equivalent
                      </span>
                    </div>
                    <div className="text-lg font-bold text-[var(--content-textprimary)]">
                      {formatCurrency(monthlyAmount)}
                    </div>
                    <div className="text-xs text-[var(--content-textsecondary)]">
                      For budget planning
                    </div>
                  </div>

                  <div className="p-4 bg-[var(--common-backgroundmuted)] rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium text-[var(--content-textprimary)]">
                        Yearly Total
                      </span>
                    </div>
                    <div className="text-lg font-bold text-[var(--content-textprimary)]">
                      {formatCurrency(yearlyAmount)}
                    </div>
                    <div className="text-xs text-[var(--content-textsecondary)]">
                      Annual projection
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="bg-[var(--content-textplaceholder)]" />

            {/* Budget Allocation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[var(--content-textprimary)] flex items-center gap-2">
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
                    icon={<Calculator className="w-3 h-3" />}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={resetToDefault}
                    title="Reset to 50/30/20"
                    className="text-xs"
                    icon={<RotateCcw className="w-3 h-3" />}
                  />
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
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {BUCKETS.map((bucket) => {
                  const fieldName = `${bucket.key}_percentage` as keyof z.infer<
                    typeof IncomeFormSchema
                  >;
                  const percentage = form.watch(fieldName) as number;
                  const amount =
                    monthlyAmount > 0 ? (monthlyAmount * percentage) / 100 : 0;

                  return (
                    <FormField
                      key={bucket.key}
                      control={form.control}
                      name={fieldName}
                      render={({ field }) => (
                        <div className="space-y-3 p-4 border border-[var(--common-inputborder)] rounded-lg">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: bucket.color }}
                            />
                            <label className="text-sm font-medium text-[var(--content-textprimary)]">
                              {bucket.label}
                            </label>
                          </div>

                          <div className="text-xs text-[var(--content-textsecondary)] mb-2">
                            {bucket.description}
                          </div>

                          <Input
                            field={field}
                            type="number"
                            placeholder="0"
                            step="1"
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                            className="text-center font-medium"
                          />

                          {amount > 0 && (
                            <div className="text-center">
                              <div className="text-sm font-medium text-[var(--content-textprimary)]">
                                {formatCurrency(amount)}
                              </div>
                              <div className="text-xs text-[var(--content-textsecondary)]">
                                per month
                              </div>
                            </div>
                          )}

                          <div className="text-center">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                Math.abs(
                                  percentage - bucket.recommendedPercentage
                                ) <= 5
                                  ? "bg-green-100 text-green-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              Target: {bucket.recommendedPercentage}%
                            </span>
                          </div>
                        </div>
                      )}
                    />
                  );
                })}
              </div>

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
                    className="rounded border-[var(--common-inputborder)]"
                  />
                  <label
                    htmlFor="is_active"
                    className="text-sm text-[var(--content-textprimary)]"
                  >
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
                isLoading={isSaving}
                disabled={!form.formState.isValid || !isPercentageValid}
                className="w-fit"
              />
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddIncomeModal;
