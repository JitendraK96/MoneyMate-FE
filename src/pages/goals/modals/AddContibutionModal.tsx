/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormField } from "@/components/ui/form";
import { Input, DatePicker } from "@/components/inputs";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { Button } from "@/components/inputs";
import { encryptContributionData, encryptGoalData } from "@/utils/encryption";

const ContributionFormSchema = z.object({
  amount: z
    .number({
      required_error: "Contribution amount is required.",
      invalid_type_error: "Contribution amount must be a number.",
    })
    .min(1, { message: "Contribution amount must be at least ₹1." })
    .max(10000000, {
      message: "Contribution amount cannot exceed ₹1,00,00,000.",
    }),
  contributionDate: z
    .date({
      required_error: "Contribution date is required.",
      invalid_type_error: "Contribution date must be a valid date.",
    })
    .refine((d) => d <= new Date(), {
      message: "Contribution date cannot be in the future.",
    })
    .nullable(),
  description: z
    .string()
    .max(200, { message: "Description must not exceed 200 characters." })
    .optional()
    .or(z.literal("")),
});

interface AddContributionModalProps {
  goal: any;
  isOpen: boolean;
  onClose: () => void;
  onContributionAdded: () => void;
}

const AddContributionModal = ({
  goal,
  isOpen,
  onClose,
  onContributionAdded,
}: AddContributionModalProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof ContributionFormSchema>>({
    resolver: zodResolver(ContributionFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: {
      amount: 0,
      contributionDate: new Date(),
      description: "",
    },
  });

  const {
    formState: { isValid },
    reset,
  } = form;

  const handleSubmit = async (
    values: z.infer<typeof ContributionFormSchema>
  ) => {
    if (!values.contributionDate) {
      toast.error("Please select a contribution date.");
      return;
    }

    setIsSaving(true);

    try {
      // Encrypt contribution data
      const encryptedContribution = encryptContributionData({
        amount: values.amount,
      });

      // Add contribution to database
      const { error: contributionError } = await supabase
        .from("contributions")
        .insert([
          {
            goal_id: goal.id,
            amount: encryptedContribution.amount,
            contribution_date: values.contributionDate
              .toISOString()
              .split("T")[0],
            description: values.description || null,
          },
        ]);

      if (contributionError) {
        throw new Error(contributionError.message);
      }

      // Encrypt updated goal balance
      const newBalance = goal.current_balance + values.amount;
      const encryptedGoal = encryptGoalData({
        target_amount: goal.target_amount,
        current_balance: newBalance,
      });

      // Update goal's current balance
      const { error: updateError } = await supabase
        .from("goals")
        .update({
          current_balance: encryptedGoal.current_balance,
          is_completed: newBalance >= goal.target_amount,
        })
        .eq("id", goal.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      toast.success("Contribution added successfully!");
      reset();
      onClose();
      onContributionAdded();
    } catch (error) {
      console.error("Error adding contribution:", error);
      toast.error("Failed to add contribution. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const remainingAmount = Math.max(
    0,
    goal.target_amount - goal.current_balance
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-[var(--content-background)] border-0">
        <DialogHeader>
          <DialogTitle className="text-[var(--content-textprimary)] card-header-title">
            Add Contribution to "{goal.name}"
          </DialogTitle>
          <DialogDescription className="font-size-extra-small text-[var(--content-textsecondary)]">
            Add a new contribution to your goal. You need{" "}
            <span className="font-semibold">
              ₹{remainingAmount.toLocaleString("en-IN")}
            </span>{" "}
            more to reach your target.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <Input
                    field={field}
                    type="number"
                    required
                    placeholder="Enter amount"
                    label="Contribution Amount"
                    onChange={(e) => {
                      const value = e.target.value;
                      const numValue = value === "" ? 0 : Number(value);
                      form.setValue("amount", numValue, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="contributionDate"
                render={({ field }) => (
                  <DatePicker
                    field={field}
                    label="Contribution Date"
                    placeholder="Select date"
                    required
                    onChange={(selectedDate) => {
                      form.setValue("contributionDate", selectedDate || null, {
                        shouldValidate: true,
                        shouldDirty: true,
                        shouldTouch: true,
                      });
                    }}
                  />
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <Input
                  field={field}
                  type="textarea"
                  placeholder="Optional note about this contribution"
                  label="Description (Optional)"
                  onChange={(e) => {
                    const value = e.target.value;
                    form.setValue("description", value, {
                      shouldValidate: true,
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }}
                />
              )}
            />
          </form>
        </Form>

        <DialogFooter className="flex gap-2">
          <Button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="!bg-[var(--common-brand)] flex-1"
            title="Cancel"
          ></Button>
          <Button
            type="button"
            onClick={form.handleSubmit(handleSubmit)}
            disabled={!isValid || isSaving}
            className="!bg-[var(--common-brand)]  flex-1"
            title="Add Contribution"
          ></Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddContributionModal;
