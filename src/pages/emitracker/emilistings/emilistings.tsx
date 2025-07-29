import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { RootState } from "@/store";
import { setEmiList } from "@/store/slices/emiDetailsSlice";
import { useUser } from "@/context/UserContext";
import { decryptEmiData } from "@/utils/encryption";
import Card from "@/components/card";
import { Button } from "@/components/inputs";
import { CirclePlus } from "lucide-react";
import DataTable from "@/components/table";
import { getColumns } from "./columnDefs";
import { searchFilter } from "@/components/table/utils";
import Page from "@/components/page";

const EmiListing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  const emiList = useSelector((state: RootState) => state.emiDetails.emiList);

  useEffect(() => {
    const fetchEmiDetails = async () => {
      const { data, error } = await supabase
        .from("emi_details")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching EMI details:", error.message);
        alert("Failed to fetch EMI details. Please try again.");
        return;
      }

      const decryptedData = (data || []).map(item => {
        try {
          const decrypted = decryptEmiData({
            ...item,
            loan_amount: item.loan_amount,
            prepayments: item.prepayments,
          });
          return {
            ...item,
            loan_amount: decrypted.loan_amount,
            prepayments: decrypted.prepayments,
          };
        } catch (decryptError) {
          console.error("Error decrypting EMI data for item:", item.id, decryptError);
          return item;
        }
      });

      dispatch(setEmiList(decryptedData));
    };

    fetchEmiDetails();
  }, [dispatch, user]);

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const handleAddNewEmi = () => {
    navigate("/dashboard/emitracker/create");
  };

  const handleRowClick = (id: number) => {
    navigate(`/dashboard/emitracker/${id}`);
  };

  const handleDeleteEmi = (id: number) => {
    console.log("Delete EMI with ID:", id);
  };

  return (
    <Page
      title="All EMI Listing"
      subTitle="Add all your EMIs here to keep a track with ease"
    >
      <Card
        title="Your EMIs"
        headerContent={
          <Button
            type="button"
            title="Add New EMI"
            className="w-fit"
            onClick={handleAddNewEmi}
            icon={<CirclePlus />}
          ></Button>
        }
        cardContent={
          <DataTable
            data={
              searchQuery !== ""
                ? searchFilter({ rows: emiList, term: searchQuery })
                : emiList
            }
            columns={getColumns(handleDeleteEmi, handleRowClick)}
            onSearch={handleSearch}
          />
        }
      />
    </Page>
  );
};

export default EmiListing;
