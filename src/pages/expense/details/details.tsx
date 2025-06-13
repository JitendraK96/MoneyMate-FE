/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import Page from "@/components/page";
import Card from "@/components/card";
import { Button } from "@/components/inputs";
import DataTable from "@/components/table";
import {
  Upload,
  FileText,
  X,
  AlertCircle,
  CheckCircle,
  Trash2,
  Plus,
  Calendar,
  DollarSign,
  User,
  Settings,
} from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import * as XLSX from "xlsx";

interface Category {
  id: string;
  name: string;
  bucket: "needs" | "wants" | "savings";
  color?: string;
  is_active: boolean;
}

interface PayeeWithCategory {
  id: string;
  name: string;
  category_id: string | null;
  category_name?: string;
  category_bucket?: string;
  category_color?: string;
}

interface ParsedTransaction {
  id: string;
  date: string;
  payee: string;
  amount: number;
  category_id?: string;
  category_name?: string;
  category_color?: string;
  bucket?: string;
  isValid: boolean;
  errors: string[];
  originalRowIndex: number;
  isAutoMatched?: boolean;
}

interface FileUploadStats {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  totalAmount: number;
  autoMatchedRows: number;
}

interface DateFormat {
  value: string;
  label: string;
  example: string;
  regex: RegExp;
  parser: (dateStr: string) => Date | null;
}

