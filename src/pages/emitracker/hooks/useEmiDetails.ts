import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface EmiDetail {
  id: string;
  user_id: string;
  name: string;
  loan_amount?: number;
  rate_of_interest?: number;
  hike_percentage?: number;
  tenure: number;
  prepayments: { [month: number]: number };
}

interface UseEmiDetailsReturn {
  data: EmiDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseEmiDetailsProps {
  id?: string | null;
  userId?: string | null;
  shouldFetch?: boolean;
}

export const useEmiDetails = ({
  id,
  userId,
  shouldFetch = true,
}: UseEmiDetailsProps): UseEmiDetailsReturn => {
  const [data, setData] = useState<EmiDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmiDetails = async () => {
    if (!id || !userId || !shouldFetch) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: result, error: supabaseError } = await supabase
        .from("emi_details")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (supabaseError) {
        throw supabaseError;
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && userId) {
      fetchEmiDetails();
    }
  }, [id, userId, shouldFetch]);

  const refetch = () => {
    fetchEmiDetails();
  };

  return { data, loading, error, refetch };
};
