/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { encryptTransactionData, decryptTransactionData } from "@/utils/encryption";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormField } from "@/components/ui/form";
import { Input, Button, DatePicker } from "@/components/inputs";
import GenericFormSelect from "@/components/select";
import { Save, Tag } from "lucide-react";
import { TransactionWithDetails } from "../columnDefs";
import Dialog from "@/components/dialog";

const TransactionFormSchema = z.object({
  description: z
    .string()
    .min(2, "Description must be at least 2 characters long"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  transaction_date: z.date({ required_error: "Transaction date is required" }),
  category_id: z.string().optional(),
});

interface Category {
  id: string;
  name: string;
  bucket: string;
  color: string;
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
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [originalValues, setOriginalValues] = useState<z.infer<
    typeof TransactionFormSchema
  > | null>(null);

  const form = useForm<z.infer<typeof TransactionFormSchema>>({
    resolver: zodResolver(TransactionFormSchema),
    defaultValues: {
      amount: 0,
      transaction_date: new Date(),
      category_id: "",
    },
  });

  // Watch form values for changes
  const watchedValues = useWatch({
    control: form.control,
    name: ["description", "amount", "transaction_date", "category_id"],
  });

  // Fetch only categories (removed payees since we're using text input now)
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

        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load categories");
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
      let decryptedAmount = transaction.amount || 0;
      
      // If amount is encrypted (string), decrypt it
      if (typeof transaction.amount === 'string' && (transaction.amount as string).length > 10) {
        try {
          const decrypted = decryptTransactionData({
            amount: transaction.amount,
          });
          decryptedAmount = decrypted.amount;
        } catch (decryptError) {
          console.error("Error decrypting transaction amount:", transaction.id, decryptError);
          // Fallback to parsing the amount if it's a numeric string
          decryptedAmount = parseFloat(transaction.amount) || 0;
        }
      } else {
        // Use amount directly if it's already a number
        decryptedAmount = transaction.amount || 0;
      }
      
      const formData = {
        description: transaction.description || "",
        amount: decryptedAmount,
        transaction_date: transaction.transaction_date
          ? new Date(transaction.transaction_date)
          : new Date(),
        category_id: transaction.category_id || "",
      };

      form.reset(formData);
      setOriginalValues(formData);
    }
  }, [transaction, form]);

  // Check if form has changes
  const isFormDirty = () => {
    if (!originalValues || !watchedValues) return false;

    const [description, amount, transaction_date, category_id] = watchedValues;

    return (
      description !== originalValues.description ||
      amount !== originalValues.amount ||
      transaction_date?.getTime() !==
        originalValues.transaction_date.getTime() ||
      category_id !== originalValues.category_id
    );
  };

  const onSubmit = async (values: z.infer<typeof TransactionFormSchema>) => {
    if (!transaction || !user?.id) return;

    if (!isFormDirty()) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    try {
      // Encrypt the transaction amount
      const encryptedTransaction = encryptTransactionData({
        amount: values.amount,
      });
      
      const updateData = {
        description: values.description,
        amount: encryptedTransaction.amount,
        transaction_date: values.transaction_date.toISOString().split("T")[0],
        category_id:
          values.category_id && values.category_id !== ""
            ? values.category_id
            : null,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("transactions")
        .update(updateData)
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
    setOriginalValues(null);
    onClose();
  };

  return (
    <Dialog
      isLoading={isLoadingData}
      isOpen={isOpen}
      handleClose={handleClose}
      title={
        <>
          <Tag size={20} />
          Edit Transaction
        </>
      }
      description={
        <>
          Update the transaction details below. Changes will be saved to your
          expense sheet.
        </>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Date and Amount Row */}
          <div className="form-wrapper one-column">
            <FormField
              control={form.control}
              name="transaction_date"
              render={({ field }) => (
                <DatePicker
                  field={field}
                  label="Transaction Date"
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
          </div>

          <div className="form-wrapper one-column">
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
                  label="Amount"
                  required
                />
              )}
            />
          </div>

          <div className="form-wrapper one-column">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <Input
                  field={field}
                  type="text"
                  label="Description"
                  placeholder="Enter transaction description"
                  required
                />
              )}
            />
          </div>

          <div className="form-wrapper one-column no-bottom-margin">
            <FormField
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <GenericFormSelect
                  field={field}
                  options={categories}
                  displayKey="name"
                  label="Category"
                  placeholder="Select or skip category"
                  fieldName="category_id"
                  required={false}
                />
              )}
            />
          </div>

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
              disabled={!form.formState.isValid || !isFormDirty() || isSaving}
              icon={isSaving ? undefined : <Save />}
              className="w-fit"
            />
          </div>
        </form>
      </Form>
    </Dialog>
  );
};

export default EditTransactionModal;
