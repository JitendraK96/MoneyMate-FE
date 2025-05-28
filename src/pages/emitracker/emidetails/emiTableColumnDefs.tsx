import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";

interface EmiTableRow {
  month: number;
  emi: number;
  towardsLoan: number;
  towardsInterest: number;
  outstandingLoan: number;
  prepayment: number;
  year: number;
}

export const getEmiTableColumns = (
  onPrepaymentChange: (month: number, amount: number) => void,
  prepayments: Record<number, number>
): ColumnDef<EmiTableRow>[] => [
  {
    accessorKey: "month",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Month
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center font-medium">{row.getValue("month")}</div>
    ),
    enablePinning: true,
    size: 80,
  },
  {
    accessorKey: "year",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Year
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-center">{row.getValue("year")}</div>
    ),
    size: 80,
  },
  {
    accessorKey: "emi",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        EMI
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right font-medium">
        ₹{Number(row.getValue("emi")).toLocaleString("en-IN")}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "towardsLoan",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Principal
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right">
        ₹{Number(row.getValue("towardsLoan")).toLocaleString("en-IN")}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "towardsInterest",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Interest
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="text-right">
        ₹{Number(row.getValue("towardsInterest")).toLocaleString("en-IN")}
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "outstandingLoan",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold hover:bg-transparent"
      >
        Outstanding
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const outstanding = Number(row.getValue("outstandingLoan"));
      return (
        <div
          className={`text-right font-medium ${
            outstanding === 0 ? "text-green-600" : ""
          }`}
        >
          ₹{outstanding.toLocaleString("en-IN")}
        </div>
      );
    },
    size: 140,
  },
  {
    accessorKey: "prepayment",
    header: () => <div className="text-center font-semibold">Prepayment</div>,
    cell: ({ row }) => {
      const month = row.getValue("month") as number;
      const currentPrepayment = prepayments[month] || 0;

      return (
        <div className="flex justify-center">
          <input
            type="number"
            min="0"
            step="1000"
            value={currentPrepayment || ""}
            onChange={(e) => {
              const value = e.target.value === "" ? 0 : Number(e.target.value);
              onPrepaymentChange(month, value);
            }}
            className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-md text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      );
    },
    enableSorting: false,
    size: 120,
  },
];
