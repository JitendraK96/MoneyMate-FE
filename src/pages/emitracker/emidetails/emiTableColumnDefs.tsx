import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { ArrowUpDown } from "lucide-react";
import { Input } from "@/components/inputs";
import { useCallback, useState, useEffect, useRef } from "react";

interface EmiTableRow {
  month: number;
  emi: number;
  towardsLoan: number;
  towardsInterest: number;
  outstandingLoan: number;
  prepayment: number;
  year: number;
}

// Debounced input component to prevent focus loss
const DebouncedPrepaymentInput = ({
  month,
  currentPrepayment,
  onPrepaymentChange,
}: {
  month: number;
  currentPrepayment: number;
  onPrepaymentChange: (month: number, amount: number) => void;
}) => {
  const [localValue, setLocalValue] = useState(
    currentPrepayment?.toString() || ""
  );
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update local value when the prop changes (but only if input is not focused)
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(currentPrepayment?.toString() || "");
    }
  }, [currentPrepayment]);

  // Debounced onChange handler
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalValue(value);

      // Clear existing timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Set new timeout for debounced update
      debounceRef.current = setTimeout(() => {
        const numericValue = value === "" ? 0 : Number(value);
        onPrepaymentChange(month, numericValue);
      }, 500); // 500ms delay
    },
    [month, onPrepaymentChange]
  );

  // Immediate update on blur
  const handleBlur = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Clear any pending timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      const value = e.target.value;
      const numericValue = value === "" ? 0 : Number(value);
      onPrepaymentChange(month, numericValue);
    },
    [month, onPrepaymentChange]
  );

  // Handle Enter key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        // Clear any pending timeout
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }

        const target = e.target as HTMLInputElement;
        const numericValue = target.value === "" ? 0 : Number(target.value);
        onPrepaymentChange(month, numericValue);
        inputRef.current?.blur();
      }
    },
    [month, onPrepaymentChange]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <Input
      ref={inputRef}
      type="number"
      field={{
        value: localValue,
      }}
      formInput={false}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="0"
      min="0"
      step="1000"
      className="max-w-[150px]"
    />
  );
};

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
      >
        Month
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("month")}</div>,
    enablePinning: true,
    size: 80,
  },
  {
    accessorKey: "emi",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        EMI
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>₹{Number(row.getValue("emi")).toLocaleString("en-IN")}</div>
    ),
    size: 120,
  },
  {
    accessorKey: "towardsLoan",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Principal
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>₹{Number(row.getValue("towardsLoan")).toLocaleString("en-IN")}</div>
    ),
    size: 120,
  },
  {
    accessorKey: "towardsInterest",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Interest
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
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
      >
        Outstanding
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const outstanding = Number(row.getValue("outstandingLoan"));
      return (
        <div className={`${outstanding === 0 ? "text-green-600" : ""}`}>
          ₹{outstanding.toLocaleString("en-IN")}
        </div>
      );
    },
    size: 140,
  },
  {
    accessorKey: "prepayment",
    header: () => <div>Prepayment</div>,
    cell: ({ row }) => {
      const month = row.getValue("month") as number;
      const currentPrepayment = prepayments[month] || 0;

      return (
        <DebouncedPrepaymentInput
          month={month}
          currentPrepayment={currentPrepayment}
          onPrepaymentChange={onPrepaymentChange}
        />
      );
    },
    enableSorting: false,
    size: 120,
  },
];
