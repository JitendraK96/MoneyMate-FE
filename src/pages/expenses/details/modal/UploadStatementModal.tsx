/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useEffect, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
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
import {
  Upload,
  FileSpreadsheet,
  Save,
  AlertCircle,
  Check,
  Filter,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { format, parse, isValid as DFisValid } from "date-fns";

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

interface Payee {
  id: string;
  name: string;
  category_id?: string;
}

interface UploadStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (validTransactions: ParsedTransaction[]) => Promise<void>;
  expenseSheetName: string;
  isLinkedToIncome?: boolean;
}

// Date format options
const DATE_FORMATS = [
  {
    value: "yyyy-MM-dd",
    label: "YYYY-MM-DD (2025-01-15)",
    example: "2025-01-15",
  },
  {
    value: "MM/dd/yyyy",
    label: "MM/DD/YYYY (01/15/2025)",
    example: "01/15/2025",
  },
  {
    value: "dd/MM/yyyy",
    label: "DD/MM/YYYY (15/01/2025)",
    example: "15/01/2025",
  },
  {
    value: "MM-dd-yyyy",
    label: "MM-DD-YYYY (01-15-2025)",
    example: "01-15-2025",
  },
  {
    value: "dd-MM-yyyy",
    label: "DD-MM-YYYY (15-01-2025)",
    example: "15-01-2025",
  },
  {
    value: "yyyy/MM/dd",
    label: "YYYY/MM/DD (2025/01/15)",
    example: "2025/01/15",
  },
  { value: "auto", label: "Auto Detect", example: "Let system detect format" },
];

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

