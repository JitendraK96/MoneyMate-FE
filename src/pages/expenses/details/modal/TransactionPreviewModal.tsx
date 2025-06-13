/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/inputs";
import { Input } from "@/components/inputs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Save, AlertCircle, Check, Filter, Trash2 } from "lucide-react";
import { isValid as DFisValid } from "date-fns";

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

interface TransactionPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: ParsedTransaction[];
  onTransactionsChange: (transactions: ParsedTransaction[]) => void;
  onSave: (validTransactions: ParsedTransaction[]) => Promise<void>;
  expenseSheetName: string;
  isLinkedToIncome: boolean;
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

const TransactionPreviewModal: React.FC<TransactionPreviewModalProps> = ({
  isOpen,
  onClose,
  transactions,
  onTransactionsChange,
  onSave,
  expenseSheetName,
  isLinkedToIncome,
}) => {
  const { user } = useUser();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set()
  );
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "invalid">(
    "all"
  );

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!user?.id) return;

      try {
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("id, name, bucket, color")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("bucket, name");

        setCategories(categoriesData || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Failed to load categories");
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [user?.id, isOpen]);

  // Transaction management functions
  const updateTransactionCategory = (
    transactionId: string,
    categoryId: string
  ) => {
    const updatedTransactions = transactions.map((t) =>
      t.id === transactionId ? { ...t, category_id: categoryId } : t
    );
    onTransactionsChange(updatedTransactions);
  };

  const removeTransaction = (transactionId: string) => {
    const updatedTransactions = transactions.filter(
      (t) => t.id !== transactionId
    );
    onTransactionsChange(updatedTransactions);
    setSelectedTransactions((prev) => {
      const newSet = new Set(prev);
      newSet.delete(transactionId);
      return newSet;
    });
  };

  const updateTransaction = (
    transactionId: string,
    field: keyof ParsedTransaction,
    value: any
  ) => {
    const updatedTransactions = transactions.map((t) => {
      if (t.id === transactionId) {
        const updated = { ...t, [field]: value };

        // Re-validate transaction
        const errors: string[] = [];
        let isValidTransaction = true;

        if (field === "date" && (!value || !DFisValid(new Date(value)))) {
          errors.push("Invalid date");
          isValidTransaction = false;
        }
        if (field === "payee" && (!value || value.trim().length < 2)) {
          errors.push("Payee name too short");
          isValidTransaction = false;
        }
        if (field === "amount" && (!value || value <= 0)) {
          errors.push("Invalid amount");
          isValidTransaction = false;
        }

        return { ...updated, errors, isValid: isValidTransaction };
      }
      return t;
    });
    onTransactionsChange(updatedTransactions);
  };

  // Bulk operations
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTransactions(new Set(filteredTransactions.map((t) => t.id)));
    } else {
      setSelectedTransactions(new Set());
    }
  };

  const handleSelectTransaction = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedTransactions);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleBulkCategoryUpdate = () => {
    if (bulkCategoryId && selectedTransactions.size > 0) {
      Array.from(selectedTransactions).forEach((id) => {
        updateTransactionCategory(id, bulkCategoryId);
      });
      setSelectedTransactions(new Set());
      setBulkCategoryId("");
      toast.success(
        `Category assigned to ${selectedTransactions.size} transactions`
      );
    }
  };

  // Filter transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (filterStatus === "valid") return transaction.isValid;
    if (filterStatus === "invalid") return !transaction.isValid;
    return true;
  });

  // Save functionality
  const handleSave = async () => {
    const validTransactions = transactions.filter((t) => t.isValid);
    if (validTransactions.length === 0) {
      toast.error("No valid transactions to save");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(validTransactions);
      onClose();
    } catch (error) {
      console.error("Error saving transactions:", error);
      toast.error("Failed to save transactions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const validCount = transactions.filter((t) => t.isValid).length;
  const invalidCount = transactions.filter((t) => !t.isValid).length;

  const handleClose = () => {
    setSelectedTransactions(new Set());
    setBulkCategoryId("");
    setFilterStatus("all");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!bg-[var(--content)] !border-[var(--common-inputborder)] min-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-[var(--content-textprimary)]">
            Transaction Preview - {expenseSheetName}
          </DialogTitle>
          <DialogDescription className="text-[var(--content-textsecondary)]">
            Review and edit {transactions.length} imported transactions before
            saving to your expense sheet.
            {isLinkedToIncome && " This sheet is linked to an income source."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {/* Stats and Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{validCount} valid</Badge>
                {invalidCount > 0 && (
                  <Badge variant="destructive">{invalidCount} invalid</Badge>
                )}
              </div>
              <Select
                value={filterStatus}
                onValueChange={(value: any) => setFilterStatus(value)}
              >
                <SelectTrigger className="w-32 !bg-[var(--content)] !border-[var(--common-inputborder)]">
                  <Filter size={14} />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="valid">Valid only</SelectItem>
                  <SelectItem value="invalid">Invalid only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedTransactions.size > 0 && (
            <div className="flex items-center gap-4 p-3 bg-[var(--common-brand)]/10 rounded-lg">
              <span className="text-sm font-medium">
                {selectedTransactions.size} selected
              </span>
              <Select value={bulkCategoryId} onValueChange={setBulkCategoryId}>
                <SelectTrigger className="w-48 !bg-[var(--content)] !border-[var(--common-inputborder)]">
                  <SelectValue placeholder="Assign category" />
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
              <Button
                type="button"
                onClick={handleBulkCategoryUpdate}
                disabled={!bulkCategoryId}
                title="Apply to Selected"
              />
            </div>
          )}

          {/* Transaction Table */}
          <div className="border rounded-lg overflow-hidden !bg-[var(--content)] !border-[var(--common-inputborder)]">
            <div className="max-h-96 overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-[var(--content-background)] sticky top-0 border-b">
                  <tr>
                    <th className="p-3 text-left">
                      <Checkbox
                        checked={
                          selectedTransactions.size ===
                            filteredTransactions.length &&
                          filteredTransactions.length > 0
                        }
                        onCheckedChange={handleSelectAll}
                      />
                    </th>
                    <th className="p-3 text-left">Date</th>
                    <th className="p-3 text-left">Payee</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-left">Category</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr
                      key={transaction.id}
                      className={`border-b hover:bg-[var(--content-background-hover)] ${
                        !transaction.isValid ? "bg-[var(--common-error)]/5" : ""
                      } ${
                        selectedTransactions.has(transaction.id)
                          ? "bg-[var(--common-brand)]/5"
                          : ""
                      }`}
                    >
                      <td className="p-3">
                        <Checkbox
                          checked={selectedTransactions.has(transaction.id)}
                          onCheckedChange={(checked) =>
                            handleSelectTransaction(
                              transaction.id,
                              checked as boolean
                            )
                          }
                        />
                      </td>
                      <td className="p-3">
                        <DebouncedTransactionInput
                          transaction={transaction}
                          field="date"
                          onUpdate={updateTransaction}
                          type="date"
                        />
                      </td>
                      <td className="p-3">
                        <DebouncedTransactionInput
                          transaction={transaction}
                          field="payee"
                          onUpdate={updateTransaction}
                          placeholder="Payee name"
                        />
                      </td>
                      <td className="p-3 text-right">
                        <DebouncedTransactionInput
                          transaction={transaction}
                          field="amount"
                          onUpdate={updateTransaction}
                          type="number"
                        />
                      </td>
                      <td className="p-3">
                        <Select
                          value={transaction.category_id || ""}
                          onValueChange={(value) =>
                            updateTransactionCategory(transaction.id, value)
                          }
                        >
                          <SelectTrigger className="w-full text-xs !bg-[var(--content)] !border-[var(--common-inputborder)]">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                      backgroundColor: category.color,
                                    }}
                                  />
                                  {category.name} ({category.bucket})
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {transaction.isValid ? (
                            <Check
                              size={16}
                              className="text-[var(--common-success)]"
                            />
                          ) : (
                            <AlertCircle
                              size={16}
                              className="text-[var(--common-error)]"
                            />
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => removeTransaction(transaction.id)}
                          className="text-[var(--common-error)] hover:bg-[var(--common-error)]/10"
                          icon={<Trash2 size={14} />}
                          title="Remove Transaction"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error Summary */}
          {invalidCount > 0 && (
            <div className="p-4 bg-[var(--common-warning)]/10 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="text-[var(--common-warning)] mt-0.5"
                />
                <div>
                  <h4 className="font-medium text-[var(--content-textprimary)] mb-2">
                    {invalidCount} transactions have errors
                  </h4>
                  <p className="text-sm text-[var(--content-textsecondary)]">
                    These transactions won't be saved. Please fix the errors or
                    remove them.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-[var(--content-textsecondary)]">
            {validCount} of {transactions.length} transactions ready to save
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              title="Cancel"
              className="w-fit"
            />
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || validCount === 0}
              icon={isSaving ? undefined : <Save />}
              title={isSaving ? "Saving..." : "Save Expense Sheet"}
              className="w-fit"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionPreviewModal;
