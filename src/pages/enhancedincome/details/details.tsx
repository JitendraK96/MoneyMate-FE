/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import Page from "@/components/page";
import Card from "@/components/card";
import { Button } from "@/components/inputs";
import DataTable from "@/components/table";
import {
  Plus,
  DollarSign,
  PieChart,
  TrendingUp,
  Target,
  Info,
} from "lucide-react";
import AddIncomeModal from "../AddIncomeModal/AddIncomeModal"; // Your existing modal
import CategoryAllocationModal from "../CategoryAllocationModal/CategoryAllocationModal"; // ✅ ADD THIS IMPORT
import { getEnhancedIncomeColumns } from "./columnDefs";

// Enhanced types (add these to your existing types file)
interface CategoryAllocation {
  category_id: string;
  category_name: string;
  category_color?: string;
  allocated_percentage: number;
  allocated_amount: number;
}

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
  monthly_amount: number;
  needs_category_allocations?: CategoryAllocation[];
  wants_category_allocations?: CategoryAllocation[];
  savings_category_allocations?: CategoryAllocation[];
  unallocated_needs_percentage?: number;
  unallocated_wants_percentage?: number;
  unallocated_savings_percentage?: number;
  unallocated_needs_amount?: number;
  unallocated_wants_amount?: number;
  unallocated_savings_amount?: number;
}

