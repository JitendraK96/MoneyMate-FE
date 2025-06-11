import React, { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  DollarSign,
  ChevronDown,
  ChevronRight,
  Calculator,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sort from "@/components/sort";
import { Badge } from "@/components/ui/badge";

// Enhanced types
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

const BUCKETS = [
  {
    key: "needs",
    label: "Needs",
    color: "#ef4444",
    recommendedPercentage: 50,
  },
  {
    key: "wants",
    label: "Wants",
    color: "#3b82f6",
    recommendedPercentage: 30,
  },
  {
    key: "savings",
    label: "Savings",
    color: "#22c55e",
    recommendedPercentage: 20,
  },
] as const;

const INCOME_FREQUENCIES = [
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "weekly", label: "Weekly" },
  { key: "bi-weekly", label: "Bi-Weekly" },
] as const;

// Enhanced Allocation Cell Component
const EnhancedAllocationCell = ({
  income,
  formatCurrency,
}: {
  income: EnhancedIncome;
  formatCurrency: (amount: number) => string;
}) => {
  const [expandedBuckets, setExpandedBuckets] = useState<{
    [key: string]: boolean;
  }>({});

  const toggleBucket = (bucketKey: string) => {
    setExpandedBuckets((prev) => ({
      ...prev,
      [bucketKey]: !prev[bucketKey],
    }));
  };

  const renderBucketSection = (
    bucketKey: "needs" | "wants" | "savings",
    bucketLabel: string,
    bucketColor: string,
    bucketPercentage: number,
    categoryAllocations: CategoryAllocation[] = [],
    unallocatedPercentage: number = 0,
    unallocatedAmount: number = 0
  ) => {
    const isExpanded = expandedBuckets[bucketKey];
    const bucketAmount = (income.monthly_amount * bucketPercentage) / 100;
    const hasAllocations =
      categoryAllocations && categoryAllocations.length > 0;

    console.log(bucketLabel);
    return (
      <div key={bucketKey} className="mb-2">
        {/* Bucket Header */}
        <button
          onClick={() => toggleBucket(bucketKey)}
          className="flex items-center gap-1 w-full text-left hover:bg-[var(--sidebar-hover)] p-1 rounded font-size-extra-small"
        >
          {isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-400" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-400" />
          )}
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: bucketColor }}
          />
          <div className="flex items-center gap-1 min-w-0 flex-1">
            <span className="font-size-extra-small w-8 text-right">
              {bucketPercentage}%
            </span>
            <span className="font-size-extra-small text-gray-600 truncate">
              {formatCurrency(bucketAmount)}
            </span>
          </div>
        </button>

        {/* Category Details */}
        {isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {/* Category Allocations */}
            {hasAllocations &&
              categoryAllocations.map((allocation) => (
                <div
                  key={allocation.category_id}
                  className="flex items-center gap-1 font-size-extra-small p-1 bg-gray-50 rounded"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: allocation.category_color || "#6b7280",
                    }}
                  />
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="font-size-extra-small w-6 text-right">
                      {allocation.allocated_percentage}%
                    </span>
                    <span className="text-gray-500 font-size-extra-small truncate">
                      {formatCurrency(allocation.allocated_amount)}
                    </span>
                  </div>
                  <span className="font-size-extra-small text-gray-600 truncate max-w-20">
                    {allocation.category_name}
                  </span>
                </div>
              ))}

            {/* Unallocated Amount */}
            {unallocatedPercentage > 0 && (
              <div className="flex items-center gap-1 font-size-extra-small p-1 bg-yellow-50 border border-yellow-200 rounded">
                <div className="w-2 h-2 rounded-full flex-shrink-0 bg-yellow-400" />
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="font-medium w-6 text-right font-size-extra-small text-yellow-700">
                    {unallocatedPercentage.toFixed(1)}%
                  </span>
                  <span className="text-yellow-700 font-size-extra-small">
                    {formatCurrency(unallocatedAmount)}
                  </span>
                </div>
                <span className="font-size-extra-small text-yellow-700 truncate max-w-20">
                  Unallocated
                </span>
              </div>
            )}

            {/* No allocations message */}
            {!hasAllocations && unallocatedPercentage <= 0 && (
              <div className="font-size-extra-small text-gray-400 italic pl-3">
                No allocations
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Calculate unallocated amounts if not provided (fallback for regular incomes)
  const unallocated_needs_percentage =
    income.unallocated_needs_percentage ?? income.needs_percentage;
  const unallocated_wants_percentage =
    income.unallocated_wants_percentage ?? income.wants_percentage;
  const unallocated_savings_percentage =
    income.unallocated_savings_percentage ?? income.savings_percentage;

  const unallocated_needs_amount =
    income.unallocated_needs_amount ??
    (income.monthly_amount * unallocated_needs_percentage) / 100;
  const unallocated_wants_amount =
    income.unallocated_wants_amount ??
    (income.monthly_amount * unallocated_wants_percentage) / 100;
  const unallocated_savings_amount =
    income.unallocated_savings_amount ??
    (income.monthly_amount * unallocated_savings_percentage) / 100;

  return (
    <div className="space-y-1 min-w-64">
      {/* Quick Summary */}
      <div className="text-xs text-gray-500 mb-2">
        Enhanced Allocation • {formatCurrency(income.monthly_amount)}/month
      </div>

      {/* Needs Section */}
      {renderBucketSection(
        "needs",
        "Needs",
        BUCKETS[0].color,
        income.needs_percentage,
        income.needs_category_allocations || [],
        unallocated_needs_percentage,
        unallocated_needs_amount
      )}

      {/* Wants Section */}
      {renderBucketSection(
        "wants",
        "Wants",
        BUCKETS[1].color,
        income.wants_percentage,
        income.wants_category_allocations || [],
        unallocated_wants_percentage,
        unallocated_wants_amount
      )}

      {/* Savings Section */}
      {renderBucketSection(
        "savings",
        "Savings",
        BUCKETS[2].color,
        income.savings_percentage,
        income.savings_category_allocations || [],
        unallocated_savings_percentage,
        unallocated_savings_amount
      )}

      {/* Validation indicator */}
      <div className="pt-2 mt-2 border-t border-gray-200">
        {income.needs_percentage +
          income.wants_percentage +
          income.savings_percentage ===
        100 ? (
          <div className="text-xs text-green-600 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            Fully allocated (100%)
          </div>
        ) : (
          <div className="text-xs text-red-500 flex items-center gap-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            Total:{" "}
            {income.needs_percentage +
              income.wants_percentage +
              income.savings_percentage}
            %{" "}
          </div>
        )}

        {/* Total unallocated warning */}
        {unallocated_needs_amount +
          unallocated_wants_amount +
          unallocated_savings_amount >
          0 && (
          <div className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            {formatCurrency(
              unallocated_needs_amount +
                unallocated_wants_amount +
                unallocated_savings_amount
            )}{" "}
            unallocated
          </div>
        )}
      </div>
    </div>
  );
};

export const getEnhancedIncomeColumns = (
  onEdit: (income: EnhancedIncome) => void,
  onDelete: (id: string) => void,
  onToggleActive: (income: EnhancedIncome) => void,
  onAllocateToCategories: (income: EnhancedIncome) => void,
  formatCurrency: (amount: number) => string
): ColumnDef<EnhancedIncome>[] => [
  {
    accessorKey: "source",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Income Source
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { source, description } = row.original;
      return (
        <div>
          <div className="font-size-small flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-500" />
            {source}
          </div>
          {description && (
            <div className="ont-size-extra-small truncate max-w-[200px] mt-1">
              {description}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Amount & Frequency
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { amount, frequency, monthly_amount } = row.original;
      const frequencyInfo = INCOME_FREQUENCIES.find((f) => f.key === frequency);

      return (
        <div>
          <div className="font-size-small">{formatCurrency(amount)}</div>
          <div className="flex items-center gap-1 font-size-extra-small">
            <Calendar className="w-3 h-3" />
            <span>{frequencyInfo?.label}</span>
          </div>
          {frequency !== "monthly" && (
            <div className="font-size-extra-small mt-1">
              ≈ {formatCurrency(monthly_amount)}/month
            </div>
          )}
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      return rowA.original.monthly_amount - rowB.original.monthly_amount;
    },
  },
  {
    id: "enhanced_allocation",
    header: () => <div>Enhanced Budget Allocation</div>,
    cell: ({ row }) => {
      return (
        <EnhancedAllocationCell
          income={row.original}
          formatCurrency={formatCurrency}
        />
      );
    },
    enableSorting: false,
  },
  {
    id: "status",
    header: () => <div>Status</div>,
    cell: ({ row }) => {
      const income = row.original;
      const isActive = income.is_active;

      // Calculate total unallocated amount
      const unallocated_needs =
        income.unallocated_needs_amount ??
        (income.monthly_amount * income.needs_percentage) / 100;
      const unallocated_wants =
        income.unallocated_wants_amount ??
        (income.monthly_amount * income.wants_percentage) / 100;
      const unallocated_savings =
        income.unallocated_savings_amount ??
        (income.monthly_amount * income.savings_percentage) / 100;

      const hasUnallocated =
        unallocated_needs + unallocated_wants + unallocated_savings > 0;
      const hasSignificantUnallocated =
        unallocated_needs + unallocated_wants + unallocated_savings > 100;
      console.log(hasUnallocated);
      return (
        <div className="flex flex-col gap-1">
          <Badge variant={isActive ? "default" : "secondary"}>
            {isActive ? "Active" : "Inactive"}
          </Badge>
          {!isActive && (
            <div className="font-size-extra-small text-gray-500">
              Not included in totals
            </div>
          )}
          {isActive && hasSignificantUnallocated && (
            <div className="font-size-extra-small text-yellow-600 bg-yellow-50 px-1 py-0.5 rounded">
              Has unallocated funds
            </div>
          )}
          {isActive && (income.needs_category_allocations?.length || 0) > 0 && (
            <div className="font-size-extra-small text-green-600 bg-green-50 px-1 py-0.5 rounded">
              Category allocations
            </div>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Created
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const createdAt = new Date(row.getValue("created_at"));
      return (
        <div className="font-size-extra-small">
          {createdAt.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const income = row.original;

      const handleEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onEdit(income);
      };

      const handleToggleActive = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleActive(income);
      };

      const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDelete(income.id);
      };

      const handleAllocateToCategories = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAllocateToCategories(income);
      };

      return (
        <div className="flex justify-end">
          {/* <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 bg-white border border-gray-200 shadow-lg z-50"
              side="bottom"
              sideOffset={5}
            >
              <DropdownMenuItem
                onClick={handleEdit}
                className="cursor-pointer hover:bg-gray-50 text-sm px-3 py-2"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Income
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleAllocateToCategories}
                className="cursor-pointer hover:bg-gray-50 text-sm px-3 py-2"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Allocate to Categories
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleToggleActive}
                className="cursor-pointer hover:bg-gray-50 text-sm px-3 py-2"
              >
                {income.is_active ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-200" />

              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer hover:bg-red-50 text-red-600 text-sm px-3 py-2"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
          <DropdownMenu>
            <DropdownMenuTrigger
              asChild
              className="!bg-[var(--content)] !border-[var(--common-inputborder)]"
            >
              <Button
                variant="ghost"
                className="ml-auto text-[var(--content-textprimary)] font-size-extra-small !border-[var(--common-inputborder)]"
              >
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="!bg-[var(--content)] !border-[var(--common-inputborder)]"
            >
              <DropdownMenuItem
                onClick={handleEdit}
                className="text-[var(--content-textprimary)] font-size-extra-small"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleAllocateToCategories}
                className="text-[var(--content-textprimary)] font-size-extra-small"
              >
                <Calculator className="mr-2 h-4 w-4" />
                Allocate to Categories
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleToggleActive}
                className="text-[var(--content-textprimary)] font-size-extra-small"
              >
                {income.is_active ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-[var(--common-error)] font-size-extra-small"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
