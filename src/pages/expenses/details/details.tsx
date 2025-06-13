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
import { Textarea } from "@/components/ui/textarea";
import DataTable from "@/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormField } from "@/components/ui/form";
import { toast } from "sonner";
import { Upload, ArrowLeft, History, Edit } from "lucide-react";
import UploadStatementModal from "./modal/UploadStatementModal";
import EditTransactionModal from "./modal/EditTransactionModal";
import { getTransactionColumns, TransactionWithDetails } from "./columnDefs";

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
  linkedIncomeId: z.string().optional().or(z.literal("")),
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

  // Data states
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [existingTransactions, setExistingTransactions] = useState<
    TransactionWithDetails[]
  >([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [currentExpenseSheet, setCurrentExpenseSheet] =
    useState<ExpenseSheet | null>(null);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);

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
        form.setValue("name", data.name || "");
        form.setValue("description", data.description || "");
        form.setValue("linkedIncomeId", data.income_id || "");
      }
    } catch (error) {
      console.error("Error fetching expense sheet:", error);
      toast.error("Failed to load expense sheet data");
      navigate("/dashboard/expense");
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

        // If edit mode, fetch expense sheet data first
        if (isEditMode && id) {
          await fetchExpenseSheet(id);
        }

        // Fetch existing transactions
        await fetchExistingTransactions();
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load required data");
      }
    };

    fetchData();
  }, [user?.id, isEditMode, id]);

  // Fetch existing transactions
  const fetchExistingTransactions = async () => {
    if (!user?.id) return;

    setIsLoadingTransactions(true);
    try {
      let query = supabase
        .from("transactions_with_details")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("transaction_date", { ascending: false });

      // If in edit mode, filter transactions for this expense sheet only
      if (isEditMode && id) {
        query = query.eq("expense_sheet_id", id);
      } else {
        // If in create mode, limit to recent 50 transactions
        query = query.limit(50);
      }

      const { data, error } = await query;

      if (error) throw error;

      setExistingTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load existing transactions");
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Save functionality for the modal
  const handleSaveFromModal = async (
    validTransactions: ParsedTransaction[]
  ) => {
    if (!user?.id || !isValid) {
      throw new Error("Please fill in all required fields");
    }

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

    // Refresh existing transactions
    await fetchExistingTransactions();

    navigate(`/dashboard/expense/${sheetId}`);
  };

  // Handle transaction edit
  const handleEditTransaction = (transaction: TransactionWithDetails) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  // Handle transaction updated
  const handleTransactionUpdated = () => {
    fetchExistingTransactions();
    setSelectedTransaction(null);
    setIsEditModalOpen(false);
  };

  // Handle transaction delete
  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Transaction deleted successfully!");
      await fetchExistingTransactions();
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
    <Page title={pageTitle} subTitle={pageSubtitle}>
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/dashboard/expense")}
            icon={<ArrowLeft />}
            title="Back to Expense Sheets"
          />
          {isEditMode && (
            <div className="flex items-center gap-2 text-[var(--content-textsecondary)]">
              <Edit size={16} />
              <span className="text-sm">
                Editing: {currentExpenseSheet?.name}
              </span>
            </div>
          )}
        </div>

        {/* Sheet Details Form */}
        <Card
          title={isEditMode ? "Update Sheet Details" : "Expense Sheet Details"}
          cardContent={
            <Form {...form}>
              <form>
                <div className="form-wrapper no-bottom-margin">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <Input
                        field={field}
                        type="text"
                        placeholder="e.g., Monthly Expenses, Vacation Budget"
                        label="Sheet Name *"
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

                  <FormField
                    control={form.control}
                    name="linkedIncomeId"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--content-textprimary)]">
                          Link to Income (Optional)
                        </label>
                        <Select
                          value={field.value || ""}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("linkedIncomeId", value, {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true,
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select income source" />
                          </SelectTrigger>
                          <SelectContent>
                            {incomes.map((income) => (
                              <SelectItem key={income.id} value={income.id}>
                                {income.source} - ₹
                                {income.amount.toLocaleString("en-IN")}{" "}
                                {income.frequency}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  />
                </div>

                <div className="form-wrapper">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-[var(--content-textprimary)]">
                          Description (Optional)
                        </label>
                        <Textarea
                          value={field.value || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            form.setValue("description", value, {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true,
                            });
                          }}
                          placeholder="Brief description of this expense sheet"
                          rows={3}
                        />
                      </div>
                    )}
                  />
                </div>
              </form>
            </Form>
          }
        />

        {/* Upload Statement Button */}
        <Card
          title={
            isEditMode ? "Add More Transactions" : "Upload Transaction File"
          }
          cardContent={
            <div className="text-center py-8">
              <div className="flex flex-col items-center gap-4">
                <Upload
                  size={48}
                  className="text-[var(--content-textsecondary)]"
                />
                <div>
                  <h3 className="text-lg font-medium text-[var(--content-textprimary)] mb-2">
                    Ready to upload your transactions?
                  </h3>
                  <p className="text-sm text-[var(--content-textsecondary)] mb-4">
                    Upload Excel or CSV files to automatically import your
                    expense transactions.
                  </p>
                  <Button
                    type="button"
                    onClick={() => setIsUploadModalOpen(true)}
                    disabled={!isValid}
                    icon={<Upload />}
                    title="Upload Statement"
                    className="w-fit"
                  />
                  {!isValid && (
                    <p className="text-xs text-[var(--common-warning)] mt-2">
                      Please fill in the sheet name to continue
                    </p>
                  )}
                </div>
              </div>
            </div>
          }
        />

        {/* Existing Transactions */}
        <Card
          title={
            isEditMode ? "Expense Sheet Transactions" : "Recent Transactions"
          }
          headerContent={
            <div className="flex items-center gap-2">
              <History
                size={16}
                className="text-[var(--content-textsecondary)]"
              />
              <span className="text-sm text-[var(--content-textsecondary)]">
                {isEditMode
                  ? `Transactions in ${
                      currentExpenseSheet?.name || "this expense sheet"
                    }`
                  : "Your recent transactions across all expense sheets"}
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
                      {isEditMode
                        ? "No transactions in this expense sheet"
                        : "No transactions yet"}
                    </h3>
                    <p className="text-sm">
                      {isEditMode
                        ? "Upload a file to add transactions to this expense sheet."
                        : "Upload your first expense sheet to see transactions here."}
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
