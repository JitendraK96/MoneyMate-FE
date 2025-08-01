import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { decryptEmiData } from "@/utils/encryption";

export interface EmiDetails {
  id: string;
  user_id: string;
  name: string;
  loan_amount: number;
  rate_of_interest: number;
  tenure: number;
  hike_percentage: number;
  prepayments: Record<number, number>;
  floating_rates: Record<number, number>; // ✅ NEW FIELD
  is_paid: boolean;
  is_compound_interest: boolean;
  created_at: string;
  updated_at: string;
}

interface UseEmiDetailsProps {
  id?: string;
  userId?: string | null;
}

export const useEmiDetails = ({ id, userId }: UseEmiDetailsProps) => {
  const [data, setData] = useState<EmiDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !userId) return;

    const fetchDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("emi_details")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching EMI details:", error.message);
        setData(null);
      } else {
        try {
          const decryptedData = decryptEmiData({
            ...data,
            loan_amount: data.loan_amount,
            prepayments: data.prepayments,
          });
          setData({
            ...data,
            loan_amount: decryptedData.loan_amount,
            prepayments: decryptedData.prepayments,
          } as EmiDetails);
        } catch (decryptError) {
          console.error("Error decrypting EMI data:", decryptError);
          setData(data as EmiDetails);
        }
      }

      setLoading(false);
    };

    fetchDetails();
  }, [id, userId]);

  return { data, loading };
};
