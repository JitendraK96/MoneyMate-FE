import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import Page from "@/components/page";
import Card from "@/components/card";
import { Button } from "@/components/inputs";
import DataTable from "@/components/table";
import { Plus, DollarSign, PieChart, TrendingUp, Target } from "lucide-react";
import { getIncomeColumns } from "./columnDefs";
import AddIncomeModal from "../modals/AddIncomeModal/AddIncomeModal";
import {
  Income,
  TotalIncomeAllocation,
  BUCKETS,
  FREQUENCY_CONVERTER,
  IncomeStatistics,
} from "../types";

const IncomeManagement = () => {
  const { user } = useUser();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user?.id) {
      fetchIncomes();
    }
  }, [user?.id]);

  const fetchIncomes = async () => {
    setIsLoading(true);
    try {
      const { data: incomesData, error } = await supabase
        .from("incomes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setIncomes(incomesData || []);
    } catch (error) {
      console.error("Error fetching incomes:", error);
      toast.error("Failed to load incomes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddIncome = () => {
    setEditingIncome(null);
    setIsIncomeModalOpen(true);
  };

  const handleEditIncome = (income: Income) => {
    setEditingIncome(income);
    setIsIncomeModalOpen(true);
  };

  const handleDeleteIncome = async (id: string) => {
    try {
      const { error } = await supabase
        .from("incomes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success("Income deleted successfully!");
      fetchIncomes();
    } catch (error) {
      console.error("Error deleting income:", error);
      toast.error("Failed to delete income. Please try again.");
    }
  };

  const handleToggleActive = async (income: Income) => {
    try {
      const { error } = await supabase
        .from("incomes")
        .update({ is_active: !income.is_active })
        .eq("id", income.id)
        .eq("user_id", user.id);

      if (error) throw error;

      toast.success(
        `Income ${
          !income.is_active ? "activated" : "deactivated"
        } successfully!`
      );
      fetchIncomes();
    } catch (error) {
      console.error("Error toggling income status:", error);
      toast.error("Failed to update income status. Please try again.");
    }
  };

  const handleIncomeModalClose = () => {
    setIsIncomeModalOpen(false);
    setEditingIncome(null);
    fetchIncomes();
  };

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const filteredIncomes = incomes.filter((income) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      income.source.toLowerCase().includes(searchLower) ||
      (income.description &&
        income.description.toLowerCase().includes(searchLower)) ||
      income.frequency.toLowerCase().includes(searchLower)
    );
  });

  // Calculate total allocations from active incomes
  const totalAllocations: TotalIncomeAllocation = incomes
    .filter((income) => income.is_active)
    .reduce(
      (acc, income) => {
        const monthlyAmount = FREQUENCY_CONVERTER.toMonthly(
          income.amount,
          income.frequency
        );

        const needsAmount = (monthlyAmount * income.needs_percentage) / 100;
        const wantsAmount = (monthlyAmount * income.wants_percentage) / 100;
        const savingsAmount = (monthlyAmount * income.savings_percentage) / 100;

        return {
          total_monthly_income: acc.total_monthly_income + monthlyAmount,
          total_needs_amount: acc.total_needs_amount + needsAmount,
          total_wants_amount: acc.total_wants_amount + wantsAmount,
          total_savings_amount: acc.total_savings_amount + savingsAmount,
          needs_percentage: 0, // Will calculate after
          wants_percentage: 0, // Will calculate after
          savings_percentage: 0, // Will calculate after
          active_income_count: acc.active_income_count + 1,
          total_income_count: acc.total_income_count,
        };
      },
      {
        total_monthly_income: 0,
        total_needs_amount: 0,
        total_wants_amount: 0,
        total_savings_amount: 0,
        needs_percentage: 0,
        wants_percentage: 0,
        savings_percentage: 0,
        active_income_count: 0,
        total_income_count: incomes.length,
      }
    );

  // Calculate overall percentages
  if (totalAllocations.total_monthly_income > 0) {
    totalAllocations.needs_percentage =
      (totalAllocations.total_needs_amount /
        totalAllocations.total_monthly_income) *
      100;
    totalAllocations.wants_percentage =
      (totalAllocations.total_wants_amount /
        totalAllocations.total_monthly_income) *
      100;
    totalAllocations.savings_percentage =
      (totalAllocations.total_savings_amount /
        totalAllocations.total_monthly_income) *
      100;
  }

  // Calculate statistics
  const activeIncomes = incomes.filter((income) => income.is_active);
  const statistics: IncomeStatistics = {
    highest_income_source:
      activeIncomes.length > 0
        ? activeIncomes.reduce((max, income) => {
            const maxMonthly = FREQUENCY_CONVERTER.toMonthly(
              max.amount,
              max.frequency
            );
            const currentMonthly = FREQUENCY_CONVERTER.toMonthly(
              income.amount,
              income.frequency
            );
            return currentMonthly > maxMonthly ? income : max;
          })
        : null,
    lowest_income_source:
      activeIncomes.length > 0
        ? activeIncomes.reduce((min, income) => {
            const minMonthly = FREQUENCY_CONVERTER.toMonthly(
              min.amount,
              min.frequency
            );
            const currentMonthly = FREQUENCY_CONVERTER.toMonthly(
              income.amount,
              income.frequency
            );
            return currentMonthly < minMonthly ? income : min;
          })
        : null,
    average_monthly_income:
      activeIncomes.length > 0
        ? totalAllocations.total_monthly_income / activeIncomes.length
        : 0,
    total_yearly_income: totalAllocations.total_monthly_income * 12,
    frequency_distribution: {
      monthly: incomes.filter((i) => i.frequency === "monthly").length,
      yearly: incomes.filter((i) => i.frequency === "yearly").length,
      weekly: incomes.filter((i) => i.frequency === "weekly").length,
      "bi-weekly": incomes.filter((i) => i.frequency === "bi-weekly").length,
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Page
      title="Income Management"
      subTitle="Manage your income sources and budget allocation across needs, wants, and savings"
    >
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card
          cardContent={
            <div className="text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-[var(--common-brand)]" />
              <div className="text-2xl font-bold text-[var(--content-textprimary)]">
                {formatCurrency(totalAllocations.total_monthly_income)}
              </div>
              <div className="text-sm text-[var(--content-textsecondary)]">
                Total Monthly Income
              </div>
              <div className="text-xs text-[var(--content-textsecondary)] mt-1">
                {totalAllocations.active_income_count} active sources
              </div>
            </div>
          }
        />

        <Card
          cardContent={
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-2xl font-bold text-[var(--content-textprimary)]">
                {formatCurrency(statistics.total_yearly_income)}
              </div>
              <div className="text-sm text-[var(--content-textsecondary)]">
                Yearly Income
              </div>
              <div className="text-xs text-[var(--content-textsecondary)] mt-1">
                Projected annual total
              </div>
            </div>
          }
        />

        <Card
          cardContent={
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="text-2xl font-bold text-[var(--content-textprimary)]">
                {statistics.highest_income_source
                  ? formatCurrency(
                      FREQUENCY_CONVERTER.toMonthly(
                        statistics.highest_income_source.amount,
                        statistics.highest_income_source.frequency
                      )
                    )
                  : formatCurrency(0)}
              </div>
              <div className="text-sm text-[var(--content-textsecondary)]">
                Highest Source
              </div>
              <div className="text-xs text-[var(--content-textsecondary)] mt-1 truncate">
                {statistics.highest_income_source?.source || "No sources"}
              </div>
            </div>
          }
        />

        <Card
          cardContent={
            <div className="text-center">
              <PieChart className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="text-2xl font-bold text-[var(--content-textprimary)]">
                {formatCurrency(statistics.average_monthly_income)}
              </div>
              <div className="text-sm text-[var(--content-textsecondary)]">
                Average Monthly
              </div>
              <div className="text-xs text-[var(--content-textsecondary)] mt-1">
                Per income source
              </div>
            </div>
          }
        />
      </div>

      {/* Budget Allocation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {BUCKETS.map((bucket) => {
          const amount = totalAllocations[
            `total_${bucket.key}_amount` as keyof TotalIncomeAllocation
          ] as number;
          const percentage = totalAllocations[
            `${bucket.key}_percentage` as keyof TotalIncomeAllocation
          ] as number;
          const isOptimal =
            Math.abs(percentage - bucket.recommendedPercentage) <= 5; // Within 5% of recommended

          return (
            <Card
              key={bucket.key}
              cardContent={
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: bucket.color }}
                    />
                    <div className="text-lg font-bold text-[var(--content-textprimary)]">
                      {bucket.label}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-[var(--content-textprimary)] mb-1">
                    {formatCurrency(amount)}
                  </div>
                  <div className="text-sm text-[var(--content-textsecondary)] mb-2">
                    {percentage.toFixed(1)}% of total
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <div
                      className={`text-xs px-2 py-1 rounded-full ${
                        isOptimal
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      Target: {bucket.recommendedPercentage}%
                    </div>
                  </div>
                  <div className="text-xs text-[var(--content-textsecondary)] mt-2">
                    {bucket.description}
                  </div>
                </div>
              }
            />
          );
        })}
      </div>

      {/* Income Sources Table */}
      <Card
        title="Income Sources"
        headerContent={
          <div className="flex items-center gap-2">
            <Button
              type="button"
              title="Add Income Source"
              className="w-fit"
              onClick={handleAddIncome}
              icon={<Plus />}
            />
          </div>
        }
        cardContent={
          <>
            {incomes.length === 0 && !isLoading ? (
              <div className="text-center py-12">
                <div className="text-[var(--content-textsecondary)] mb-4">
                  <PieChart size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    No income sources yet
                  </h3>
                  <p className="text-sm">
                    Add your income sources to start managing your budget
                    allocation.
                  </p>
                </div>
                <Button
                  type="button"
                  title="Add Your First Income Source"
                  className="w-fit"
                  onClick={handleAddIncome}
                  icon={<Plus />}
                />
              </div>
            ) : (
              <DataTable
                data={filteredIncomes}
                columns={getIncomeColumns(
                  handleEditIncome,
                  handleDeleteIncome,
                  handleToggleActive,
                  formatCurrency
                )}
                onSearch={handleSearch}
                loading={isLoading}
              />
            )}
          </>
        }
      />

      {/* Modal */}
      <AddIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={handleIncomeModalClose}
        income={editingIncome}
      />
    </Page>
  );
};

export default IncomeManagement;
