/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface BorrowingDetailsData {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  borrowing_amount: number;
  tenure: number; // in years
  emi_amount: number;
  payment_info: string;
  paid_months: Record<string, boolean>;
  payment_details: Record<string, string>;
  is_completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface UseBorrowingDetailsProps {
  id?: string;
  userId?: string | null;
}

interface UseBorrowingDetailsReturn {
  data: BorrowingDetailsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useBorrowingDetails = ({
  id,
  userId,
}: UseBorrowingDetailsProps): UseBorrowingDetailsReturn => {
  const [data, setData] = useState<BorrowingDetailsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBorrowingDetails = async () => {
    // If no id provided, we're in create mode - don't fetch anything
    if (!id || !userId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: borrowingData, error: fetchError } = await supabase
        .from("borrowing_details")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // No rows returned
          throw new Error("Borrowing record not found");
        }
        throw fetchError;
      }

      // Ensure payment_details is always an object, even if null in database
      const processedData = {
        ...borrowingData,
        payment_details: borrowingData.payment_details || {},
        paid_months: borrowingData.paid_months || {},
      };

      setData(processedData);
    } catch (err: any) {
      console.error("Error fetching borrowing details:", err);
      setError(err.message || "Failed to fetch borrowing details");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrowingDetails();
  }, [id, userId]);

  const refetch = () => {
    fetchBorrowingDetails();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
};
