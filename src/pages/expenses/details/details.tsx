/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";
import Page from "@/components/page";
import Card from "@/components/card";
import { Button } from "@/components/inputs";
import { Input } from "@/components/inputs";
import DataTable from "@/components/table";

import { Form, FormField } from "@/components/ui/form";
import { toast } from "sonner";
import { Upload, History, Save } from "lucide-react";
import UploadStatementModal from "./modal/UploadStatementModal";
import EditTransactionModal from "./modal/EditTransactionModal";
import { getTransactionColumns, TransactionWithDetails } from "./columnDefs";
import GenericFormSelect from "@/components/select";

// Validation Schema
const ExpenseSheetSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Sheet name must be at least 2 characters long." })
    .max(255, { message: "Sheet name must not exceed 255 characters." }),
  description: z
    .string()
    .max(1000, { message: "Description must not exceed 1000 characters." })
    .optional()
    .or(z.literal("")),
  linkedIncomeId: z
    .string()
    .min(1, { message: "Please select an income source." }),
});

type ExpenseSheetFormData = z.infer<typeof ExpenseSheetSchema>;

interface ParsedTransaction {
  id: string;
  date: string;
  payee: string;
  amount: number;
  category_id?: string;
  isValid: boolean;
  errors: string[];
}

interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: string;
}

