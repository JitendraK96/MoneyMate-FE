/* eslint-disable @typescript-eslint/no-explicit-any */
import { ColumnDef } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/inputs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, Trash2 } from "lucide-react";
import { Input, DatePicker } from "@/components/inputs";
import React, { useState, useCallback, useEffect, useRef } from "react";

interface ParsedTransaction {
  id: string;
  date: string;
  payee: string;
  amount: number;
  category_id?: string;
  isValid: boolean;
  errors: string[];
}

interface Category {
  id: string;
  name: string;
  bucket: string;
  color: string;
}

interface TransactionTableProps {
  categories: Category[];
  selectedTransactions: Set<string>;
  onSelectTransaction: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onUpdateTransaction: (
    id: string,
    field: keyof ParsedTransaction,
    value: any
  ) => void;
  onUpdateCategory: (transactionId: string, categoryId: string) => void;
  onRemoveTransaction: (transactionId: string) => void;
  filteredTransactions: ParsedTransaction[];
}

// Debounced Transaction Input Component
const DebouncedTransactionInput = ({
  transaction,
  field,
  onUpdate,
  type = "text",
  placeholder,
}: {
  transaction: ParsedTransaction;
  field: keyof ParsedTransaction;
  onUpdate: (id: string, field: keyof ParsedTransaction, value: any) => void;
  type?: string;
  placeholder?: string;
}) => {
  const [localValue, setLocalValue] = useState(
    String(transaction[field] || "")
  );
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(String(transaction[field] || ""));
    }
  }, [transaction, field]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setLocalValue(value);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        let processedValue: any = value;
        if (type === "number") {
          processedValue = value === "" ? 0 : Number(value);
        }
        onUpdate(transaction.id, field, processedValue);
      }, 300);
    },
    [transaction.id, field, onUpdate, type]
  );

  const handleDateChange = useCallback(
    (selectedDate: Date | undefined) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        const dateValue = selectedDate
          ? selectedDate.toISOString().split("T")[0]
          : "";
        onUpdate(transaction.id, field, dateValue);
      }, 300);
    },
    [transaction.id, field, onUpdate]
  );

  const handleBlur = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }

      const value = e.target.value;
      let processedValue: any = value;
      if (type === "number") {
        processedValue = value === "" ? 0 : Number(value);
      }
      onUpdate(transaction.id, field, processedValue);
    },
    [transaction.id, field, onUpdate, type]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }

        const target = e.target as HTMLInputElement;
        let processedValue: any = target.value;
        if (type === "number") {
          processedValue = target.value === "" ? 0 : Number(target.value);
        }
        onUpdate(transaction.id, field, processedValue);
        inputRef.current?.blur();
      }
    },
    [transaction.id, field, onUpdate, type]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Use DatePicker for date type
  if (type === "date") {
    const dateValue = transaction[field]
      ? new Date(String(transaction[field]))
      : undefined;

    return (
      <DatePicker
        field={{
          value: dateValue,
        }}
        placeholder={placeholder || "Select date"}
        onChange={handleDateChange}
        formInput={false}
      />
    );
  }

  // Use regular Input for other types
  return (
    <Input
      ref={inputRef}
      type={type}
      field={{
        value: localValue,
      }}
      formInput={false}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      min={type === "number" ? "0" : undefined}
      step={type === "number" ? "0.01" : undefined}
      className="w-full text-xs"
    />
  );
};

export const getTransactionTableColumns = ({
  categories,
  selectedTransactions,
  onSelectTransaction,
  onSelectAll,
  onUpdateTransaction,
  onUpdateCategory,
  onRemoveTransaction,
  filteredTransactions,
}: TransactionTableProps): ColumnDef<ParsedTransaction>[] => [
  {
    id: "select",
    header: () => (
      <Checkbox
        checked={
          selectedTransactions.size === filteredTransactions.length &&
          filteredTransactions.length > 0
        }
        onCheckedChange={(checked) => onSelectAll(checked as boolean)}
        aria-label="Select all transactions"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={selectedTransactions.has(row.original.id)}
        onCheckedChange={(checked) =>
          onSelectTransaction(row.original.id, checked as boolean)
        }
        aria-label="Select transaction"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 50,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => (
      <DebouncedTransactionInput
        transaction={row.original}
        field="date"
        onUpdate={onUpdateTransaction}
        type="date"
      />
    ),
    size: 150,
    enableSorting: true,
  },
  {
    accessorKey: "payee",
    header: "Payee",
    cell: ({ row }) => (
      <DebouncedTransactionInput
        transaction={row.original}
        field="payee"
        onUpdate={onUpdateTransaction}
        placeholder="Payee name"
      />
    ),
    size: 200,
    enableSorting: true,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <div className="text-right">
        <DebouncedTransactionInput
          transaction={row.original}
          field="amount"
          onUpdate={onUpdateTransaction}
          type="number"
        />
      </div>
    ),
    size: 120,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.amount;
      const b = rowB.original.amount;
      return a - b;
    },
  },
  {
    accessorKey: "category_id",
    header: "Category",
    cell: ({ row }) => {
      const selectedCategory = categories.find(
        (cat) => cat.id === row.original.category_id
      );

      return (
        <Select
          value={row.original.category_id || ""}
          onValueChange={(value) => onUpdateCategory(row.original.id, value)}
        >
          <SelectTrigger className="w-full text-xs !bg-[var(--content)] !border-[var(--common-inputborder)]">
            <SelectValue placeholder="Select category">
              {selectedCategory && (
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                  <span className="truncate">
                    {selectedCategory.name} ({selectedCategory.bucket})
                  </span>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name} ({category.bucket})
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    },
    size: 200,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const catA = categories.find(
        (cat) => cat.id === rowA.original.category_id
      );
      const catB = categories.find(
        (cat) => cat.id === rowB.original.category_id
      );

      if (!catA && !catB) return 0;
      if (!catA) return 1;
      if (!catB) return -1;

      return catA.name.localeCompare(catB.name);
    },
  },
  {
    accessorKey: "isValid",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex items-center justify-center gap-2">
        {row.original.isValid ? (
          <div className="flex items-center gap-1">
            <Check size={16} className="text-[var(--common-success)]" />
            <Badge variant="secondary" className="text-xs">
              Valid
            </Badge>
          </div>
        ) : (
          <div
            className="flex items-center gap-1"
            title={row.original.errors.join(", ")}
          >
            <AlertCircle size={16} className="text-[var(--common-error)]" />
            <Badge variant="destructive" className="text-xs">
              Invalid
            </Badge>
          </div>
        )}
      </div>
    ),
    size: 100,
    enableSorting: true,
    sortingFn: (rowA, rowB) => {
      const a = rowA.original.isValid ? 1 : 0;
      const b = rowB.original.isValid ? 1 : 0;
      return b - a; // Valid transactions first
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex justify-center">
        <Button
          type="button"
          variant="ghost"
          onClick={() => onRemoveTransaction(row.original.id)}
          className="text-[var(--common-error)] hover:bg-[var(--common-error)]/10 p-1 h-auto"
          icon={<Trash2 size={14} />}
          title="Remove Transaction"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 80,
  },
];

// Export the DebouncedTransactionInput component separately if needed elsewhere
export { DebouncedTransactionInput };
