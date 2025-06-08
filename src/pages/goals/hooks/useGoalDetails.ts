/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface GoalDetailsData {
  id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_balance: number;
  target_date: string;
  is_completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
  contributions: any[];
}

interface UseGoalDetailsProps {
  id?: string;
  userId?: string | null;
}

interface UseGoalDetailsReturn {
  data: GoalDetailsData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useGoalDetails = ({
  id,
  userId,
}: UseGoalDetailsProps): UseGoalDetailsReturn => {
  const [data, setData] = useState<GoalDetailsData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGoalDetails = async () => {
    // If no id provided, we're in create mode - don't fetch anything
    if (!id || !userId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch goal details
      const { data: goalData, error: fetchError } = await supabase
        .from("goals")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // No rows returned
          throw new Error("Goal not found");
        }
        throw fetchError;
      }

      // Fetch contributions for this goal
      const { data: contributionsData, error: contributionsError } =
        await supabase
          .from("contributions")
          .select("*")
          .eq("goal_id", id)
          .order("contribution_date", { ascending: false });

      if (contributionsError) {
        console.warn("Error fetching contributions:", contributionsError);
      }

      // Ensure contributions is always an array
      const processedData = {
        ...goalData,
        contributions: contributionsData || [],
      };

      setData(processedData);
    } catch (err: any) {
      console.error("Error fetching goal details:", err);
      setError(err.message || "Failed to fetch goal details");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalDetails();
  }, [id, userId]);

  const refetch = () => {
    fetchGoalDetails();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
};
