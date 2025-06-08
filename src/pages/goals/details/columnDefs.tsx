import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import Sort from "@/components/sort";
import { format } from "date-fns";

interface ContributionTableRow {
  id: string;
  contribution_date: string;
  amount: number;
  description: string;
  created_at: string;
}

export const getContributionTableColumns =
  (): ColumnDef<ContributionTableRow>[] => [
    {
      accessorKey: "contribution_date",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="table-heading"
        >
          Date
          <Sort />
        </Button>
      ),
      cell: ({ row }) => {
        const dateStr = row.getValue("contribution_date") as string;
        try {
          const date = new Date(dateStr);
          return <div>{format(date, "MMM d, yyyy")}</div>;
        } catch {
          return <div>Invalid date</div>;
        }
      },
      enablePinning: true,
      size: 120,
    },
    {
      accessorKey: "amount",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="table-heading"
        >
          Amount
          <Sort />
        </Button>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        return <div>₹{Number(amount).toLocaleString("en-IN")}</div>;
      },
      size: 120,
    },
    {
      accessorKey: "description",
      header: () => <div className="pl-2 pr-2">Description</div>,
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
        return <div>{description || <span>No description</span>}</div>;
      },
      enableSorting: false,
      size: 200,
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="table-heading"
        >
          Added On
          <Sort />
        </Button>
      ),
      cell: ({ row }) => {
        const dateStr = row.getValue("created_at") as string;
        try {
          const date = new Date(dateStr);
          return <div>{format(date, "MMM d, yyyy 'at' h:mm a")}</div>;
        } catch {
          return <div className="text-muted-foreground">Invalid date</div>;
        }
      },
      size: 160,
    },
  ];
