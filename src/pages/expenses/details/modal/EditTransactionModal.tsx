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
import { Input, Button, DatePicker } from "@/components/inputs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Save, Tag, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { TransactionWithDetails } from "../columnDefs";

const TransactionFormSchema = z.object({
  description: z
    .string()
    .min(2, "Description must be at least 2 characters long"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  transaction_date: z.date({ required_error: "Transaction date is required" }),
  category_id: z.string().optional(),
  payee_id: z.string().optional(),
  transaction_type: z.enum(["expense", "income"]),
});

interface Category {
  id: string;
  name: string;
  bucket: string;
  color: string;
}

interface Payee {
  id: string;
  name: string;
  category_id?: string;
}

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionWithDetails | null;
  onTransactionUpdated: () => void;
}

const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onTransactionUpdated,
}) => {
  const { user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const form = useForm<z.infer<typeof TransactionFormSchema>>({
    resolver: zodResolver(TransactionFormSchema),
    defaultValues: {
      amount: 0,
      transaction_date: new Date(),
      category_id: "",
      payee_id: "",
    },
  });

  // Fetch categories and payees
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      setIsLoadingData(true);
      try {
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("id, name, bucket, color")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("bucket, name");

        // Fetch payees
        const { data: payeesData } = await supabase
          .from("payees")
          .select("id, name, category_id")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("name");

        setCategories(categoriesData || []);
        setPayees(payeesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load categories and payees");
      } finally {
        setIsLoadingData(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [user?.id, isOpen]);

  // Populate form when transaction changes
  useEffect(() => {
    if (transaction) {
      form.reset({
        description: transaction.description || "",
        amount: transaction.absolute_amount || 0,
        transaction_date: transaction.transaction_date
          ? new Date(transaction.transaction_date)
          : new Date(),
        category_id: transaction.category_id || "",
        payee_id: transaction.payee_id || "",
        transaction_type: transaction.transaction_type || "expense",
      });
    }
  }, [transaction, form]);

  const onSubmit = async (values: z.infer<typeof TransactionFormSchema>) => {
    if (!transaction || !user?.id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          description: values.description,
          amount: values.amount,
          transaction_date: values.transaction_date.toISOString().split("T")[0],
          category_id:
            values.category_id && values.category_id !== ""
              ? values.category_id
              : null,
          payee_id:
            values.payee_id && values.payee_id !== "" ? values.payee_id : null,
          transaction_type: values.transaction_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Transaction updated successfully!");
      onTransactionUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const selectedCategory = categories.find(
    (cat) => cat.id === form.watch("category_id")
  );

  const selectedPayee = payees.find(
    (payee) => payee.id === form.watch("payee_id")
  );

  // Auto-select category when payee is selected
  const handlePayeeChange = (payeeId: string) => {
    form.setValue("payee_id", payeeId || "");

    if (payeeId) {
      const selectedPayeeData = payees.find((p) => p.id === payeeId);
      if (selectedPayeeData?.category_id && !form.getValues("category_id")) {
        form.setValue("category_id", selectedPayeeData.category_id);
      }
    }
  };

  if (isLoadingData) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--common-brand)]"></div>
            <span className="ml-2 text-[var(--content-textsecondary)]">
              Loading transaction data...
            </span>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!bg-[var(--content)] !border-[var(--common-inputborder)] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[var(--content-textprimary)] flex items-center gap-2">
            <Tag size={20} />
            Edit Transaction
          </DialogTitle>
          <DialogDescription className="text-[var(--content-textsecondary)]">
            Update the transaction details below. Changes will be saved to your
            expense sheet.
          </DialogDescription>
        </DialogHeader>

        {/* Transaction Overview */}
        {transaction && (
          <div className="p-4 bg-[var(--content-background)] rounded-lg border">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-[var(--content-textsecondary)]">
                  Sheet:
                </span>
                <span className="ml-2 font-medium text-[var(--content-textprimary)]">
                  {transaction.expense_sheet_name}
                </span>
              </div>
              <div>
                <span className="text-[var(--content-textsecondary)]">
                  Created:
                </span>
                <span className="ml-2 text-[var(--content-textprimary)]">
                  {format(new Date(transaction.created_at), "MMM dd, yyyy")}
                </span>
              </div>
            </div>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Transaction Type */}
            <FormField
              control={form.control}
              name="transaction_type"
              render={({ field }) => (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--content-textprimary)] flex items-center gap-2">
                    <Tag size={14} />
                    Transaction Type *
                  </label>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <SelectTrigger className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                      <SelectValue placeholder="Select transaction type" />
                    </SelectTrigger>
                    <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                      <SelectItem value="expense">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[var(--common-error)]" />
                          <span>Expense</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="income">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-[var(--common-success)]" />
                          <span>Income</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            />

            {/* Date and Amount Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transaction_date"
                render={({ field }) => (
                  <DatePicker
                    field={field}
                    label="Transaction Date *"
                    placeholder="Pick transaction date"
                    required
                    onChange={(selectedDate) => {
                      form.setValue(
                        "transaction_date",
                        selectedDate || new Date(),
                        {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        }
                      );
                    }}
                  />
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <Input
                    field={{
                      ...field,
                      value: field.value || "",
                      onChange: (e: any) => {
                        const value = parseFloat(e.target.value) || 0;
                        field.onChange(value);
                      },
                    }}
                    type="number"
                    min="0.01"
                    step="0.01"
                    label="Amount *"
                    required
                  />
                )}
              />
            </div>

            {/* Payee Selection */}
            <FormField
              control={form.control}
              name="payee_id"
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--content-textprimary)]">
                      Payee (Optional)
                    </label>
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => handlePayeeChange("")}
                        className="text-xs text-[var(--content-textsecondary)] h-auto p-1"
                        title="Clear selection"
                      ></Button>
                    )}
                  </div>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => handlePayeeChange(value || "")}
                  >
                    <SelectTrigger className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                      <SelectValue placeholder="Select or skip payee" />
                    </SelectTrigger>
                    <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                      {payees.map((payee) => (
                        <SelectItem key={payee.id} value={payee.id}>
                          {payee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedPayee?.category_id && (
                    <p className="text-xs text-[var(--content-textsecondary)]">
                      This payee is linked to a default category
                    </p>
                  )}
                </div>
              )}
            />

            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-[var(--content-textprimary)]">
                      Category (Optional)
                    </label>
                    {field.value && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => field.onChange("")}
                        className="text-xs text-[var(--content-textsecondary)] h-auto p-1"
                        title="Clear selection"
                      ></Button>
                    )}
                  </div>
                  <Select
                    value={field.value || undefined}
                    onValueChange={(value) => field.onChange(value || "")}
                  >
                    <SelectTrigger className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                      <SelectValue placeholder="Select or skip category" />
                    </SelectTrigger>
                    <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span>{category.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {category.bucket}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedCategory && (
                    <div className="flex items-center gap-2 text-xs text-[var(--content-textsecondary)]">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedCategory.color }}
                      />
                      <span>
                        {selectedCategory.name} - {selectedCategory.bucket}{" "}
                        bucket
                      </span>
                    </div>
                  )}
                </div>
              )}
            />

            {/* Form Validation Errors */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="p-3 bg-[var(--common-error)]/10 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle
                    size={16}
                    className="text-[var(--common-error)] mt-0.5"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-[var(--common-error)] mb-1">
                      Please fix the following errors:
                    </h4>
                    <ul className="text-xs text-[var(--common-error)] space-y-1">
                      {Object.entries(form.formState.errors).map(
                        ([field, error]) => (
                          <li key={field}>• {error?.message}</li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
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
                title={isSaving ? "Saving..." : "Update Transaction"}
                isLoading={isSaving}
                disabled={!form.formState.isValid}
                icon={isSaving ? undefined : <Save />}
                className="w-fit"
              />
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTransactionModal;
