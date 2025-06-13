/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { RootState } from "@/store";
import { setList } from "@/store/slices/expensesSlice";
import { useUser } from "@/context/UserContext";
import Card from "@/components/card";
import { Button } from "@/components/inputs";
import { CirclePlus, FileSpreadsheet } from "lucide-react";
import DataTable from "@/components/table";
import { getColumns } from "./columnDefs";
import { searchFilter } from "@/components/table/utils";
import Page from "@/components/page";
import { toast } from "sonner";

const ExpenseSheetListing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const expenseSheets = useSelector(
    (state: RootState) => state.expenses?.list || []
  );

  useEffect(() => {
    const fetchExpenseSheets = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("expense_sheets_with_summary")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching expense sheets:", error.message);
          toast.error("Failed to fetch expense sheets. Please try again.");
          return;
        }

        dispatch(setList(data || []));
      } catch (error) {
        console.error("Error fetching expense sheets:", error);
        toast.error("Failed to fetch expense sheets. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenseSheets();
  }, [dispatch, user?.id]);

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const handleAddNewExpenseSheet = () => {
    navigate("/dashboard/expenses/create");
  };

  const handleRowClick = (id: string) => {
    navigate(`/dashboard/expenses/${id}`);
  };

  const handleDeleteExpenseSheet = async (id: string) => {
    try {
      const { error } = await supabase
        .from("expense_sheets")
        .update({ is_active: false })
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error deleting expense sheet:", error.message);
        toast.error("Failed to delete expense sheet. Please try again.");
        return;
      }

      // Remove from local state
      const updatedSheets = expenseSheets.filter(
        (sheet: any) => sheet.id !== id
      );
      dispatch(setList(updatedSheets));
      toast.success("Expense sheet deleted successfully");
    } catch (error) {
      console.error("Error deleting expense sheet:", error);
      toast.error("Failed to delete expense sheet. Please try again.");
    }
  };

  const filteredExpenseSheets =
    searchQuery !== ""
      ? searchFilter({ rows: expenseSheets, term: searchQuery })
      : expenseSheets;

  // Calculate summary statistics
  const totalSheets = expenseSheets.length;
  const sheetsWithTransactions = expenseSheets.filter(
    (sheet) => sheet.total_transactions > 0
  ).length;
  const totalExpenses = expenseSheets.reduce(
    (sum, sheet) => sum + (sheet.total_expenses || 0),
    0
  );
  const totalIncome = expenseSheets.reduce(
    (sum, sheet) => sum + (sheet.total_income || 0),
    0
  );
  const netAmount = totalIncome - totalExpenses;

  return (
    <Page
      title="Expense Sheets"
      subTitle="Manage your expense tracking sheets and monitor spending patterns"
    >
      {/* Summary Cards */}
      {totalSheets > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card
            cardContent={
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--content-textprimary)]">
                  {totalSheets}
                </div>
                <div className="text-sm text-[var(--content-textsecondary)]">
                  Total Sheets
                </div>
              </div>
            }
          />
          <Card
            cardContent={
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--common-brand)]">
                  {sheetsWithTransactions}
                </div>
                <div className="text-sm text-[var(--content-textsecondary)]">
                  With Transactions
                </div>
              </div>
            }
          />
          <Card
            cardContent={
              <div className="text-center">
                <div className="text-2xl font-bold text-[var(--common-error)]">
                  ₹{totalExpenses.toLocaleString("en-IN")}
                </div>
                <div className="text-sm text-[var(--content-textsecondary)]">
                  Total Expenses
                </div>
              </div>
            }
          />
          <Card
            cardContent={
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${
                    netAmount >= 0
                      ? "text-[var(--common-success)]"
                      : "text-[var(--common-error)]"
                  }`}
                >
                  ₹{Math.abs(netAmount).toLocaleString("en-IN")}
                </div>
                <div className="text-sm text-[var(--content-textsecondary)]">
                  Net {netAmount >= 0 ? "Income" : "Expense"}
                </div>
              </div>
            }
          />
        </div>
      )}

      {/* Expense Sheets Table */}
      <Card
        title="Your Expense Sheets"
        headerContent={
          <div className="flex items-center gap-4">
            {totalSheets > 0 && (
              <div className="text-sm text-[var(--content-textsecondary)]">
                {sheetsWithTransactions} active sheets with transactions
              </div>
            )}
            <Button
              type="button"
              title="Add New Sheet"
              className="w-fit"
              onClick={handleAddNewExpenseSheet}
              icon={<CirclePlus />}
            />
          </div>
        }
        cardContent={
          <>
            {totalSheets === 0 && !isLoading ? (
              <div className="text-center py-12">
                <div className="text-[var(--content-textsecondary)] mb-4">
                  <FileSpreadsheet
                    size={48}
                    className="mx-auto mb-4 opacity-50"
                  />
                  <h3 className="text-lg font-medium mb-2">
                    No expense sheets yet
                  </h3>
                  <p className="text-sm">
                    Create your first expense sheet to start tracking your
                    spending!
                  </p>
                </div>
                <Button
                  type="button"
                  title="Create Your First Sheet"
                  className="w-fit"
                  onClick={handleAddNewExpenseSheet}
                  icon={<CirclePlus />}
                />
              </div>
            ) : (
              <DataTable
                data={filteredExpenseSheets}
                columns={getColumns(handleRowClick, handleDeleteExpenseSheet)}
                onSearch={handleSearch}
                loading={isLoading}
              />
            )}
          </>
        }
      />
    </Page>
  );
};

export default ExpenseSheetListing;
