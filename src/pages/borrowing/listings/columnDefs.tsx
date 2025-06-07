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

interface BorrowingRow {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  borrowing_amount: number;
  tenure: number;
  emi_amount: number;
  paid_months: Record<string, boolean>;
  payment_details: Record<string, string>;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
}

export const getColumns = (
  onView: (id: string) => void,
  onDelete: (id: string) => void
): ColumnDef<BorrowingRow>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Title
        <Sort />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("title")}</div>,
  },
  {
    accessorKey: "borrowing_amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Loan Amount
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("borrowing_amount") as number;
      return <div>₹{amount?.toLocaleString("en-IN")}</div>;
    },
  },
  {
    accessorKey: "emi_amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        EMI Amount
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("emi_amount") as number;
      return <div>₹{amount?.toLocaleString("en-IN")}</div>;
    },
  },
  {
    accessorKey: "tenure",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Tenure
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const tenure = row.getValue("tenure") as number;
      return (
        <div>
          {tenure} year{tenure !== 1 ? "s" : ""}
        </div>
      );
    },
  },
  {
    accessorKey: "start_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Start Date
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const dateStr = row.getValue("start_date") as string;
      try {
        const date = new Date(dateStr);
        return <div>{format(date, "MMM d, yyyy")}</div>;
      } catch {
        return <div>Invalid date</div>;
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
      const { tenure, paid_months } = row.original;
      const totalMonths = tenure * 12;
      const paidCount = Object.values(paid_months || {}).filter(Boolean).length;
      const progressPercentage =
        totalMonths > 0 ? Math.round((paidCount / totalMonths) * 100) : 0;

      return (
        <Progress
          value={progressPercentage}
          className="!bg-[var(--content-textprimary)"
        />
      );
    },
  },
  {
    id: "next_due",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Next Due
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { start_date, tenure, paid_months, is_completed } = row.original;

      if (is_completed) {
        return <div className="text-[var(--table-rowtext)]">—</div>;
      }

      try {
        const startDate = new Date(start_date);
        const totalMonths = tenure * 12;

        // Find the first unpaid month
        for (let i = 0; i < totalMonths; i++) {
          const currentMonth = new Date(startDate);
          currentMonth.setMonth(startDate.getMonth() + i);
          currentMonth.setDate(5); // Due on 5th of each month

          const monthKey = `${currentMonth.getFullYear()}-${String(
            currentMonth.getMonth() + 1
          ).padStart(2, "0")}`;

          if (!paid_months?.[monthKey]) {
            const today = new Date();
            const isOverdue = currentMonth < today;

            return (
              <div
                className={`${
                  isOverdue
                    ? "text-[var(--common-error)]"
                    : "text-[var(--table-rowtext)]"
                }`}
              >
                {format(currentMonth, "MMM d, yyyy")}
              </div>
            );
          }
        }

        return <div className="text-[var(--table-rowtext)]">All paid</div>;
      } catch {
        return <div className="text-[var(--table-rowtext)]">—</div>;
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
