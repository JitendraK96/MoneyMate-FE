import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Link2,
  Unlink,
  Play,
  Pause,
  Edit,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sort from "@/components/sort";
import { Badge } from "@/components/ui/badge";

interface ExpenseSheetRow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  income_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Summary data from view
  total_transactions: number;
  expense_transactions: number;
  total_expenses: number;
  needs_expenses: number;
  wants_expenses: number;
  savings_expenses: number;
  first_transaction_date?: string | null;
  last_transaction_date?: string | null;
}

const EXPENSE_BUCKETS = [
  {
    key: "needs",
    label: "Needs",
    color: "#ef4444",
    description: "Essential expenses like rent, utilities, groceries",
  },
  {
    key: "wants",
    label: "Wants",
    color: "#3b82f6",
    description: "Entertainment, dining out, hobbies",
  },
  {
    key: "savings",
    label: "Savings",
    color: "#22c55e",
    description: "Emergency fund, investments, debt repayment",
  },
] as const;

// Category Breakdown Component
const CategoryBreakdown = ({
  expenseSheet,
}: {
  expenseSheet: ExpenseSheetRow;
}) => {
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  const totalCategorized =
    expenseSheet.needs_expenses +
    expenseSheet.wants_expenses +
    expenseSheet.savings_expenses;

  if (totalCategorized === 0) {
    return (
      <div className="text-center text-[var(--content-textsecondary)] text-sm py-2">
        No categorized expenses
      </div>
    );
  }

  const renderBucketSection = (
    bucketLabel: string,
    bucketColor: string,
    bucketAmount: number
  ) => {
    if (bucketAmount === 0) {
      return null;
    }

    return (
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: bucketColor }}
          />
          <span className="text-[var(--content-textprimary)] text-sm">
            {bucketLabel}: {formatCurrency(bucketAmount)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {/* Needs Section */}
      {renderBucketSection(
        "Needs",
        EXPENSE_BUCKETS[0].color,
        expenseSheet.needs_expenses
      )}

      {/* Wants Section */}
      {renderBucketSection(
        "Wants",
        EXPENSE_BUCKETS[1].color,
        expenseSheet.wants_expenses
      )}

      {/* Savings Section */}
      {renderBucketSection(
        "Savings",
        EXPENSE_BUCKETS[2].color,
        expenseSheet.savings_expenses
      )}
    </div>
  );
};