interface ExpenseSheet {
  id: string;
  name: string;
  description?: string;
  income_id?: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const CreateExpenseSheet = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);

  // Form setup
  const form = useForm<ExpenseSheetFormData>({
    resolver: zodResolver(ExpenseSheetSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: {
      name: "",
      description: "",
      linkedIncomeId: "",
    },
  });

  const watchedValues = useWatch({
    control: form.control,
    name: ["name", "description", "linkedIncomeId"],
  });

  const [name, description, linkedIncomeId] = watchedValues;

  const {
    formState: { isValid },
  } = form;

  // Custom isDirty calculation
  const isFormDirty = () => {
    if (!isEditMode) return true; // Always allow saving in create mode

    const currentValues = {
      name: (name || "").trim(),
      description: (description || "").trim(),
      linkedIncomeId: linkedIncomeId || "",
    };

    const original = {
      name: (originalValues.name || "").trim(),
      description: (originalValues.description || "").trim(),
      linkedIncomeId: originalValues.linkedIncomeId || "",
    };

    return (
      currentValues.name !== original.name ||
      currentValues.description !== original.description ||
      currentValues.linkedIncomeId !== original.linkedIncomeId
    );
  };

  // Data states
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [existingTransactions, setExistingTransactions] = useState<
    TransactionWithDetails[]
  >([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [currentExpenseSheet, setCurrentExpenseSheet] =
    useState<ExpenseSheet | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalValues, setOriginalValues] = useState<ExpenseSheetFormData>({
    name: "",
    description: "",
    linkedIncomeId: "",
  });

  // Modal states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionWithDetails | null>(null);

  // Search state for transactions table
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch expense sheet data for edit mode
  const fetchExpenseSheet = async (sheetId: string) => {
    if (!user?.id) return;

    setIsLoadingSheet(true);
    try {
      const { data, error } = await supabase
        .from("expense_sheets")
        .select("*")
        .eq("id", sheetId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setCurrentExpenseSheet(data);

        // Populate form with existing data
        const formData = {
          name: data.name || "",
          description: data.description || "",
          linkedIncomeId: data.income_id || "",
        };

        form.setValue("name", formData.name);
        form.setValue("description", formData.description);
        form.setValue("linkedIncomeId", formData.linkedIncomeId);

        // Set original values for dirty comparison
        setOriginalValues(formData);
      }
    } catch (error) {
      console.error("Error fetching expense sheet:", error);
      toast.error("Failed to load expense sheet data");
      navigate("/dashboard/expenses");
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Fetch incomes
        const { data: incomesData } = await supabase
          .from("incomes")
          .select("id, source, amount, frequency")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("source");

        setIncomes(incomesData || []);

        // If edit mode, fetch expense sheet data and then transactions
        if (isEditMode && id) {
          await fetchExpenseSheet(id);
          await fetchExistingTransactions(id);
        }
        // Note: No longer fetching transactions in create mode
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data");
      }
    };

    fetchData();
  }, [user?.id, isEditMode, id]);

  // Fetch existing transactions - only for edit mode with specific expense sheet
  const fetchExistingTransactions = async (expenseSheetId?: string) => {
    if (!user?.id || !isEditMode || !expenseSheetId) return;

    setIsLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from("transactions_with_details")
        .select("*")
        .eq("user_id", user.id)
        .eq("expense_sheet_id", expenseSheetId)
        .eq("is_active", true)
        .order("transaction_date", { ascending: false });

      if (error) throw error;

      setExistingTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load expense sheet transactions");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Save/Update sheet only (without transactions)
  const handleSaveSheetOnly = async () => {
    if (!user?.id || !isValid) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (isEditMode && !isFormDirty()) {
      toast.info("No changes to save");
      return;
    }

    setIsSaving(true);
    try {
      const trimmedValues = {
        name: name.trim(),
        description: description?.trim() || "",
        linkedIncomeId: linkedIncomeId || "",
      };

      if (isEditMode && currentExpenseSheet) {
        // Update existing expense sheet
        const { error: sheetError } = await supabase
          .from("expense_sheets")
          .update({
            name: trimmedValues.name,
            description: trimmedValues.description || null,
            income_id: trimmedValues.linkedIncomeId || null,
          })
          .eq("id", currentExpenseSheet.id)
          .eq("user_id", user.id);

        if (sheetError) throw sheetError;

        toast.success(
          `Expense sheet "${trimmedValues.name}" updated successfully`
        );

        // Update original values to current values after successful save
        setOriginalValues(trimmedValues);
      } else {
        // Create new expense sheet
        const { data: sheetData, error: sheetError } = await supabase
          .from("expense_sheets")
          .insert([
            {
              user_id: user.id,
              name: trimmedValues.name,
              description: trimmedValues.description || null,
              income_id: trimmedValues.linkedIncomeId || null,
            },
          ])
          .select()
          .single();

        if (sheetError) throw sheetError;

        toast.success(
          `Expense sheet "${trimmedValues.name}" created successfully`
        );
        // Navigate to the new sheet's edit page
        navigate(`/dashboard/expenses/${sheetData.id}`);
      }
    } catch (error) {
      console.error("Error saving expense sheet:", error);
      toast.error("Failed to save expense sheet. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save functionality for the modal
  const handleSaveFromModal = async (
    validTransactions: ParsedTransaction[]
  ) => {
    if (validTransactions.length === 0) {
      throw new Error("No valid transactions to save");
    }

    let sheetId: string;

    if (isEditMode && currentExpenseSheet) {
      // Update existing expense sheet
      const { error: sheetError } = await supabase
        .from("expense_sheets")
        .update({
          name: name.trim(),
          description: description?.trim() || null,
          income_id: linkedIncomeId || null,
        })
        .eq("id", currentExpenseSheet.id)
        .eq("user_id", user.id);

      if (sheetError) throw sheetError;
      sheetId = currentExpenseSheet.id;
    } else {
      // Create new expense sheet
      const { data: sheetData, error: sheetError } = await supabase
        .from("expense_sheets")
        .insert([
          {
            user_id: user.id,
            name: name.trim(),
            description: description?.trim() || null,
            income_id: linkedIncomeId || null,
          },
        ])
        .select()
        .single();

      if (sheetError) throw sheetError;
      sheetId = sheetData.id;
    }

    // Prepare transactions for bulk insert
    const transactionsForInsert = validTransactions.map((t) => ({
      expense_sheet_id: sheetId,
      user_id: user.id,
      amount: t.amount,
      description: t.payee,
      category_id: t.category_id || null,
      payee_id: null,
      transaction_date: t.date,
      transaction_type: "expense",
    }));

    // Insert transactions
    const { error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionsForInsert);

    if (transactionError) throw transactionError;

    const actionText = isEditMode ? "updated" : "created";
    toast.success(
      `Expense sheet "${name}" ${actionText} with ${validTransactions.length} transactions`
    );

    // Refresh existing transactions only if in edit mode
    if (isEditMode) {
      await fetchExistingTransactions(sheetId);
    }

    navigate(`/dashboard/expenses/${sheetId}`);
  };

  // Handle transaction edit
  const handleEditTransaction = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  // Handle transaction updated
  const handleTransactionUpdated = () => {
    if (isEditMode && id) {
      fetchExistingTransactions(id);
    }
    setSelectedTransaction(null);
    setIsEditModalOpen(false);
  };

  // Handle transaction delete
  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", transactionId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Transaction deleted successfully!");
      if (isEditMode && id) {
        await fetchExistingTransactions(id);
      }
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast.error("Failed to delete transaction. Please try again.");
    }
  };

  // Handle search
  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  // Filter existing transactions based on search
  const filteredTransactions = existingTransactions.filter((transaction) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      transaction.description.toLowerCase().includes(searchLower) ||
      transaction.expense_sheet_name.toLowerCase().includes(searchLower) ||
      (transaction.category_name &&
        transaction.category_name.toLowerCase().includes(searchLower)) ||
      (transaction.payee_name &&
        transaction.payee_name.toLowerCase().includes(searchLower))
    );
  });

  const pageTitle = isEditMode
    ? "Update Expense Sheet"
    : "Create Expense Sheet";
  const pageSubtitle = isEditMode
    ? "Modify expense sheet details and add new transactions"
    : "Create a new expense sheet and upload transactions from Excel";

  if (isLoadingSheet) {
    return (
      <Page title={pageTitle} subTitle={pageSubtitle}>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--common-brand)]"></div>
          <span className="ml-2 text-[var(--content-textsecondary)]">
            Loading expense sheet...
          </span>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={pageTitle}
      subTitle={pageSubtitle}
      breadcrumbs={[
        { name: "Expense Sheets", to: "/dashboard/expenses" },
        {
          name: isEditMode ? "Update Expense Sheet" : "Create Expense Sheet",
        },
      ]}
    >
      <div className="space-y-6">
        {/* Sheet Details Form */}
        <Card
          title="Details"
          cardContent={
            <Form {...form}>
              <form>
                <div className="form-wrapper">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <Input
                        field={field}
                        type="text"
                        placeholder="e.g., Monthly Expenses, Vacation Budget"
                        label="Sheet Name"
                        required
                        onChange={(e) => {
                          const value = e.target.value;
                          form.setValue("name", value, {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                        }}
                      />
                    )}
                  />
                </div>

                <div className="form-wrapper">
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

                <div className="form-wrapper no-bottom-margin">
                  <FormField
                    control={form.control}
                    name="linkedIncomeId"
                    render={({ field }) => (
                      <GenericFormSelect
                        field={field}
                        options={incomes}
                        displayKey="source"
                        label="Link to Income"
                        placeholder="Select income source"
                        fieldName="linkedIncomeId"
                        required={true}
                      />
                    )}
                  />
                </div>
              </form>
            </Form>
          }
          footerContent={
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                onClick={handleSaveSheetOnly}
                disabled={
                  !isValid || isSaving || (isEditMode && !isFormDirty())
                }
                icon={<Save />}
                title={
                  isEditMode
                    ? isSaving
                      ? "Updating..."
                      : "Update Sheet"
                    : isSaving
                    ? "Creating..."
                    : "Create Sheet"
                }
                className="w-fit"
              />
              <Button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                disabled={isEditMode ? false : !isValid}
                icon={<Upload />}
                title="Upload Statement"
                className="w-fit"
              />
            </div>
          }
        />

        {/* Existing Transactions - Only show in edit mode */}
        {isEditMode && (
          <Card
            title="Expense Sheet Transactions"
            headerContent={
              <div className="flex items-center gap-2">
                <History
                  size={16}
                  className="text-[var(--content-textsecondary)]"
                />
                <span className="text-sm text-[var(--content-textsecondary)]">
                  Transactions in{" "}
                  {currentExpenseSheet?.name || "this expense sheet"}
                </span>
              </div>
            }
            cardContent={
              <>
                {existingTransactions.length === 0 && !isLoadingTransactions ? (
                  <div className="text-center py-12">
                    <div className="text-[var(--content-textsecondary)] mb-4">
                      <History size={48} className="mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">
                        No transactions in this expense sheet
                      </h3>
                      <p className="text-sm">
                        Upload a file to add transactions to this expense sheet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <DataTable
                    data={filteredTransactions}
                    columns={getTransactionColumns(
                      handleEditTransaction,
                      handleDeleteTransaction
                    )}
                    onSearch={handleSearch}
                    loading={isLoadingTransactions}
                  />
                )}
              </>
            }
          />
        )}

        {/* Upload Statement Modal */}
        <UploadStatementModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onSave={handleSaveFromModal}
          expenseSheetName={name || "Untitled Sheet"}
          isLinkedToIncome={!!linkedIncomeId}
        />

        {/* Edit Transaction Modal */}
        <EditTransactionModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTransaction(null);
          }}
          transaction={selectedTransaction}
          onTransactionUpdated={handleTransactionUpdated}
        />
      </div>
    </Page>
  );
};

export default CreateExpenseSheet;
