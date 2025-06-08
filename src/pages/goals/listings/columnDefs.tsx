import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sort from "@/components/sort";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface GoalRow {
  id: string;
  name: string;
  description: string | null;
  target_amount: number;
  current_balance: number;
  target_date: string | null;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  contributions?: Array<{
    id: string;
    amount: number;
    contribution_date: string;
  }>;
}

export const getColumns = (
  onView: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<GoalRow>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Goal Name
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const description = row.original.description;
      return (
        <div>
          <div className="font-medium text-[var(--content-textprimary)]">
            {name}
          </div>
          {description && (
            <div className="text-sm text-[var(--content-textsecondary)] truncate max-w-[200px]">
              {description}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "target_amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Target Amount
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("target_amount") as number;
      return (
        <div className="font-medium">₹{amount?.toLocaleString("en-IN")}</div>
      );
    },
  },
  {
    accessorKey: "current_balance",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Current Balance
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("current_balance") as number;
      const targetAmount = row.original.target_amount;
      const isCompleted = amount >= targetAmount;

      return (
        <div
          className={`font-medium ${
            isCompleted ? "text-[var(--common-success)]" : ""
          }`}
        >
          ₹{amount?.toLocaleString("en-IN")}
        </div>
      );
    },
  },
  {
    accessorKey: "target_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Target Date
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const dateStr = row.getValue("target_date") as string;
      if (!dateStr) {
        return (
          <div className="text-[var(--content-textsecondary)]">No date set</div>
        );
      }

      try {
        const date = new Date(dateStr);
        const today = new Date();
        const isOverdue = date < today && !row.original.is_completed;

        return (
          <div
            className={
              isOverdue
                ? "text-[var(--common-error)]"
                : "text-[var(--table-rowtext)]"
            }
          >
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
    id: "progress",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Progress
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { target_amount, current_balance } = row.original;
      const progressPercentage =
        target_amount > 0
          ? Math.min(Math.round((current_balance / target_amount) * 100), 100)
          : 0;

      return (
        <div className="w-full min-w-[120px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-[var(--content-textsecondary)]">
              {progressPercentage}%
            </span>
            <span className="text-xs text-[var(--content-textsecondary)]">
              ₹{(target_amount - current_balance).toLocaleString("en-IN")} left
            </span>
          </div>
          <Progress value={progressPercentage} />
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const progressA =
        rowA.original.target_amount > 0
          ? (rowA.original.current_balance / rowA.original.target_amount) * 100
          : 0;
      const progressB =
        rowB.original.target_amount > 0
          ? (rowB.original.current_balance / rowB.original.target_amount) * 100
          : 0;
      return progressA - progressB;
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
      const { is_completed, target_date, current_balance, target_amount } =
        row.original;

      if (is_completed || current_balance >= target_amount) {
        return (
          <Badge
            variant="default"
            className="bg-[var(--common-success)] text-white"
          >
            Completed
          </Badge>
        );
      }

      if (target_date) {
        const today = new Date();
        const targetDate = new Date(target_date);
        const isOverdue = targetDate < today;

        if (isOverdue) {
          return (
            <Badge
              variant="destructive"
              className="bg-[var(--common-error)] text-white"
            >
              Overdue
            </Badge>
          );
        }
      }

      return (
        <Badge
          variant="secondary"
          className="bg-[var(--common-brand)] text-white"
        >
          Active
        </Badge>
      );
    },
    sortingFn: (rowA, rowB) => {
      const getStatusOrder = (row: GoalRow) => {
        if (row.is_completed || row.current_balance >= row.target_amount)
          return 3; // Completed
        if (row.target_date && new Date(row.target_date) < new Date()) return 1; // Overdue
        return 2; // Active
      };
      return getStatusOrder(rowA.original) - getStatusOrder(rowB.original);
    },
  },
  {
    id: "contributions",
    header: () => <div className="text-center">Contributions</div>,
    cell: ({ row }) => {
      const contributions = row.original.contributions || [];
      const lastContribution =
        contributions.length > 0
          ? [...contributions].sort(
              (a, b) =>
                new Date(b.contribution_date).getTime() -
                new Date(a.contribution_date).getTime()
            )[0]
          : null;

      return (
        <div className="text-center">
          <div className="text-sm font-medium text-[var(--content-textprimary)]">
            {contributions.length} contribution
            {contributions.length !== 1 ? "s" : ""}
          </div>
          {lastContribution && (
            <div className="text-xs text-[var(--content-textsecondary)]">
              Last:{" "}
              {format(new Date(lastContribution.contribution_date), "MMM d")}
            </div>
          )}
        </div>
      );
    },
    enableSorting: false,
  },
  {
    id: "remaining_amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Remaining
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { target_amount, current_balance, is_completed } = row.original;
      const remaining = Math.max(0, target_amount - current_balance);

      if (is_completed || current_balance >= target_amount) {
        return (
          <div className="text-[var(--common-success)] font-medium">
            Goal Achieved!
          </div>
        );
      }

      return (
        <div className="text-[var(--content-textprimary)]">
          ₹{remaining.toLocaleString("en-IN")}
        </div>
      );
    },
    sortingFn: (rowA, rowB) => {
      const remainingA = Math.max(
        0,
        rowA.original.target_amount - rowA.original.current_balance
      );
      const remainingB = Math.max(
        0,
        rowB.original.target_amount - rowB.original.current_balance
      );
      return remainingA - remainingB;
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
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(rowData.id)}
              className="text-[var(--content-textprimary)] font-size-extra-small"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
