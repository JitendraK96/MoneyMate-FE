import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Link2, Unlink } from "lucide-react";
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
  income_source?: string | null;
  income_amount?: number | null;
  income_frequency?: string | null;
  total_transactions: number;
  expense_transactions: number;
  income_transactions: number;
  total_expenses: number;
  total_income: number;
  net_amount: number;
  needs_expenses: number;
  wants_expenses: number;
  savings_expenses: number;
  first_transaction_date?: string | null;
  last_transaction_date?: string | null;
}

export const getColumns = (
  onView: (id: string) => void,
  onDelete: (id: string) => void
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
    accessorKey: "income_source",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Linked Income
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const incomeSource = row.original.income_source;
      const incomeAmount = row.original.income_amount;
      const incomeFrequency = row.original.income_frequency;

      if (!incomeSource) {
        return (
          <div className="text-[var(--content-textsecondary)] text-sm">
            Not linked
          </div>
        );
      }

      return (
        <div>
          <div className="font-medium text-[var(--content-textprimary)]">
            {incomeSource}
          </div>
          {incomeAmount && incomeFrequency && (
            <div className="text-sm text-[var(--content-textsecondary)]">
              ₹{incomeAmount.toLocaleString("en-IN")} {incomeFrequency}
            </div>
          )}
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
      const expenses = row.original.expense_transactions;
      const income = row.original.income_transactions;

      return (
        <div>
          <div className="font-medium text-[var(--content-textprimary)]">
            {total} total
          </div>
          {total > 0 && (
            <div className="text-sm text-[var(--content-textsecondary)]">
              {expenses} expenses, {income} income
            </div>
          )}
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
    accessorKey: "total_income",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Total Income
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("total_income") as number;
      return (
        <div className="font-medium text-[var(--common-success)]">
          ₹{amount?.toLocaleString("en-IN") || "0"}
        </div>
      );
    },
  },
  {
    accessorKey: "net_amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Net Amount
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("net_amount") as number;
      const isPositive = amount >= 0;

      return (
        <div
          className={`font-medium ${
            isPositive
              ? "text-[var(--common-success)]"
              : "text-[var(--common-error)]"
          }`}
        >
          {isPositive ? "+" : ""}₹{amount?.toLocaleString("en-IN") || "0"}
        </div>
      );
    },
  },
  {
    id: "category_breakdown",
    header: () => <div className="text-center">Category Breakdown</div>,
    cell: ({ row }) => {
      const { needs_expenses, wants_expenses, savings_expenses } = row.original;
      const totalCategorized =
        needs_expenses + wants_expenses + savings_expenses;

      if (totalCategorized === 0) {
        return (
          <div className="text-center text-[var(--content-textsecondary)] text-sm">
            No categorized expenses
          </div>
        );
      }

      return (
        <div className="text-center">
          <div className="text-sm space-y-1">
            {needs_expenses > 0 && (
              <div className="text-[var(--common-error)]">
                Needs: ₹{needs_expenses.toLocaleString("en-IN")}
              </div>
            )}
            {wants_expenses > 0 && (
              <div className="text-[var(--common-brand)]">
                Wants: ₹{wants_expenses.toLocaleString("en-IN")}
              </div>
            )}
            {savings_expenses > 0 && (
              <div className="text-[var(--common-success)]">
                Savings: ₹{savings_expenses.toLocaleString("en-IN")}
              </div>
            )}
          </div>
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "date_range",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Activity Period
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const firstDate = row.original.first_transaction_date;
      const lastDate = row.original.last_transaction_date;

      if (!firstDate || !lastDate) {
        return (
          <div className="text-[var(--content-textsecondary)] text-sm">
            No transactions yet
          </div>
        );
      }

      try {
        const first = new Date(firstDate);
        const last = new Date(lastDate);
        const isSameDay = first.toDateString() === last.toDateString();

        return (
          <div className="text-sm">
            <div className="text-[var(--content-textprimary)]">
              {format(first, "MMM d, yyyy")}
            </div>
            {!isSameDay && (
              <div className="text-[var(--content-textsecondary)]">
                to {format(last, "MMM d, yyyy")}
              </div>
            )}
          </div>
        );
      } catch {
        return (
          <div className="text-[var(--content-textsecondary)] text-sm">
            Invalid dates
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
              onClick={() => onView?.(rowData.id)}
              className="text-[var(--content-textprimary)] font-size-extra-small"
            >
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onView?.(rowData.id)} // You might want a separate edit handler
              className="text-[var(--content-textprimary)] font-size-extra-small"
            >
              Edit Sheet
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(rowData.id)}
              className="text-[var(--common-error)] font-size-extra-small"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
