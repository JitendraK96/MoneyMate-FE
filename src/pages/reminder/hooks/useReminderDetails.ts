import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface ReminderDetail {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  reminder_date?: string;
  reminder_type?: string;
  recurring_type?: string;
  date_of_month?: number;
  day_of_week?: string;
  weekly_expiration_date?: string;
  monthly_expiration_date?: string;
  is_last_day_of_month?: boolean;
}

interface UseReminderDetailsReturn {
  data: ReminderDetail | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

interface UseReminderDetailsProps {
  id?: string | null;
  userId?: string | null;
  shouldFetch?: boolean;
}

export const useReminderDetail = ({
  id,
  userId,
  shouldFetch = true,
}: UseReminderDetailsProps): UseReminderDetailsReturn => {
  const [data, setData] = useState<ReminderDetail | null>(null);
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
        .from("reminders")
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
