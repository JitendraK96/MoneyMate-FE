/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import Sort from "@/components/sort";
import { useCallback, useState, useEffect, useRef } from "react";
import { Input } from "@/components/inputs";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CategoryAllocationRow {
  categoryId: string;
  categoryName: string;
  categoryColor?: string;
  allocatedAmount: number;
  bucketKey: string;
  bucketTotal: number;
  percentageOfBucket: number;
  isAllocated: boolean;
}

// Debounced input component for category allocation amounts
const DebouncedAmountInput = ({
  categoryId,
  bucketKey,
  currentAmount,
  onAmountChange,
}: {
  categoryId: string;
  bucketKey: string;
  currentAmount: number;
  onAmountChange: (
    categoryId: string,
    bucketKey: string,
    amount: number
  ) => void;
  bucketTotal: number;
}) => {
  const [localValue, setLocalValue] = useState(currentAmount.toString());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Update local value when the prop changes
  useEffect(() => {
    setLocalValue(currentAmount.toString());
  }, [currentAmount]);

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
        const numValue =
          value === "" ? 0 : Math.max(0, Math.round(parseFloat(value)));
        onAmountChange(categoryId, bucketKey, numValue);
      }, 500); // 500ms delay
    },
    [categoryId, bucketKey, onAmountChange]
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
      const numValue =
        value === "" ? 0 : Math.max(0, Math.round(parseFloat(value)));
      onAmountChange(categoryId, bucketKey, numValue);
      setLocalValue(numValue.toString());
    },
    [categoryId, bucketKey, onAmountChange]
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
        const numValue =
          target.value === ""
            ? 0
            : Math.max(0, Math.round(parseFloat(target.value)));
        onAmountChange(categoryId, bucketKey, numValue);
        setLocalValue(numValue.toString());
        target.blur();
      }
    },
    [categoryId, bucketKey, onAmountChange]
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
    <div className="relative">
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
        ₹
      </span>
      <Input
        type="text"
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="0"
        formInput={false}
        className="pl-7 text-center font-size-small"
      />
    </div>
  );
};

// Category actions component
const CategoryActions = ({
  categoryId,
  bucketKey,
  unallocatedAmount,
  onQuickAllocate,
  onRemoveAllocation,
}: {
  categoryId: string;
  bucketKey: string;
  isAllocated: boolean;
  unallocatedAmount: number;
  onQuickAllocate: (categoryId: string, bucketKey: string) => void;
  onRemoveAllocation: (categoryId: string, bucketKey: string) => void;
  onAddAllocation: (categoryId: string, bucketKey: string) => void;
}) => {
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
          onClick={() => onQuickAllocate(categoryId, bucketKey)}
          disabled={unallocatedAmount <= 0}
          className="text-[var(--content-textprimary)] font-size-extra-small"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Remaining Amount
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onRemoveAllocation(categoryId, bucketKey)}
          className="text-[var(--content-textprimary)] font-size-extra-small"
        >
          <Minus className="mr-2 h-4 w-4" />
          Remove Allocation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Status badge component for allocation
const AllocationStatusBadge = ({ row }: { row: any }) => {
  const isAllocated = row.getValue("isAllocated") as boolean;
  const percentageOfBucket = row.getValue("percentageOfBucket") as number;

  let statusText = "";
  let statusClass = "";

  if (isAllocated) {
    if (percentageOfBucket >= 50) {
      statusText = "High";
      statusClass =
        "text-[var(--common-paid-text)] border-[var(--common-paid-border)] bg-[var(--common-paid)] px-2 py-1 rounded-full font-size-extra-small";
    } else if (percentageOfBucket >= 20) {
      statusText = "Medium";
      statusClass =
        "text-[var(--common-pending-text)] border-[var(--common-pending-border)] bg-[var(--common-pending)] px-2 py-1 rounded-full font-size-extra-small";
    } else {
      statusText = "Low";
      statusClass =
        "text-blue-600 border-blue-200 bg-blue-50 px-2 py-1 rounded-full font-size-extra-small";
    }
  } else {
    statusText = "Not Allocated";
    statusClass =
      "text-gray-500 border-gray-200 bg-gray-50 px-2 py-1 rounded-full font-size-extra-small";
  }

  return (
    <Badge variant="default" className={statusClass}>
      {statusText}
    </Badge>
  );
};

export const getCategoryAllocationTableColumns = (
  bucketKey: string,
  unallocatedAmount: number,
  onAmountChange: (
    categoryId: string,
    bucketKey: string,
    amount: number
  ) => void,
  onQuickAllocate: (categoryId: string, bucketKey: string) => void,
  onRemoveAllocation: (categoryId: string, bucketKey: string) => void,
  onAddAllocation: (categoryId: string, bucketKey: string) => void
): ColumnDef<CategoryAllocationRow>[] => [
  {
    accessorKey: "categoryName",
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
      const categoryColor = row.original.categoryColor;
      const categoryName = row.getValue("categoryName") as string;

      return (
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: categoryColor || "#6b7280" }}
          />
          <span className="font-medium">{categoryName}</span>
        </div>
      );
    },
    enablePinning: true,
    size: 200,
  },
  {
    accessorKey: "allocatedAmount",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        Allocated Amount
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const categoryId = row.original.categoryId;
      const allocatedAmount = row.getValue("allocatedAmount") as number;
      const bucketTotal = row.original.bucketTotal;

      return (
        <DebouncedAmountInput
          categoryId={categoryId}
          bucketKey={bucketKey}
          currentAmount={allocatedAmount}
          onAmountChange={onAmountChange}
          bucketTotal={bucketTotal}
        />
      );
    },
    size: 150,
  },
  {
    accessorKey: "percentageOfBucket",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="table-heading"
      >
        % of Bucket
        <Sort />
      </Button>
    ),
    cell: ({ row }) => {
      const percentage = row.getValue("percentageOfBucket") as number;
      return <div className="text-center">{percentage.toFixed(1)}%</div>;
    },
    size: 100,
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const categoryId = row.original.categoryId;
      const isAllocated = row.original.isAllocated;

      return (
        <CategoryActions
          categoryId={categoryId}
          bucketKey={bucketKey}
          isAllocated={isAllocated}
          unallocatedAmount={unallocatedAmount}
          onQuickAllocate={onQuickAllocate}
          onRemoveAllocation={onRemoveAllocation}
          onAddAllocation={onAddAllocation}
        />
      );
    },
    size: 50,
  },
  {
    accessorKey: "isAllocated",
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
    cell: ({ row }) => <AllocationStatusBadge row={row} />,
    size: 120,
  },
];