const UploadStatementModal: React.FC<UploadStatementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  expenseSheetName,
  isLinkedToIncome = false,
}) => {
  const { user } = useUser();

  // File upload states
  const [dateFormat, setDateFormat] = useState("auto");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Data states
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Preview states
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(
    new Set()
  );
  const [bulkCategoryId, setBulkCategoryId] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "valid" | "invalid">(
    "all"
  );

  // Fetch categories and payees
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;

      try {
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from("categories")
          .select("id, name, bucket, color")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("bucket, name");

        // Fetch payees with category information
        const { data: payeesData } = await supabase
          .from("payees")
          .select("id, name, category_id")
          .eq("user_id", user.id)
          .order("name");

        setCategories(categoriesData || []);
        setPayees(payeesData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load categories and payees");
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [user?.id, isOpen]);

  // Enhanced date parsing with format selection
  const parseDate = (
    rawDate: any,
    selectedFormat: string
  ): { date: string; error?: string } => {
    if (!rawDate) return { date: "", error: "Date is required" };

    try {
      let parsedDate: Date;

      if (typeof rawDate === "number") {
        // Excel date serial number
        parsedDate = new Date((rawDate - 25569) * 86400 * 1000);
      } else {
        const dateStr = String(rawDate).trim();

        if (selectedFormat === "auto") {
          // Auto-detect format
          const dateFormats = [
            "yyyy-MM-dd",
            "MM/dd/yyyy",
            "dd/MM/yyyy",
            "MM-dd-yyyy",
            "dd-MM-yyyy",
            "yyyy/MM/dd",
          ];

          parsedDate = new Date(dateStr);

          if (!DFisValid(parsedDate)) {
            for (const formatStr of dateFormats) {
              try {
                parsedDate = parse(dateStr, formatStr, new Date());
                if (DFisValid(parsedDate)) break;
              } catch {
                continue;
              }
            }
          }
        } else {
          // Use selected format
          parsedDate = parse(dateStr, selectedFormat, new Date());

          // Fallback to auto-detect if selected format fails
          if (!DFisValid(parsedDate)) {
            parsedDate = new Date(dateStr);
          }
        }
      }

      if (DFisValid(parsedDate)) {
        return { date: format(parsedDate, "yyyy-MM-dd") };
      } else {
        return { date: "", error: "Invalid date format" };
      }
    } catch {
      return { date: "", error: "Failed to parse date" };
    }
  };

  const parseAmount = (rawAmount: any): { amount: number; error?: string } => {
    if (rawAmount === null || rawAmount === undefined || rawAmount === "") {
      return { amount: 0, error: "Amount is required" };
    }

    try {
      const cleanAmount = String(rawAmount)
        .replace(/[^\d.-]/g, "")
        .trim();
      const amountNum = parseFloat(cleanAmount);

      if (isNaN(amountNum) || amountNum === 0) {
        return { amount: 0, error: "Invalid amount" };
      }

      return { amount: Math.abs(amountNum) };
    } catch {
      return { amount: 0, error: "Failed to parse amount" };
    }
  };

  const parsePayee = (rawPayee: any): { payee: string; error?: string } => {
    if (!rawPayee || String(rawPayee).trim() === "") {
      return { payee: "", error: "Payee is required" };
    }

    const payee = String(rawPayee).trim();
    if (payee.length < 2) {
      return { payee, error: "Payee name too short" };
    }

    return { payee: payee.substring(0, 200) };
  };

  // Auto-match payee to category based on existing payees
  const autoMatchPayeeCategory = (payeeName: string): string | undefined => {
    if (!payeeName || !payees.length) return undefined;

    const payeeNameLower = payeeName.toLowerCase();

    // Try exact match first
    let matchedPayee = payees.find(
      (p) => p.name.toLowerCase() === payeeNameLower
    );

    // If no exact match, try partial match (payee name contains existing payee name)
    if (!matchedPayee) {
      matchedPayee = payees.find(
        (p) =>
          payeeNameLower.includes(p.name.toLowerCase()) && p.name.length >= 3 // Minimum 3 characters to avoid false matches
      );
    }

    // If still no match, try reverse partial match (existing payee name contains new payee name)
    if (!matchedPayee) {
      matchedPayee = payees.find(
        (p) =>
          p.name.toLowerCase().includes(payeeNameLower) && payeeName.length >= 3 // Minimum 3 characters to avoid false matches
      );
    }

    return matchedPayee?.category_id;
  };

  // Process raw Excel data into transactions
  const processTransactionData = (
    data: any[][],
    selectedDateFormat: string
  ): ParsedTransaction[] => {
    if (data.length < 2) return [];

    const headers = data[0].map((h: any) => String(h).toLowerCase().trim());
    const dateIndex = headers.findIndex(
      (h: string) =>
        h.includes("date") || h.includes("day") || h.includes("time")
    );
    const payeeIndex = headers.findIndex(
      (h: string) =>
        h.includes("payee") ||
        h.includes("merchant") ||
        h.includes("description") ||
        h.includes("vendor")
    );
    const amountIndex = headers.findIndex(
      (h: string) =>
        h.includes("amount") ||
        h.includes("value") ||
        h.includes("price") ||
        h.includes("total")
    );

    if (dateIndex === -1 || payeeIndex === -1 || amountIndex === -1) {
      toast.error(
        "Required columns (Date, Payee, Amount) not found in the file"
      );
      return [];
    }

    const processedTransactions: ParsedTransaction[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0) continue;

      const transaction: ParsedTransaction = {
        id: `temp_${Date.now()}_${i}`,
        date: "",
        payee: "",
        amount: 0,
        isValid: true,
        errors: [],
      };

      // Parse date with selected format
      const dateResult = parseDate(row[dateIndex], selectedDateFormat);
      transaction.date = dateResult.date;
      if (dateResult.error) {
        transaction.errors.push(dateResult.error);
        transaction.isValid = false;
      }

      // Parse payee
      const payeeResult = parsePayee(row[payeeIndex]);
      transaction.payee = payeeResult.payee;
      if (payeeResult.error) {
        transaction.errors.push(payeeResult.error);
        transaction.isValid = false;
      }

      // Auto-match category based on payee
      if (transaction.payee && !payeeResult.error) {
        const matchedCategoryId = autoMatchPayeeCategory(transaction.payee);
        if (matchedCategoryId) {
          transaction.category_id = matchedCategoryId;
        }
      }

      // Parse amount
      const amountResult = parseAmount(row[amountIndex]);
      transaction.amount = amountResult.amount;
      if (amountResult.error) {
        transaction.errors.push(amountResult.error);
        transaction.isValid = false;
      }

      processedTransactions.push(transaction);
    }

    return processedTransactions.filter(
      (t) => t.isValid || t.errors.length > 0
    );
  };

  // File processing function
  const processExcelFile = useCallback(
    (file: File) => {
      if (!dateFormat) {
        toast.error("Please select a date format before uploading the file");
        return;
      }

      setIsProcessing(true);
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          const processedTransactions = processTransactionData(
            jsonData as any[][],
            dateFormat
          );
          setTransactions(processedTransactions);

          if (processedTransactions.length > 0) {
            setShowPreview(true);
            toast.success(
              `Successfully parsed ${processedTransactions.length} transactions`
            );
          } else {
            toast.error("No valid transactions found in the file");
          }
        } catch (error) {
          console.error("Error processing file:", error);
          toast.error("Failed to process Excel file. Please check the format.");
        } finally {
          setIsProcessing(false);
        }
      };

      reader.readAsArrayBuffer(file);
    },
    [dateFormat]
  );

  // Drag and drop handlers
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        setUploadedFile(file);
        processExcelFile(file);
      }
    },
    [processExcelFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  // Transaction management functions
  const updateTransactionCategory = (
    transactionId: string,
    categoryId: string
  ) => {
    const updatedTransactions = transactions.map((t) =>
      t.id === transactionId ? { ...t, category_id: categoryId } : t
    );
    setTransactions(updatedTransactions);
  };

  const removeTransaction = (transactionId: string) => {
    const updatedTransactions = transactions.filter(
      (t) => t.id !== transactionId
    );
    setTransactions(updatedTransactions);
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
    setTransactions(updatedTransactions);
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

  // Clear uploaded file
  const clearUploadedFile = () => {
    setUploadedFile(null);
    setTransactions([]);
    setShowPreview(false);
    setSelectedTransactions(new Set());
    setBulkCategoryId("");
    setFilterStatus("all");
  };

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
      handleClose();
    } catch (error) {
      console.error("Error saving transactions:", error);
      toast.error("Failed to save transactions. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    clearUploadedFile();
    setDateFormat("auto");
    onClose();
  };

  const handleBackToUpload = () => {
    setShowPreview(false);
    setSelectedTransactions(new Set());
    setBulkCategoryId("");
    setFilterStatus("all");
  };

  const validCount = transactions.filter((t) => t.isValid).length;
  const invalidCount = transactions.filter((t) => !t.isValid).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!bg-[var(--content)] !border-[var(--common-inputborder)] min-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-[var(--content-textprimary)]">
            {showPreview ? "Transaction Preview" : "Upload Statement"} -{" "}
            {expenseSheetName}
          </DialogTitle>
          <DialogDescription className="text-[var(--content-textsecondary)]">
            {showPreview ? (
              <>
                Review and edit {transactions.length} imported transactions
                before saving to your expense sheet.
                {isLinkedToIncome &&
                  " This sheet is linked to an income source."}
              </>
            ) : (
              "Upload your bank statement or expense file to automatically import transactions."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto flex-1">
          {!showPreview ? (
            // Upload Section
            <>
              {/* Date Format Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--content-textprimary)]">
                  Excel Date Format *
                </label>
                <Select
                  value={dateFormat}
                  onValueChange={(value) => {
                    setDateFormat(value);
                    if (uploadedFile) {
                      clearUploadedFile();
                    }
                  }}
                >
                  <SelectTrigger className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                    <SelectValue placeholder="Select date format used in your Excel" />
                  </SelectTrigger>
                  <SelectContent className="!bg-[var(--content)] !border-[var(--common-inputborder)]">
                    {DATE_FORMATS.map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div className="flex flex-col">
                          <span>{format.label}</span>
                          <span className="text-xs text-[var(--content-textsecondary)]">
                            {format.example}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-4">
                {!dateFormat && (
                  <div className="p-3 bg-[var(--common-warning)]/10 rounded-lg">
                    <p className="text-sm text-[var(--content-textprimary)]">
                      ⚠️ Please select a date format above before uploading your
                      file
                    </p>
                  </div>
                )}

                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-[var(--common-brand)] bg-[var(--common-brand)]/10"
                      : "border-[var(--common-inputborder)] hover:border-[var(--common-brand)]"
                  } ${!dateFormat ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <input {...getInputProps()} />
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--common-brand)]"></div>
                      <p className="text-[var(--content-textsecondary)]">
                        Processing file...
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <Upload
                        size={48}
                        className="text-[var(--content-textsecondary)]"
                      />
                      <div>
                        <p className="text-lg font-medium text-[var(--content-textprimary)]">
                          {isDragActive
                            ? "Drop the file here"
                            : "Drag & drop your Excel file here"}
                        </p>
                        <p className="text-sm text-[var(--content-textsecondary)]">
                          or click to browse (Excel, CSV files)
                        </p>
                      </div>
                      <div className="text-xs text-[var(--content-textsecondary)] space-y-1">
                        <p>Expected columns: Date, Payee/Description, Amount</p>
                        <p>Supported formats: .xlsx, .xls, .csv</p>
                        <p>
                          💡 Categories will be auto-assigned based on existing
                          payee matches
                        </p>
                        {dateFormat && dateFormat !== "auto" && (
                          <p className="text-[var(--common-brand)]">
                            Using date format:{" "}
                            {
                              DATE_FORMATS.find((f) => f.value === dateFormat)
                                ?.label
                            }
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {uploadedFile && (
                  <div className="flex items-center gap-2 p-3 bg-[var(--common-success)]/10 rounded-lg">
                    <FileSpreadsheet
                      size={16}
                      className="text-[var(--common-success)]"
                    />
                    <span className="text-sm text-[var(--content-textprimary)]">
                      {uploadedFile.name}
                    </span>
                    <Badge variant="secondary" className="ml-auto">
                      {uploadedFile.size > 1024 * 1024
                        ? `${(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB`
                        : `${(uploadedFile.size / 1024).toFixed(1)} KB`}
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={clearUploadedFile}
                      title="Clear File"
                      className="text-[var(--common-error)] hover:bg-[var(--common-error)]/10"
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            // Preview Section
            <>
              {/* Back Button and Stats */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleBackToUpload}
                    icon={<ArrowLeft />}
                    title="Back to Upload"
                  />
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{validCount} valid</Badge>
                    {invalidCount > 0 && (
                      <Badge variant="destructive">
                        {invalidCount} invalid
                      </Badge>
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
                  <Select
                    value={bulkCategoryId}
                    onValueChange={setBulkCategoryId}
                  >
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
                            !transaction.isValid
                              ? "bg-[var(--common-error)]/5"
                              : ""
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
                                  <SelectItem
                                    key={category.id}
                                    value={category.id}
                                  >
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

              {/* Auto-Match Info */}
              {(() => {
                const autoMatchedCount = transactions.filter(
                  (t) =>
                    t.category_id &&
                    payees.some(
                      (p) =>
                        p.category_id === t.category_id &&
                        (t.payee.toLowerCase().includes(p.name.toLowerCase()) ||
                          p.name.toLowerCase().includes(t.payee.toLowerCase()))
                    )
                ).length;
                return autoMatchedCount > 0 ? (
                  <div className="p-4 bg-[var(--common-success)]/10 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Check
                        size={20}
                        className="text-[var(--common-success)] mt-0.5"
                      />
                      <div>
                        <h4 className="font-medium text-[var(--content-textprimary)] mb-2">
                          {autoMatchedCount} transactions automatically
                          categorized
                        </h4>
                        <p className="text-sm text-[var(--content-textsecondary)]">
                          Categories were assigned based on matching payee names
                          in your existing payees list. You can review and
                          change these assignments before saving.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}

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
                        These transactions won't be saved. Please fix the errors
                        or remove them.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-[var(--content-textsecondary)]">
            {showPreview
              ? `${validCount} of ${transactions.length} transactions ready to save`
              : "Select date format and upload your file to get started"}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              title="Cancel"
              className="w-fit"
            />
            {showPreview && (
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || validCount === 0}
                icon={isSaving ? undefined : <Save />}
                title={isSaving ? "Saving..." : "Save Transactions"}
                className="w-fit"
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadStatementModal;
