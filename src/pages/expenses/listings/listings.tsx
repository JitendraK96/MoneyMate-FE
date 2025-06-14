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
import { CirclePlus, FileSpreadsheet, Filter } from "lucide-react";
import DataTable from "@/components/table";
import { getColumns } from "./columnDefs";
import { searchFilter } from "@/components/table/utils";
import Page from "@/components/page";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ExpenseSheetListing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");

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

  const handleActivateExpenseSheet = async (id: string) => {
    try {
      const { error } = await supabase
        .from("expense_sheets")
        .update({ is_active: true })
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error activating expense sheet:", error.message);
        toast.error("Failed to activate expense sheet. Please try again.");
        return;
      }

      // Update local state
      const updatedSheets = expenseSheets.map((sheet: any) =>
        sheet.id === id ? { ...sheet, is_active: true } : sheet
      );
      dispatch(setList(updatedSheets));
      toast.success("Expense sheet activated successfully");
    } catch (error) {
      console.error("Error activating expense sheet:", error);
      toast.error("Failed to activate expense sheet. Please try again.");
    }
  };

  const handleDeactivateExpenseSheet = async (id: string) => {
    try {
      const { error } = await supabase
        .from("expense_sheets")
        .update({ is_active: false })
        .eq("id", id)
        .eq("user_id", user?.id);

      if (error) {
        console.error("Error deactivating expense sheet:", error.message);
        toast.error("Failed to deactivate expense sheet. Please try again.");
        return;
      }

      // Update local state
      const updatedSheets = expenseSheets.map((sheet: any) =>
        sheet.id === id ? { ...sheet, is_active: false } : sheet
      );
      dispatch(setList(updatedSheets));
      toast.success("Expense sheet deactivated successfully");
    } catch (error) {
      console.error("Error deactivating expense sheet:", error);
      toast.error("Failed to deactivate expense sheet. Please try again.");
    }
  };

  const handleDeleteExpenseSheet = async (id: string) => {
    try {
      const { error } = await supabase
        .from("expense_sheets")
        .delete()
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
      toast.success("Expense sheet deleted permanently");
    } catch (error) {
      console.error("Error deleting expense sheet:", error);
      toast.error("Failed to delete expense sheet. Please try again.");
    }
  };

  // Filter by search query
  const searchFilteredSheets =
    searchQuery !== ""
      ? searchFilter({ rows: expenseSheets, term: searchQuery })
      : expenseSheets;

  // Filter by status
  const filteredExpenseSheets = searchFilteredSheets.filter((sheet: any) => {
    if (statusFilter === "active") return sheet.is_active === true;
    if (statusFilter === "inactive") return sheet.is_active === false;
    return true; // "all"
  });

  const totalSheets = expenseSheets.length;

  return (
    <Page
      title="Expense Sheets"
      subTitle="Manage your expense tracking sheets and monitor spending patterns"
    >
      {/* Expense Sheets Table */}
      <Card
        title="Your Expense Sheets"
        headerContent={
          <div className="flex items-center gap-4">
            {totalSheets > 0 && (
              <>
                <Select
                  value={statusFilter}
                  onValueChange={(value: any) => setStatusFilter(value)}
                >
                  <SelectTrigger className="w-fit !bg-[var(--content)] !border-[var(--common-inputborder)]">
                    <Filter size={14} />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                    <SelectItem value="all">All Sheets</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </>
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
            ) : filteredExpenseSheets.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-[var(--content-textsecondary)] mb-4">
                  <FileSpreadsheet
                    size={48}
                    className="mx-auto mb-4 opacity-50"
                  />
                  <h3 className="text-lg font-medium mb-2">
                    No {statusFilter} expense sheets found
                  </h3>
                  <p className="text-sm">
                    {statusFilter === "active"
                      ? "Try changing the filter to see inactive sheets"
                      : statusFilter === "inactive"
                      ? "Try changing the filter to see active sheets"
                      : "Try adjusting your search or filter criteria"}
                  </p>
                </div>
              </div>
            ) : (
              <DataTable
                data={filteredExpenseSheets}
                columns={getColumns(
                  handleRowClick,
                  handleDeleteExpenseSheet,
                  handleActivateExpenseSheet,
                  handleDeactivateExpenseSheet
                )}
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
