/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import Sort from "@/components/sort";
import { useCallback, useState, useEffect, useRef } from "react";
import { Input } from "@/components/inputs";
import { Badge } from "@/components/ui/badge";
import Checkbox from "@/components/checkbox";

interface BorrowingTableRow {
  month: number;
  year: number;
  monthName: string;
  emiAmount: number;
  isPaid: boolean;
  dueDate: string;
  monthKey: string;
  paymentDetails: string;
}

// Debounced input component for payment details
const DebouncedPaymentDetailsInput = ({
  monthKey,
  currentPaymentDetails,
  onPaymentDetailsChange,
}: {
  monthKey: string;
  currentPaymentDetails: string;
  onPaymentDetailsChange: (monthKey: string, details: string) => void;
}) => {
  const [localValue, setLocalValue] = useState(currentPaymentDetails || "");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value when the prop changes
  useEffect(() => {
    setLocalValue(currentPaymentDetails || "");
  }, [currentPaymentDetails]);

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
        onPaymentDetailsChange(monthKey, value);
      }, 2000); // 500ms delay
    },
    [monthKey, onPaymentDetailsChange]
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
      onPaymentDetailsChange(monthKey, value);
    },
    [monthKey, onPaymentDetailsChange]
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
        onPaymentDetailsChange(monthKey, target.value);
        target.blur();
      }
    },
    [monthKey, onPaymentDetailsChange]
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
      type="text"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="Payment details..."
      formInput={false}
      className="font-size-extra-small"
    />
  );
};

const PaymentStatusCheckbox = ({
  monthKey,
  isPaid,
  onPaymentStatusChange,
}: {
  monthKey: string;
  isPaid: boolean;
  onPaymentStatusChange: (monthKey: string, isPaid: boolean) => void;
}) => {
  const handleCheckedChange = useCallback(
    (checked: boolean) => {
      onPaymentStatusChange(monthKey, checked);
    },
    [monthKey, onPaymentStatusChange]
  );

  return (
    <div>
      <Checkbox checked={isPaid} onCheckedChange={handleCheckedChange} />
    </div>
  );
};

// Status badge component
const StatusBadge = ({ row }: { row: any }) => {
  const isPaid = row.getValue("isPaid") as boolean;
  const dueDate = row.getValue("dueDate") as string;
  const currentDate = new Date();

  // Parse the due date (format: DD/MM/YYYY)
  const [day, month, year] = dueDate.split("/").map(Number);
  const dueDateObj = new Date(year, month - 1, day);

  let statusText = "";
  let statusClass = "";

  if (isPaid) {
    statusText = "Paid";
    statusClass =
      "text-[var(--common-paid-text)] border-[var(--common-paid-border)] bg-[var(--common-paid)] px-2 py-1 rounded-full font-size-extra-small";
  } else if (dueDateObj < currentDate) {
    statusText = "Overdue";
    statusClass =
      "text-[var(--common-overdue-text)] border-[var(--common-overdue-border)] bg-[var(--common-overdue)] px-2 py-1 rounded-full font-size-extra-small";
  } else {
    statusText = "Pending";
    statusClass =
      "text-[var(--common-pending-text)] border-[var(--common-pending-border)] bg-[var(--common-pending)] px-2 py-1 rounded-full font-size-extra-small";
  }

  return (
    <Badge variant="default" className={statusClass}>
      {statusText}
    </Badge>
  );
};

export const getBorrowingTableColumns = (
  onPaymentStatusChange: (monthKey: string, isPaid: boolean) => void,
  onPaymentDetailsChange: (monthKey: string, details: string) => void,
  paymentDetails: Record<string, string>
): ColumnDef<BorrowingTableRow>[] => [
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
    accessorKey: "monthName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Period
        <Sort />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("monthName")}</div>,
    size: 150,
  },
  {
    accessorKey: "emiAmount",
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
    cell: ({ row }) => (
      <div>₹{Number(row.getValue("emiAmount")).toLocaleString("en-IN")}</div>
    ),
    size: 120,
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Due Date
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const dueDate = row.getValue("dueDate") as string;
      // const isPaid = row.getValue("isPaid") as boolean;

      return <div>{dueDate}</div>;
    },
    size: 120,
  },
  {
    accessorKey: "isPaid",
    header: () => <div className="pl-2 pr-2">Payment Status</div>,
    cell: ({ row }) => {
      const monthKey = row.original.monthKey;
      const isPaid = row.getValue("isPaid") as boolean;

      return (
        <PaymentStatusCheckbox
          monthKey={monthKey}
          isPaid={isPaid}
          onPaymentStatusChange={onPaymentStatusChange}
        />
      );
    },
    enableSorting: false,
    size: 120,
  },
  {
    accessorKey: "paymentDetails",
    header: () => <div className="pl-3 pr-3">Payment Details</div>,
    cell: ({ row }) => {
      const monthKey = row.original.monthKey;
      const currentPaymentDetails = paymentDetails[monthKey] || "";

      return (
        <DebouncedPaymentDetailsInput
          monthKey={monthKey}
          currentPaymentDetails={currentPaymentDetails}
          onPaymentDetailsChange={onPaymentDetailsChange}
        />
      );
    },
    enableSorting: false,
    size: 200,
  },
  {
    id: "status",
    header: () => <div className="pl-3 pr-3">Status</div>,
    cell: ({ row }) => <StatusBadge row={row} />,
    enableSorting: false,
    size: 100,
  },
];
