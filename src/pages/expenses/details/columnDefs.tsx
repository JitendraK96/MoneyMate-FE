import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Calendar,
  IndianRupee,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sort from "@/components/sort";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export interface TransactionWithDetails {
  id: string;
  amount: number;
  description: string;
  transaction_date: string;
  transaction_type: "expense" | "income";
  category_name?: string;
  category_bucket?: string;
  category_color?: string;
  payee_name?: string;
  expense_sheet_name: string;
  expense_sheet_id: string;
  is_active: boolean;
  signed_amount: number;
  absolute_amount: number;
  user_id: string;
  category_id?: string;
  payee_id?: string;
  created_at: string;
  updated_at: string;
}

export const getTransactionColumns = (
  onEdit: (transaction: TransactionWithDetails) => void,
  onDelete: (id: string) => void
): ColumnDef<TransactionWithDetails>[] => [
  {
    accessorKey: "transaction_date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        <Calendar className="mr-2 h-4 w-4" />
        Date
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const date = row.getValue("transaction_date") as string;
      return (
        <div className="text-sm text-[var(--content-textprimary)] min-w-[100px]">
          {format(new Date(date), "MMM dd, yyyy")}
        </div>
      );
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "description",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Description
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { description, payee_name } = row.original;
      return (
        <div className="min-w-[150px]">
          <div className="font-medium text-[var(--content-textprimary)] truncate max-w-[200px]">
            {description}
          </div>
          {payee_name && (
            <div className="text-sm text-[var(--content-textsecondary)] truncate max-w-[200px]">
              Payee: {payee_name}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "absolute_amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        <IndianRupee className="mr-2 h-4 w-4" />
        Amount
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { absolute_amount, transaction_type } = row.original;
      const isExpense = transaction_type === "expense";

      return (
        <div
          className={`font-medium text-right min-w-[100px] ${
            isExpense
              ? "text-[var(--common-error)]"
              : "text-[var(--common-success)]"
          }`}
        >
          {isExpense ? "-" : "+"}₹
          {absolute_amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      );
    },
    sortingFn: "alphanumeric",
  },
  {
    accessorKey: "category_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Category
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const { category_name, category_bucket, category_color } = row.original;

      if (!category_name) {
        return (
          <Badge variant="secondary" className="text-xs">
            Uncategorized
          </Badge>
        );
      }

      const getBucketColor = (bucket?: string) => {
        switch (bucket) {
          case "needs":
            return "#ef4444"; // red
          case "wants":
            return "#f59e0b"; // amber
          case "savings":
            return "#10b981"; // emerald
          default:
            return "#6b7280"; // gray
        }
      };

      return (
        <div className="flex items-center gap-2 min-w-[120px]">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{
              backgroundColor:
                category_color || getBucketColor(category_bucket),
            }}
          />
          <Badge
            variant="secondary"
            className="text-xs truncate max-w-[100px]"
            title={category_name}
          >
            {category_name}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "expense_sheet_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Expense Sheet
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const sheetName = row.getValue("expense_sheet_name") as string;
      return (
        <div
          className="text-sm text-[var(--content-textprimary)] max-w-[150px] truncate"
          title={sheetName}
        >
          {sheetName}
        </div>
      );
    },
  },
  {
    id: "type",
    header: () => <div>Type</div>,
    cell: ({ row }) => {
      const type = row.original.transaction_type;
      return (
        <Badge
          variant={type === "expense" ? "destructive" : "default"}
          className="text-xs"
        >
          {type === "expense" ? "Expense" : "Income"}
        </Badge>
      );
    },
    enableSorting: false,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const transaction = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            className="!bg-[var(--content)] !border-[var(--common-inputborder)]"
          >
            <Button
              variant="ghost"
              className="ml-auto text-[var(--content-textprimary)] font-size-extra-small !border-[var(--common-inputborder)] h-8 w-8 p-0"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="!bg-[var(--content)] !border-[var(--common-inputborder)]"
          >
            <DropdownMenuItem
              onClick={() => onEdit(transaction)}
              className="text-[var(--content-textprimary)] font-size-extra-small cursor-pointer"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit Transaction
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(transaction.id)}
              className="text-[var(--common-error)] font-size-extra-small cursor-pointer"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Transaction
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