const ExpenseDetailsPage: React.FC = () => {
  const { user } = useUser();
  const { id } = useParams<{ id?: string }>();
  const [isEditMode, setIsEditMode] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [payees, setPayees] = useState<PayeeWithCategory[]>([]);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingExistingTransactions, setIsLoadingExistingTransactions] =
    useState(false);
  const [fileStats, setFileStats] = useState<FileUploadStats | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedDateFormat, setSelectedDateFormat] = useState<string>("auto");
  const [showDateFormatPicker, setShowDateFormatPicker] = useState(false);

  console.log(id, "id");
  // Define available date formats
  const dateFormats: DateFormat[] = [
    {
      value: "auto",
      label: "Auto-detect",
      example: "Let system detect format",
      regex: /.*/,
      parser: () => null, // Will be handled by existing logic
    },
    {
      value: "dd/mm/yyyy",
      label: "DD/MM/YYYY",
      example: "31/12/2024",
      regex: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      parser: (dateStr: string) => {
        const [day, month, year] = dateStr.split("/").map(Number);
        return new Date(year, month - 1, day);
      },
    },
    {
      value: "mm/dd/yyyy",
      label: "MM/DD/YYYY",
      example: "12/31/2024",
      regex: /^\d{1,2}\/\d{1,2}\/\d{4}$/,
      parser: (dateStr: string) => {
        const [month, day, year] = dateStr.split("/").map(Number);
        return new Date(year, month - 1, day);
      },
    },
    {
      value: "yyyy-mm-dd",
      label: "YYYY-MM-DD",
      example: "2024-12-31",
      regex: /^\d{4}-\d{1,2}-\d{1,2}$/,
      parser: (dateStr: string) => {
        const [year, month, day] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      },
    },
    {
      value: "dd-mm-yyyy",
      label: "DD-MM-YYYY",
      example: "31-12-2024",
      regex: /^\d{1,2}-\d{1,2}-\d{4}$/,
      parser: (dateStr: string) => {
        const [day, month, year] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      },
    },
    {
      value: "mm-dd-yyyy",
      label: "MM-DD-YYYY",
      example: "12-31-2024",
      regex: /^\d{1,2}-\d{1,2}-\d{4}$/,
      parser: (dateStr: string) => {
        const [month, day, year] = dateStr.split("-").map(Number);
        return new Date(year, month - 1, day);
      },
    },
    {
      value: "dd.mm.yyyy",
      label: "DD.MM.YYYY",
      example: "31.12.2024",
      regex: /^\d{1,2}\.\d{1,2}\.\d{4}$/,
      parser: (dateStr: string) => {
        const [day, month, year] = dateStr.split(".").map(Number);
        return new Date(year, month - 1, day);
      },
    },
    {
      value: "mm.dd.yyyy",
      label: "MM.DD.YYYY",
      example: "12.31.2024",
      regex: /^\d{1,2}\.\d{1,2}\.\d{4}$/,
      parser: (dateStr: string) => {
        const [month, day, year] = dateStr.split(".").map(Number);
        return new Date(year, month - 1, day);
      },
    },
  ];

  // Fetch categories and payees on mount
  useEffect(() => {
    const fetchCategoriesAndPayees = async () => {
      if (!user?.id) return;

      setIsLoadingCategories(true);
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("bucket", { ascending: true })
          .order("name", { ascending: true });

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch payees with their category information
        const { data: payeesData, error: payeesError } = await supabase
          .from("payees_with_category")
          .select("*")
          .eq("user_id", user.id);

        if (payeesError) throw payeesError;
        setPayees(payeesData || []);
      } catch (error) {
        console.error("Error fetching categories and payees:", error);
        toast.error("Failed to load categories and payees");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategoriesAndPayees();
  }, [user?.id]);

  // Load existing transactions if id is provided
  useEffect(() => {
    const loadExpenseTransactions = async () => {
      if (!id || !user?.id) return;

      setIsLoadingExistingTransactions(true);
      try {
        setIsEditMode(true);

        // Fetch existing transactions for this expense group
        const { data: existingExpenses, error } = await supabase
          .from("expenses_with_category")
          .select("*")
          .eq("user_id", user.id)
          .like("notes", `%Batch: ${id}%`)
          .order("date", { ascending: false });

        if (error) throw error;

        console.log(existingExpenses, "existingExpenses");

        if (existingExpenses && existingExpenses.length > 0) {
          // Transform existing expenses to match ParsedTransaction format
          const existingTransactions: ParsedTransaction[] =
            existingExpenses.map((expense, index) => ({
              id: expense.id, // Use actual database ID instead of temp ID
              date: expense.date,
              payee: expense.payee,
              amount: parseFloat(expense.amount.toString()),
              category_id: expense.category_id,
              category_name: expense.category_name,
              category_color: expense.category_color,
              bucket: expense.category_bucket,
              isValid: true,
              errors: [],
              originalRowIndex: index,
              isAutoMatched: false, // Existing transactions are already categorized
            }));

          setTransactions(existingTransactions);

          // Calculate stats for existing transactions
          const totalAmount = existingTransactions.reduce(
            (sum, t) => sum + t.amount,
            0
          );
          setFileStats({
            totalRows: existingTransactions.length,
            validRows: existingTransactions.length,
            invalidRows: 0,
            totalAmount,
            autoMatchedRows: 0,
          });

          toast.success(
            `Loaded ${existingTransactions.length} existing transaction${
              existingTransactions.length === 1 ? "" : "s"
            } for expense group ${id}`
          );
        } else {
          toast.info(`Edit mode: Adding transactions to expense group ${id}`);
        }
      } catch (error) {
        console.error("Error loading expense transactions:", error);
        toast.error("Failed to load existing transactions");
      } finally {
        setIsLoadingExistingTransactions(false);
      }
    };

    loadExpenseTransactions();
  }, [id, user?.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Function to parse date based on selected format
  const parseDate = (rawDate: any, format: string): string => {
    if (!rawDate) return "";

    try {
      let dateObj: Date;

      // Handle Excel date serial numbers first (these are always numeric)
      if (typeof rawDate === "number") {
        if (rawDate > 59) {
          dateObj = new Date((rawDate - 25569) * 86400 * 1000);
        } else {
          dateObj = new Date((rawDate - 25568) * 86400 * 1000);
        }
      } else {
        const dateStr = rawDate.toString().trim();

        if (format === "auto") {
          // Try to parse as regular date string (existing logic)
          dateObj = new Date(dateStr);
        } else {
          // Use the selected format parser
          const selectedFormat = dateFormats.find((f) => f.value === format);
          if (selectedFormat && selectedFormat.parser) {
            const parsedDate = selectedFormat.parser(dateStr);
            if (parsedDate) {
              dateObj = parsedDate;
            } else {
              throw new Error("Could not parse date with selected format");
            }
          } else {
            dateObj = new Date(dateStr);
          }
        }
      }

      // Validate the parsed date
      if (!isNaN(dateObj.getTime())) {
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const day = String(dateObj.getDate()).padStart(2, "0");
        const processedDate = `${year}-${month}-${day}`;

        // Double-check the date is reasonable
        const testDate = new Date(processedDate);
        if (
          testDate.getFullYear() < 1900 ||
          testDate.getFullYear() > new Date().getFullYear()
        ) {
          return rawDate.toString();
        }

        return processedDate;
      } else {
        return rawDate.toString();
      }
    } catch (error) {
      console.error("Date parsing error:", error);
      return rawDate?.toString() || "";
    }
  };

  // Function to match payee names with existing payees
  const matchPayeeToCategory = (
    payeeName: string
  ): PayeeWithCategory | null => {
    if (!payeeName || payees.length === 0) return null;

    const normalizedPayeeName = payeeName.toLowerCase().trim();

    // First try exact match (case-insensitive)
    let match = payees.find(
      (payee) => payee.name.toLowerCase().trim() === normalizedPayeeName
    );

    if (match) return match;

    // Try partial match - check if payee name contains any of the existing payee names
    match = payees.find((payee) => {
      const existingName = payee.name.toLowerCase().trim();
      return (
        normalizedPayeeName.includes(existingName) ||
        existingName.includes(normalizedPayeeName)
      );
    });

    if (match) return match;

    // Try fuzzy matching for common variations
    match = payees.find((payee) => {
      const existingName = payee.name.toLowerCase().trim();

      // Remove common suffixes/prefixes that might differ
      const cleanExisting = existingName
        .replace(/\b(ltd|limited|inc|corp|co|pvt)\b/g, "")
        .replace(/[^\w\s]/g, "")
        .trim();

      const cleanPayee = normalizedPayeeName
        .replace(/\b(ltd|limited|inc|corp|co|pvt)\b/g, "")
        .replace(/[^\w\s]/g, "")
        .trim();

      return (
        cleanExisting &&
        cleanPayee &&
        (cleanExisting.includes(cleanPayee) ||
          cleanPayee.includes(cleanExisting))
      );
    });

    return match || null;
  };

  const validateTransaction = (
    row: any,
    rowIndex: number
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    console.log(rowIndex);

    // Validate date
    if (!row.date) {
      errors.push("Date is required");
    } else {
      const date = new Date(row.date);
      if (isNaN(date.getTime())) {
        errors.push("Invalid date format");
      }
    }

    // Validate payee
    if (
      !row.payee ||
      typeof row.payee !== "string" ||
      row.payee.trim().length < 2
    ) {
      errors.push("Payee must be at least 2 characters");
    }

    // Validate amount
    if (
      !row.amount ||
      isNaN(parseFloat(row.amount)) ||
      parseFloat(row.amount) <= 0
    ) {
      errors.push("Amount must be a positive number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const parseExcelFile = async (file: File): Promise<ParsedTransaction[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array", cellDates: true });

          // Get the first worksheet
          const worksheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[worksheetName];

          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            dateNF: "yyyy-mm-dd",
          });

          if (jsonData.length < 2) {
            throw new Error(
              "File must contain at least a header row and one data row"
            );
          }

          // Get headers from first row
          const headers = (jsonData[0] as string[]).map((h) =>
            h?.toString().toLowerCase().trim()
          );

          // Find column indices
          const dateIndex = headers.findIndex(
            (h) =>
              h.includes("date") ||
              h.includes("transaction date") ||
              h.includes("txn date")
          );
          const payeeIndex = headers.findIndex(
            (h) =>
              h.includes("payee") ||
              h.includes("merchant") ||
              h.includes("description") ||
              h.includes("vendor")
          );
          const amountIndex = headers.findIndex(
            (h) =>
              h.includes("amount") ||
              h.includes("debit") ||
              h.includes("expense") ||
              h.includes("spent")
          );

          if (dateIndex === -1 || payeeIndex === -1 || amountIndex === -1) {
            throw new Error(
              "Required columns not found. Please ensure your file has Date, Payee, and Amount columns."
            );
          }

          // Parse data rows
          const parsedTransactions: ParsedTransaction[] = [];

          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];

            if (!row || row.length === 0 || row.every((cell) => !cell)) {
              continue; // Skip empty rows
            }

            const rawDate = row[dateIndex];
            const rawPayee = row[payeeIndex];
            const rawAmount = row[amountIndex];

            // Process date using selected format
            const processedDate = parseDate(rawDate, selectedDateFormat);

            // Process payee
            const processedPayee = rawPayee?.toString().trim() || "";

            // Process amount
            let processedAmount = 0;
            if (rawAmount) {
              const amountStr = rawAmount.toString().replace(/[₹,\s]/g, "");
              processedAmount = parseFloat(amountStr) || 0;
              // Make amount positive if it's negative (assuming expenses)
              processedAmount = Math.abs(processedAmount);
            }

            const transactionData = {
              date: processedDate,
              payee: processedPayee,
              amount: processedAmount,
            };

            const validation = validateTransaction(transactionData, i);

            // Try to match payee with existing payees and categories
            const matchedPayee = matchPayeeToCategory(processedPayee);

            const transaction: ParsedTransaction = {
              id: `temp_${i}_${Date.now()}`, // Keep temp_ prefix for new transactions
              date: processedDate,
              payee: processedPayee,
              amount: processedAmount,
              isValid: validation.isValid,
              errors: validation.errors,
              originalRowIndex: i,
              // Auto-populate category if payee is matched
              ...(matchedPayee &&
                matchedPayee.category_id && {
                  category_id: matchedPayee.category_id,
                  category_name: matchedPayee.category_name,
                  category_color: matchedPayee.category_color,
                  bucket: matchedPayee.category_bucket,
                  isAutoMatched: true,
                }),
            };

            parsedTransactions.push(transaction);
          }

          resolve(parsedTransactions);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (
      !validTypes.includes(file.type) &&
      !file.name.match(/\.(xlsx|xls|csv)$/i)
    ) {
      toast.error("Please upload an Excel file (.xlsx, .xls) or CSV file");
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadedFileName(file.name);

    try {
      const parsedTransactions = await parseExcelFile(file);

      if (parsedTransactions.length === 0) {
        throw new Error("No valid transactions found in the file");
      }

      // In edit mode, append new transactions to existing ones
      // In new mode, replace all transactions
      setTransactions((prev) => {
        const updatedTransactions = isEditMode
          ? [...prev, ...parsedTransactions]
          : parsedTransactions;

        // Calculate stats for all transactions
        const validTransactions = updatedTransactions.filter((t) => t.isValid);
        const autoMatchedTransactions = updatedTransactions.filter(
          (t) => t.isAutoMatched
        );
        const totalAmount = validTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );

        setFileStats({
          totalRows: updatedTransactions.length,
          validRows: validTransactions.length,
          invalidRows: updatedTransactions.length - validTransactions.length,
          totalAmount,
          autoMatchedRows: autoMatchedTransactions.length,
        });

        return updatedTransactions;
      });

      const autoMatchedCount = parsedTransactions.filter(
        (t) => t.isAutoMatched
      ).length;

      toast.success(
        `Successfully parsed ${parsedTransactions.length} transactions from ${
          file.name
        }. ${autoMatchedCount} transactions auto-matched to categories.${
          isEditMode
            ? ` Total: ${
                transactions.length + parsedTransactions.length
              } transactions.`
            : ""
        }`
      );
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to parse file"
      );
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = "";
    }
  };

  const handleCategoryChange = useCallback(
    (transactionId: string, categoryId: string) => {
      setTransactions((prev) =>
        prev.map((transaction) => {
          if (transaction.id === transactionId) {
            const category = categories.find((c) => c.id === categoryId);
            return {
              ...transaction,
              category_id: categoryId,
              category_name: category?.name,
              category_color: category?.color,
              bucket: category?.bucket,
              isAutoMatched: false, // Clear auto-match flag when manually changed
            };
          }
          return transaction;
        })
      );
    },
    [categories]
  );

  const handleRemoveTransaction = useCallback(
    (transactionId: string) => {
      // Don't allow removal of existing transactions in edit mode
      if (isEditMode && !transactionId.startsWith("temp_")) {
        toast.error(
          "Cannot remove existing transactions. Only new transactions can be removed."
        );
        return;
      }

      setTransactions((prev) => {
        const filtered = prev.filter((t) => t.id !== transactionId);

        // Recalculate stats
        if (filtered.length > 0) {
          const validTransactions = filtered.filter((t) => t.isValid);
          const autoMatchedTransactions = filtered.filter(
            (t) => t.isAutoMatched
          );
          const totalAmount = validTransactions.reduce(
            (sum, t) => sum + t.amount,
            0
          );

          setFileStats({
            totalRows: filtered.length,
            validRows: validTransactions.length,
            invalidRows: filtered.length - validTransactions.length,
            totalAmount,
            autoMatchedRows: autoMatchedTransactions.length,
          });
        } else {
          setFileStats(null);
        }

        return filtered;
      });
      toast.success("Transaction removed");
    },
    [isEditMode]
  );

  const handleClearTransactions = () => {
    if (isEditMode) {
      // In edit mode, only clear new (temp) transactions
      const existingTransactions = transactions.filter(
        (t) => !t.id.startsWith("temp_")
      );
      setTransactions(existingTransactions);

      if (existingTransactions.length > 0) {
        const totalAmount = existingTransactions.reduce(
          (sum, t) => sum + t.amount,
          0
        );
        setFileStats({
          totalRows: existingTransactions.length,
          validRows: existingTransactions.length,
          invalidRows: 0,
          totalAmount,
          autoMatchedRows: 0,
        });
      } else {
        setFileStats(null);
      }

      toast.success("New transactions cleared");
    } else {
      // In new mode, clear everything
      setTransactions([]);
      setFileStats(null);
      toast.success("All transactions cleared");
    }
    setUploadedFileName("");
  };

  const handleSaveExpenses = async () => {
    const validTransactions = transactions.filter(
      (t) => t.isValid && t.category_id
    );

    if (validTransactions.length === 0) {
      toast.error("No valid transactions with categories to save");
      return;
    }

    setIsSaving(true);
    try {
      // Prepare transactions for insertion - only save new temporary transactions
      const newTransactions = validTransactions
        .filter((t) => t.id.startsWith("temp_")) // Only save new temporary transactions
        .map((t) => ({
          user_id: user!.id,
          date: t.date,
          payee: t.payee,
          amount: t.amount,
          category_id: t.category_id,
          // You can add a notes field here to track the session/group if needed
          notes: id ? `Batch: ${id}` : null,
        }));

      if (newTransactions.length > 0) {
        const { error: transactionError } = await supabase
          .from("expenses")
          .insert(newTransactions);

        if (transactionError) throw transactionError;
      }

      toast.success(
        `Successfully ${isEditMode ? "added" : "saved"} ${
          newTransactions.length
        } transaction${newTransactions.length === 1 ? "" : "s"}${
          isEditMode ? " to the expense group" : ""
        }`
      );

      // Clear only the new transactions, keep existing ones if in edit mode
      if (isEditMode) {
        setTransactions((prev) =>
          prev.filter((t) => !t.id.startsWith("temp_"))
        );
        // Recalculate stats for remaining transactions
        const remainingTransactions = transactions.filter(
          (t) => !t.id.startsWith("temp_")
        );
        if (remainingTransactions.length > 0) {
          const totalAmount = remainingTransactions.reduce(
            (sum, t) => sum + t.amount,
            0
          );
          setFileStats({
            totalRows: remainingTransactions.length,
            validRows: remainingTransactions.length,
            invalidRows: 0,
            totalAmount,
            autoMatchedRows: 0,
          });
        } else {
          setFileStats(null);
        }
      } else {
        // Clear everything for new expense
        setTransactions([]);
        setFileStats(null);
      }

      setUploadedFileName("");
    } catch (error) {
      console.error("Error saving expenses:", error);
      toast.error("Failed to save expenses");
    } finally {
      setIsSaving(false);
    }
  };

  const getCategoryOptions = () => {
    const grouped = categories.reduce((acc, category) => {
      if (!acc[category.bucket]) {
        acc[category.bucket] = [];
      }
      acc[category.bucket].push(category);
      return acc;
    }, {} as Record<string, Category[]>);

    return grouped;
  };

  const columns: ColumnDef<ParsedTransaction>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = row.getValue("date") as string;
        const isValid = row.original.isValid;
        const errors = row.original.errors;
        const hasDateError = errors.some(
          (error) =>
            error.includes("Date") ||
            error.includes("date") ||
            error.includes("future")
        );

        return (
          <div
            className={`flex items-center gap-2 ${
              !isValid ? "text-red-600" : ""
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className={hasDateError ? "line-through" : ""}>
              {formatDate(date)}
            </span>
            {hasDateError && (
              <span
                className="text-xs text-red-500"
                title={errors
                  .filter(
                    (e) =>
                      e.includes("Date") ||
                      e.includes("date") ||
                      e.includes("future")
                  )
                  .join(", ")}
              >
                ⚠️
              </span>
            )}
          </div>
        );
      },
      size: 140,
    },
    {
      accessorKey: "payee",
      header: "Payee",
      cell: ({ row }) => {
        const payee = row.getValue("payee") as string;
        const isValid = row.original.isValid;
        const isAutoMatched = row.original.isAutoMatched;
        const isExisting = !row.original.id.startsWith("temp_");

        return (
          <div
            className={`flex items-center gap-2 ${
              !isValid ? "text-red-600" : ""
            }`}
          >
            <User className="w-4 h-4" />
            <span className="truncate max-w-[150px]">{payee}</span>
            <div className="flex gap-1">
              {isAutoMatched && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Auto-matched
                </span>
              )}
              {isEditMode && isExisting && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Existing
                </span>
              )}
              {isEditMode && !isExisting && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  New
                </span>
              )}
            </div>
          </div>
        );
      },
      size: 280,
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        const isValid = row.original.isValid;

        return (
          <div
            className={`flex items-center gap-2 font-semibold ${
              !isValid ? "text-red-600" : ""
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>{formatCurrency(amount)}</span>
          </div>
        );
      },
      size: 120,
    },
    {
      accessorKey: "category_id",
      header: "Category",
      cell: ({ row }) => {
        const transaction = row.original;
        const categoryOptions = getCategoryOptions();
        const isExisting = !transaction.id.startsWith("temp_");

        if (!transaction.isValid) {
          return (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">Invalid data</span>
            </div>
          );
        }

        // Show category name for existing transactions (read-only)
        if (isEditMode && isExisting) {
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {transaction.category_name || "No category"}
              </span>
              {transaction.category_name && (
                <span className="text-xs text-gray-500">
                  ({transaction.bucket})
                </span>
              )}
            </div>
          );
        }

        return (
          <select
            value={transaction.category_id || ""}
            onChange={(e) =>
              handleCategoryChange(transaction.id, e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select category...</option>
            {Object.entries(categoryOptions).map(([bucket, categories]) => (
              <optgroup
                key={bucket}
                label={bucket.charAt(0).toUpperCase() + bucket.slice(1)}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        );
      },
      size: 200,
    },
    {
      accessorKey: "isValid",
      header: "Status",
      cell: ({ row }) => {
        const isValid = row.getValue("isValid") as boolean;
        const errors = row.original.errors;
        const hasCategory = !!row.original.category_id;
        const isExisting = !row.original.id.startsWith("temp_");

        if (!isValid) {
          return (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm" title={errors.join(", ")}>
                Invalid
              </span>
            </div>
          );
        }

        if (isEditMode && isExisting) {
          return (
            <div className="flex items-center gap-2 text-blue-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm">Existing</span>
            </div>
          );
        }

        if (!hasCategory) {
          return (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">No category</span>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Ready</span>
          </div>
        );
      },
      size: 100,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const transaction = row.original;
        const isExisting = !transaction.id.startsWith("temp_");

        // Don't allow removal of existing transactions in edit mode
        if (isEditMode && isExisting) {
          return <span className="text-xs text-gray-500 px-2">Protected</span>;
        }

        return (
          <Button
            type="button"
            variant="outline"
            onClick={() => handleRemoveTransaction(transaction.id)}
            className="p-2"
            title="Remove transaction"
            icon={<Trash2 className="w-4 h-4" />}
          />
        );
      },
      size: 80,
    },
  ];

  if (isLoadingCategories || isLoadingExistingTransactions) {
    return (
      <Page
        title={isEditMode ? "Add to Expense" : "Import Expenses"}
        subTitle={
          isLoadingCategories
            ? "Loading categories and payees..."
            : "Loading existing transactions..."
        }
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Page>
    );
  }

  return (
    <Page
      title={isEditMode ? "Add to Expense" : "Import Expenses"}
      subTitle={
        isEditMode
          ? "Upload additional transactions to add to this expense"
          : "Upload an Excel file with your expenses and categorize them before saving"
      }
    >
      <div className="space-y-6">
        {/* Edit Mode Banner */}
        {isEditMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-semibold text-blue-800">
                  Adding to Expense Group: {id}
                </h3>
                <p className="text-xs text-blue-600 mt-1">
                  {transactions.filter((t) => !t.id.startsWith("temp_")).length}{" "}
                  existing transaction
                  {transactions.filter((t) => !t.id.startsWith("temp_"))
                    .length === 1
                    ? ""
                    : "s"}{" "}
                  loaded. New transactions will be tagged with this expense
                  group identifier.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Date Format Settings */}
        <Card
          title="Date Format Settings"
          headerContent={
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDateFormatPicker(!showDateFormatPicker)}
              icon={<Settings className="w-4 h-4" />}
              title="Configure date format"
            />
          }
          cardContent={
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Current Date Format
                  </h4>
                  <p className="text-xs text-gray-500">
                    {
                      dateFormats.find((f) => f.value === selectedDateFormat)
                        ?.label
                    }{" "}
                    -{" "}
                    {
                      dateFormats.find((f) => f.value === selectedDateFormat)
                        ?.example
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {selectedDateFormat === "auto"
                      ? "Auto-detect"
                      : dateFormats.find((f) => f.value === selectedDateFormat)
                          ?.label}
                  </span>
                </div>
              </div>

              {showDateFormatPicker && (
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date Format in Your Excel File
                  </label>
                  <select
                    value={selectedDateFormat}
                    onChange={(e) => setSelectedDateFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {dateFormats.map((format) => (
                      <option key={format.value} value={format.value}>
                        {format.label} - {format.example}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Choose the format that matches your Excel file. The system
                    will parse dates accordingly. If your Excel has proper date
                    cells (not text), "Auto-detect" usually works best.
                  </p>
                </div>
              )}
            </div>
          }
        />

        {/* Upload Section */}
        <Card
          title={isEditMode ? "Add More Transactions" : "Upload Expense File"}
          cardContent={
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                    ) : (
                      <Upload className="w-8 h-8 mb-4 text-gray-500" />
                    )}
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      Excel files (.xlsx, .xls) or CSV files
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Required columns: Date, Payee/Merchant, Amount
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>

              {uploadedFileName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>Uploaded: {uploadedFileName}</span>
                  <span className="text-xs text-blue-600">
                    (Using{" "}
                    {
                      dateFormats.find((f) => f.value === selectedDateFormat)
                        ?.label
                    }{" "}
                    format)
                  </span>
                </div>
              )}
            </div>
          }
        />

        {/* File Stats */}
        {fileStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-gray-900">
                {fileStats.totalRows}
              </div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-green-600">
                {fileStats.validRows}
              </div>
              <div className="text-sm text-gray-600">Valid Transactions</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-blue-600">
                {fileStats.autoMatchedRows}
              </div>
              <div className="text-sm text-gray-600">Auto-matched</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-red-600">
                {fileStats.invalidRows}
              </div>
              <div className="text-sm text-gray-600">Invalid Transactions</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(fileStats.totalAmount)}
              </div>
              <div className="text-sm text-gray-600">Total Amount</div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {transactions.length > 0 && (
          <Card
            title="Review Transactions"
            headerContent={
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearTransactions}
                  title={isEditMode ? "Clear New Transactions" : "Clear All"}
                  icon={<X />}
                />
                <Button
                  type="button"
                  onClick={handleSaveExpenses}
                  disabled={
                    isSaving ||
                    transactions.filter(
                      (t) =>
                        t.isValid && t.category_id && t.id.startsWith("temp_")
                    ).length === 0
                  }
                  title={
                    isSaving
                      ? "Saving..."
                      : `${isEditMode ? "Add" : "Save"} ${
                          transactions.filter(
                            (t) =>
                              t.isValid &&
                              t.category_id &&
                              t.id.startsWith("temp_")
                          ).length
                        } New Transaction${
                          transactions.filter(
                            (t) =>
                              t.isValid &&
                              t.category_id &&
                              t.id.startsWith("temp_")
                          ).length === 1
                            ? ""
                            : "s"
                        }`
                  }
                  icon={<Plus />}
                />
              </div>
            }
            cardContent={
              <div>
                <DataTable data={transactions} columns={columns} />

                {/* Summary Info */}
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {
                        transactions.filter(
                          (t) =>
                            t.isValid &&
                            t.category_id &&
                            t.id.startsWith("temp_")
                        ).length
                      }{" "}
                      new transactions ready to save
                      {isEditMode && (
                        <span className="ml-2 text-gray-700">
                          (
                          {
                            transactions.filter(
                              (t) => !t.id.startsWith("temp_")
                            ).length
                          }{" "}
                          existing transactions)
                        </span>
                      )}
                      {fileStats && fileStats.autoMatchedRows > 0 && (
                        <span className="ml-2 text-green-700">
                          ({fileStats.autoMatchedRows} auto-matched from your
                          existing payees)
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    Assign categories to valid transactions before saving.
                    Invalid transactions will be ignored.
                    {isEditMode &&
                      " Existing transactions are protected from changes."}
                  </div>
                </div>
              </div>
            }
          />
        )}

        {/* Help Section */}
        <Card
          title="File Format Help"
          cardContent={
            <div className="space-y-3">
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">
                  Your Excel file should contain these columns:
                </p>
                <ul className="space-y-1 ml-4">
                  <li>
                    • <strong>Date:</strong> Transaction date in the format you
                    selected above
                  </li>
                  <li>
                    • <strong>Payee/Merchant:</strong> Who you paid (restaurant,
                    store, etc.)
                  </li>
                  <li>
                    • <strong>Amount:</strong> Transaction amount (positive
                    numbers, currency symbols will be removed)
                  </li>
                </ul>
              </div>
              <div className="text-xs text-gray-500 border-t pt-3">
                <p>
                  💡 <strong>Smart Matching:</strong> If you've used the same
                  payee before and assigned it to a category, we'll
                  automatically pre-populate the category for matching
                  transactions.
                </p>
                <p className="mt-1">
                  <strong>Date Formats:</strong> Use the date format picker
                  above to specify how dates are formatted in your Excel file.
                  This ensures accurate parsing.
                </p>
                <p className="mt-1">
                  <strong>Tips:</strong> Column names are flexible - we'll try
                  to match "Date", "Payee", "Merchant", "Description", "Amount",
                  "Debit", etc.
                </p>
                {isEditMode && (
                  <p className="mt-1">
                    <strong>Edit Mode:</strong> Existing transactions are
                    protected and cannot be modified or removed. Only new
                    transactions can be added, edited, or removed.
                  </p>
                )}
              </div>
            </div>
          }
        />
      </div>
    </Page>
  );
};

export default ExpenseDetailsPage;
