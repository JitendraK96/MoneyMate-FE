import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Sort from "@/components/sort";

interface EmiRow {
  name: string;
  id: number;
  loan_amount: number;
  rate_of_interest: number;
  tenure: number;
  hike_percentage: number;
  is_paid: boolean;
}

export const getColumns = (
  onDelete: (id: number) => void,
  onView: (id: number) => void
): ColumnDef<EmiRow>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
        <Sort />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
    enablePinning: true,
  },
  {
    accessorKey: "loan_amount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Loan Amount
        <Sort />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        ₹{Number(row.getValue("loan_amount")).toLocaleString("en-IN")}
      </div>
    ),
    enablePinning: true,
  },
  {
    accessorKey: "rate_of_interest",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Rate of Interest
        <Sort />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("rate_of_interest")}%</div>,
  },
  {
    accessorKey: "tenure",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Tenure
        <Sort />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("tenure")} yrs</div>,
  },
  {
    accessorKey: "hike_percentage",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Hike Percentage
        <Sort />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("hike_percentage")}%</div>,
  },
  {
    accessorKey: "is_paid",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Paid
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const isPaid = row.getValue("is_paid");
      return <div>{isPaid ? "Yes" : "No"}</div>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const rowData = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView?.(rowData.id)}>
              View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(rowData.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