export const getColumns = (
  onView: (id: string) => void,
  onDelete: (id: string) => void,
  onActivate: (id: string) => void,
  onDeactivate: (id: string) => void
): ColumnDef<ExpenseSheetRow>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Sheet Name
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const description = row.original.description;
      const isLinked = !!row.original.income_id;

      return (
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <div className="font-medium text-[var(--content-textprimary)] flex items-center gap-2">
              {name}
              {isLinked ? (
                <Link2 size={14} className="text-[var(--common-brand)]" />
              ) : (
                <Unlink
                  size={14}
                  className="text-[var(--content-textsecondary)]"
                />
              )}
            </div>
            {description && (
              <div className="text-sm text-[var(--content-textsecondary)] truncate max-w-[200px]">
                {description}
              </div>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "total_transactions",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Transactions
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const total = row.original.total_transactions;

      return (
        <div>
          <div className="font-medium text-[var(--content-textprimary)]">
            {total} total transaction
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "total_expenses",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Total Expenses
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("total_expenses") as number;
      return (
        <div className="font-medium text-[var(--common-error)]">
          ₹{amount?.toLocaleString("en-IN") || "0"}
        </div>
      );
    },
  },
  {
    id: "category_breakdown",
    header: () => <div className="text-left">Category Breakdown</div>,
    cell: ({ row }) => {
      return <CategoryBreakdown expenseSheet={row.original} />;
    },
    enableSorting: false,
  },
  {
    id: "average_expense",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Avg per Transaction
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { total_expenses, expense_transactions } = row.original;

      if (expense_transactions === 0) {
        return (
          <div className="text-[var(--content-textsecondary)] text-sm">
            No expenses yet
          </div>
        );
      }

      const average = total_expenses / expense_transactions;

      return (
        <div className="text-sm">
          <div className="font-medium text-[var(--content-textprimary)]">
            ₹{Math.round(average).toLocaleString("en-IN")}
          </div>
          <div className="text-[var(--content-textsecondary)]">per expense</div>
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const avgA =
        rowA.original.expense_transactions > 0
          ? rowA.original.total_expenses / rowA.original.expense_transactions
          : 0;
      const avgB =
        rowB.original.expense_transactions > 0
          ? rowB.original.total_expenses / rowB.original.expense_transactions
          : 0;
      return avgA - avgB;
    },
  },
  {
    id: "last_activity",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Last Activity
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const lastDate = row.original.last_transaction_date;

      if (!lastDate) {
        return (
          <div className="text-[var(--content-textsecondary)] text-sm">
            No activity yet
          </div>
        );
      }

      try {
        const date = new Date(lastDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let timeAgo = "";
        if (diffDays === 1) {
          timeAgo = "1 day ago";
        } else if (diffDays < 30) {
          timeAgo = `${diffDays} days ago`;
        } else if (diffDays < 365) {
          const months = Math.floor(diffDays / 30);
          timeAgo = months === 1 ? "1 month ago" : `${months} months ago`;
        } else {
          const years = Math.floor(diffDays / 365);
          timeAgo = years === 1 ? "1 year ago" : `${years} years ago`;
        }

        return (
          <div className="text-sm">
            <div className="text-[var(--content-textprimary)]">
              {format(date, "MMM d, yyyy")}
            </div>
            <div className="text-[var(--content-textsecondary)]">{timeAgo}</div>
          </div>
        );
      } catch {
        return (
          <div className="text-[var(--content-textsecondary)] text-sm">
            Invalid date
          </div>
        );
      }
    },
    sortingFn: (rowA, rowB) => {
      const dateA =
        rowA.original.last_transaction_date || rowA.original.created_at;
      const dateB =
        rowB.original.last_transaction_date || rowB.original.created_at;
      return new Date(dateA).getTime() - new Date(dateB).getTime();
    },
  },
  {
    id: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Status
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { total_transactions, is_active } = row.original;

      if (!is_active) {
        return (
          <Badge
            variant="destructive"
            className="bg-[var(--content-textsecondary)] text-white"
          >
            Inactive
          </Badge>
        );
      }

      if (total_transactions === 0) {
        return (
          <Badge
            variant="secondary"
            className="bg-[var(--common-warning)] text-white"
          >
            Empty
          </Badge>
        );
      }

      return (
        <Badge
          variant="default"
          className="bg-[var(--common-success)] text-white"
        >
          Active
        </Badge>
      );
    },
    sortingFn: (rowA, rowB) => {
      const getStatusOrder = (row: ExpenseSheetRow) => {
        if (!row.is_active) return 0; // Inactive
        if (row.total_transactions === 0) return 1; // Empty
        return 2; // Active
      };
      return getStatusOrder(rowA.original) - getStatusOrder(rowB.original);
    },
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
      const dateStr = row.getValue("created_at") as string;
      try {
        const date = new Date(dateStr);
        return (
          <div className="text-sm text-[var(--content-textsecondary)]">
            {format(date, "MMM d, yyyy")}
          </div>
        );
      } catch {
        return (
          <div className="text-[var(--content-textsecondary)]">
            Invalid date
          </div>
        );
      }
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const rowData = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className="!bg-[var(--content)] !border-[var(--common-inputborder)]"
          >
            <Button
              variant="ghost"
              className="ml-auto text-[var(--content-textprimary)] font-size-extra-small !border-[var(--common-inputborder)] focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
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
              onClick={() => onView?.(rowData.id)} // You might want a separate edit handler
              className="text-[var(--content-textprimary)] font-size-extra-small flex items-center gap-2 cursor-pointer"
            >
              <Edit size={16} />
              Edit Sheet
            </DropdownMenuItem>

            <DropdownMenuSeparator className="!bg-[var(--common-inputborder)]" />

            {rowData.is_active ? (
              <DropdownMenuItem
                onClick={() => onDeactivate(rowData.id)}
                className="text-[var(--common-warning)] font-size-extra-small flex items-center gap-2 cursor-pointer"
              >
                <Pause size={16} />
                Deactivate Sheet
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onClick={() => onActivate(rowData.id)}
                className="text-[var(--common-success)] font-size-extra-small flex items-center gap-2 cursor-pointer"
              >
                <Play size={16} />
                Activate Sheet
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="!bg-[var(--common-inputborder)]" />

            <DropdownMenuItem
              onClick={() => onDelete(rowData.id)}
              className="text-[var(--common-error)] font-size-extra-small flex items-center gap-2 cursor-pointer"
            >
              <Trash2 size={16} />
              Delete Permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
