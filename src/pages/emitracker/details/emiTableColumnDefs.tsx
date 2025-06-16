import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import Sort from "@/components/sort";
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

// === Debounced input for Prepayment ===
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

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(currentPrepayment?.toString() || "");
    }
  }, [currentPrepayment]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalValue(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const numericValue = value === "" ? 0 : Number(value);
        onPrepaymentChange(month, numericValue);
      }, 500);
    },
    [month, onPrepaymentChange]
  );

  const handleBlur = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const value = e.target.value;
      const numericValue = value === "" ? 0 : Number(value);
      onPrepaymentChange(month, numericValue);
    },
    [month, onPrepaymentChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const target = e.target as HTMLInputElement;
        const numericValue = target.value === "" ? 0 : Number(target.value);
        onPrepaymentChange(month, numericValue);
        inputRef.current?.blur();
      }
    },
    [month, onPrepaymentChange]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <Input
      ref={inputRef}
      type="number"
      field={{ value: localValue }}
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

// === Debounced input for Floating Interest ===
const DebouncedFloatingRateInput = ({
  month,
  currentRate,
  onRateChange,
}: {
  month: number;
  currentRate: number;
  onRateChange: (month: number, rate: number) => void;
}) => {
  const [localValue, setLocalValue] = useState(currentRate?.toString() || "");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(currentRate?.toString() || "");
    }
  }, [currentRate]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalValue(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(() => {
        const numericValue = value === "" ? 0 : Number(value);
        onRateChange(month, numericValue);
      }, 500);
    },
    [month, onRateChange]
  );

  const handleBlur = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);

      const value = e.target.value;
      const numericValue = value === "" ? 0 : Number(value);
      onRateChange(month, numericValue);
    },
    [month, onRateChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        const target = e.target as HTMLInputElement;
        const numericValue = target.value === "" ? 0 : Number(target.value);
        onRateChange(month, numericValue);
        inputRef.current?.blur();
      }
    },
    [month, onRateChange]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <Input
      ref={inputRef}
      type="number"
      field={{ value: localValue }}
      formInput={false}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="e.g. 9.5"
      min="0"
      step="0.01"
      className="max-w-[150px]"
    />
  );
};

// === Columns ===
export const getEmiTableColumns = (
  onPrepaymentChange: (month: number, amount: number) => void,
  prepayments: Record<number, number>,
  onFloatingRateChange: (month: number, rate: number) => void,
  floatingRates: Record<number, number>
): ColumnDef<EmiTableRow>[] => [
  {
    accessorKey: "month",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Month
        <Sort />
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
        className="table-heading"
      >
        EMI
        <Sort />
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
        className="table-heading"
      >
        Principal
        <Sort />
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
        className="table-heading"
      >
        Interest
        <Sort />
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
        className="table-heading"
      >
        Outstanding
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const outstanding = Number(row.getValue("outstandingLoan"));
      return (
        <div className={outstanding === 0 ? "text-green-600" : ""}>
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
  {
    id: "floatingRate",
    header: () => <div>Floating Rate (%)</div>,
    cell: ({ row }) => {
      const month = row.getValue("month") as number;
      const currentRate = floatingRates[month] || 0;
      return (
        <DebouncedFloatingRateInput
          month={month}
          currentRate={currentRate}
          onRateChange={onFloatingRateChange}
        />
      );
    },
    enableSorting: false,
    size: 140,
  },
];