interface Category {
  id: string;
  name: string;
  description?: string;
  bucket: "needs" | "wants" | "savings";
  color?: string;
  icon?: string;
  user_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BUCKETS = [
  {
    key: "needs",
    label: "Needs",
    color: "#ef4444",
    recommendedPercentage: 50,
    description: "Essential expenses like rent, utilities, groceries",
  },
  {
    key: "wants",
    label: "Wants",
    color: "#3b82f6",
    recommendedPercentage: 30,
    description: "Entertainment, dining out, hobbies",
  },
  {
    key: "savings",
    label: "Savings",
    color: "#22c55e",
    recommendedPercentage: 20,
    description: "Emergency fund, investments, debt repayment",
  },
] as const;

const EnhancedIncomeManagement = () => {
  const { user } = useUser();
  const [incomes, setIncomes] = useState<EnhancedIncome[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ ADD THESE NEW STATE VARIABLES FOR CATEGORY ALLOCATION MODAL
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
  const [selectedIncomeForAllocation, setSelectedIncomeForAllocation] =
    useState<EnhancedIncome | null>(null);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user?.id]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Try to fetch from enhanced view first, fallback to regular incomes
      let incomesData;
      let incomesError;

      try {
        const { data, error } = await supabase
          .from("incomes_with_category_allocations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        incomesData = data;
        incomesError = error;
      } catch (error) {
        // Enhanced view doesn't exist yet, fallback to regular incomes
        console.log(
          "Enhanced view not available, using regular incomes",
          error
        );
        const { data, error: fallbackError } = await supabase
          .from("incomes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        // Convert to enhanced format
        incomesData = data?.map((income) => ({
          ...income,
          monthly_amount: calculateMonthlyAmount(
            income.amount,
            income.frequency
          ),
          needs_category_allocations: [],
          wants_category_allocations: [],
          savings_category_allocations: [],
          unallocated_needs_percentage: income.needs_percentage,
          unallocated_wants_percentage: income.wants_percentage,
          unallocated_savings_percentage: income.savings_percentage,
          unallocated_needs_amount:
            (calculateMonthlyAmount(income.amount, income.frequency) *
              income.needs_percentage) /
            100,
          unallocated_wants_amount:
            (calculateMonthlyAmount(income.amount, income.frequency) *
              income.wants_percentage) /
            100,
          unallocated_savings_amount:
            (calculateMonthlyAmount(income.amount, income.frequency) *
              income.savings_percentage) /
            100,
        }));
        incomesError = fallbackError;
      }

      if (incomesError) throw incomesError;

      // Fetch categories for reference
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("bucket", { ascending: true })
        .order("name", { ascending: true });

      if (categoriesError) throw categoriesError;

      setIncomes(incomesData || []);
      setCategories(categoriesData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMonthlyAmount = (amount: number, frequency: string) => {
    const multipliers: Record<string, number> = {
      monthly: 1,
      yearly: 1 / 12,
      weekly: 52 / 12,
      "bi-weekly": 26 / 12,
    };
    return amount * (multipliers[frequency] || 1);
  };

  const handleAddIncome = () => {
    setEditingIncome(null);
    setIsIncomeModalOpen(true);
  };

  const handleEditIncome = (income: EnhancedIncome) => {
    // Convert back to regular income format for existing modal
    const regularIncome = {
      id: income.id,
      user_id: income.user_id,
      source: income.source,
      description: income.description,
      amount: income.amount,
      frequency: income.frequency,
      needs_percentage: income.needs_percentage,
      wants_percentage: income.wants_percentage,
      savings_percentage: income.savings_percentage,
      is_active: income.is_active,
      created_at: income.created_at,
      updated_at: income.updated_at,
    };
    setEditingIncome(regularIncome);
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
      fetchData();
    } catch (error) {
      console.error("Error deleting income:", error);
      toast.error("Failed to delete income. Please try again.");
    }
  };

  const handleToggleActive = async (income: EnhancedIncome) => {
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
      fetchData();
    } catch (error) {
      console.error("Error toggling income status:", error);
      toast.error("Failed to update income status. Please try again.");
    }
  };

  // ✅ ADD THIS NEW HANDLER FOR CATEGORY ALLOCATION
  const handleAllocateToCategories = (income: EnhancedIncome) => {
    setSelectedIncomeForAllocation(income);
    setIsAllocationModalOpen(true);
  };

  const handleIncomeModalClose = () => {
    setIsIncomeModalOpen(false);
    setEditingIncome(null);
    fetchData(); // Refresh to get enhanced data
  };

  // ✅ ADD THIS NEW HANDLER FOR ALLOCATION MODAL CLOSE
  const handleAllocationModalClose = () => {
    setIsAllocationModalOpen(false);
    setSelectedIncomeForAllocation(null);
    fetchData(); // Refresh to show updated allocations
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

  // Calculate enhanced totals with category allocations
  const activeIncomes = incomes.filter((income) => income.is_active);
  const totalMonthlyIncome = activeIncomes.reduce(
    (sum, income) => sum + income.monthly_amount,
    0
  );

  // Calculate bucket totals with category breakdowns
  const bucketSummaries = BUCKETS.map((bucket) => {
    const bucketAmount = activeIncomes.reduce(
      (sum, income) =>
        sum +
        (income.monthly_amount * income[`${bucket.key}_percentage`]) / 100,
      0
    );

    const categoryAllocations = activeIncomes.reduce((acc, income) => {
      const allocations = income[`${bucket.key}_category_allocations`] || [];
      allocations.forEach((allocation) => {
        const existing = acc.find(
          (item) => item.category_id === allocation.category_id
        );
        if (existing) {
          existing.allocated_amount += allocation.allocated_amount;
          existing.count += 1;
        } else {
          acc.push({
            category_id: allocation.category_id,
            category_name: allocation.category_name,
            category_color: allocation.category_color,
            allocated_amount: allocation.allocated_amount,
            count: 1,
          });
        }
      });
      return acc;
    }, [] as any[]);

    const totalAllocatedAmount = categoryAllocations.reduce(
      (sum, cat) => sum + cat.allocated_amount,
      0
    );

    const unallocatedAmount = bucketAmount - totalAllocatedAmount;

    return {
      ...bucket,
      totalAmount: bucketAmount,
      categoryAllocations: categoryAllocations.sort(
        (a, b) => b.allocated_amount - a.allocated_amount
      ),
      totalAllocatedAmount,
      unallocatedAmount,
      unallocatedPercentage:
        bucketAmount > 0 ? (unallocatedAmount / bucketAmount) * 100 : 0,
    };
  });

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
      subTitle="Manage your income sources with detailed category-level budget allocation"
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
        <Card
          cardContent={
            <div className="text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <div className="font-size-large text-[var(--content-textprimary)]">
                {formatCurrency(totalMonthlyIncome)}
              </div>
              <div className="font-size-medium text-[var(--content-secondary)]">
                Total Monthly Income
              </div>
              <div className="font-size-extra-small text-[var(--content-textplaceholder)]">
                {activeIncomes.length} active sources
              </div>
            </div>
          }
        />

        <Card
          cardContent={
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="font-size-large text-[var(--content-textprimary)]">
                {formatCurrency(totalMonthlyIncome * 12)}
              </div>
              <div className="font-size-medium text-[var(--content-secondary)]">
                Yearly Projection
              </div>
              <div className="font-size-extra-small text-[var(--content-textplaceholder)]">
                Annual total
              </div>
            </div>
          }
        />

        <Card
          cardContent={
            <div className="text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <div className="font-size-large text-[var(--content-textprimary)]">
                {bucketSummaries.reduce(
                  (sum, bucket) => sum + bucket.categoryAllocations.length,
                  0
                )}
              </div>
              <div className="font-size-medium text-[var(--content-secondary)]">
                Category Allocations
              </div>
              <div className="font-size-extra-small text-[var(--content-textplaceholder)]">
                Across all buckets
              </div>
            </div>
          }
        />

        <Card
          cardContent={
            <div className="text-center">
              <PieChart className="w-8 h-8 mx-auto mb-2 text-orange-500" />
              <div className="font-size-large text-[var(--content-textprimary)]">
                {formatCurrency(
                  bucketSummaries.reduce(
                    (sum, bucket) => sum + bucket.unallocatedAmount,
                    0
                  )
                )}
              </div>
              <div className="font-size-medium text-[var(--content-secondary)]">
                Total Unallocated
              </div>
              <div className="font-size-extra-small text-[var(--content-textplaceholder)]">
                Needs attention
              </div>
            </div>
          }
        />
      </div>

      {/* Enhanced Budget Allocation Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {bucketSummaries.map((bucket) => {
          const hasAllocations = bucket.categoryAllocations.length > 0;

          return (
            <Card
              className="py-0"
              key={bucket.key}
              cardContent={
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: bucket.color }}
                      />
                      <div className="font-size-medium text-[var(--content-primary)]">
                        {bucket.label}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-size-medium text-[var(--content-primary)]">
                        {formatCurrency(bucket.totalAmount)}
                      </div>
                      <div className="font-size-extra-small text-[var(--content-textplaceholder)]">
                        {bucket.recommendedPercentage}% target
                      </div>
                    </div>
                  </div>

                  {/* Bucket Summary */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="font-size-extra-small text-[var(--content-primary)]">
                        Allocated to categories:
                      </span>
                      <span className="font-size-extra-small text-[var(--content-primary)]">
                        {formatCurrency(bucket.totalAllocatedAmount)}
                      </span>
                    </div>

                    {bucket.unallocatedAmount > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-yellow-600 font-size-extra-small">
                          Unallocated:
                        </span>
                        <span className="font-size-extra-small text-yellow-700">
                          {formatCurrency(bucket.unallocatedAmount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-200">
                    <div className="font-size-extra-small text-[var(--content-textplaceholder)] mb-2">
                      Category Breakdown:
                    </div>
                    {bucket.categoryAllocations.map((allocation) => (
                      <div
                        key={allocation.category_id}
                        className="flex items-center justify-between font-size-extra-small p-2 bg-[var(--category-background)] rounded"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                allocation.category_color || "#6b7280",
                            }}
                          />
                          <span className="text-[var(--category-text)] font-size-extra-small">
                            {allocation.category_name}
                          </span>
                          {allocation.count > 1 && (
                            <span className="font-size-extra-small text-[var(--category-text)] bg-[var(--category-background)] px-1 rounded">
                              {allocation.count} sources
                            </span>
                          )}
                        </div>
                        <span className="font-size-extra-small text-[var(--category-text)]">
                          {formatCurrency(allocation.allocated_amount)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Empty State */}
                  {!hasAllocations && (
                    <div className="pt-2">
                      <div className="text-center font-size-extra-small text-[var(--content-textplaceholder)] py-4">
                        <Info className="w-4 h-4 mx-auto mb-1 opacity-50" />
                        No category allocations yet
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  <div className="font-size-extra-small text-[var(--content-textplaceholder)] mt-3">
                    {bucket.description}
                  </div>
                </div>
              }
            />
          );
        })}
      </div>

      {/* Alert for Unallocated Funds */}
      {bucketSummaries.some((bucket) => bucket.unallocatedAmount > 100) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-size-medium text-yellow-800 mb-1">
                You have unallocated funds
              </div>
              <div className="font-size-small text-yellow-700">
                {formatCurrency(
                  bucketSummaries.reduce(
                    (sum, bucket) => sum + bucket.unallocatedAmount,
                    0
                  )
                )}{" "}
                is not allocated to specific categories. Consider allocating
                these funds to better track your spending.
              </div>
              <div className="mt-2 space-x-2">
                {bucketSummaries
                  .filter((bucket) => bucket.unallocatedAmount > 0)
                  .map((bucket) => (
                    <span
                      key={bucket.key}
                      className="inline-flex items-center gap-1 font-size-extra-small bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: bucket.color }}
                      />
                      {bucket.label}: {formatCurrency(bucket.unallocatedAmount)}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Income Sources Table */}
      <Card
        title="Income Sources with Category Allocations"
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
                <div className="text-gray-500 mb-4">
                  <PieChart size={48} className="mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">
                    No income sources yet
                  </h3>
                  <p className="text-sm">
                    Add your income sources and allocate them to categories for
                    detailed budget management.
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
                columns={getEnhancedIncomeColumns(
                  handleEditIncome,
                  handleDeleteIncome,
                  handleToggleActive,
                  handleAllocateToCategories, // ✅ ADD THIS PARAMETER
                  formatCurrency
                )}
                onSearch={handleSearch}
                loading={isLoading}
              />
            )}
          </>
        }
      />

      {/* Use your existing modal */}
      <AddIncomeModal
        isOpen={isIncomeModalOpen}
        onClose={handleIncomeModalClose}
        income={editingIncome}
      />

      {/* ✅ ADD THE CATEGORY ALLOCATION MODAL HERE */}
      <CategoryAllocationModal
        isOpen={isAllocationModalOpen}
        onClose={handleAllocationModalClose}
        income={selectedIncomeForAllocation}
        categories={categories}
      />
    </Page>
  );
};

export default EnhancedIncomeManagement;
