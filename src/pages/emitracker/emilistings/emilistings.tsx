import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { RootState } from "@/store";
import { setEmiList } from "@/store/slices/emiDetailsSlice";
import { useUser } from "@/context/UserContext";
import Card from "@/components/card";
import { Button } from "@/components/inputs";
import { CirclePlus } from "lucide-react";
import DataTable from "@/components/table";
import { getColumns } from "./columnDefs"; // Assuming you have a columnDefs file

const EmiListing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useUser();

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

      dispatch(setEmiList(data || []));
    };

    fetchEmiDetails();
  }, [dispatch, user]);

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
    <div className="p-5">
      <h1 className="content-header-title text-[var(--content-textprimary)]">
        All EMI Listing
      </h1>
      <p className="content-header-subtitle text-[var(--content-textsecondary)]">
        Add all your EMIs here to keep a track with ease
      </p>
      <Card
        title="Your EMIs"
        headerContent={
          <Button
            type="button"
            title="Add New EMI"
            className="w-[170px]"
            onClick={handleAddNewEmi}
            icon={<CirclePlus />}
          ></Button>
        }
        cardContent={
          <DataTable
            data={emiList}
            columns={getColumns(handleDeleteEmi, handleRowClick)}
          />
        }
      />
    </div>
  );
};

export default EmiListing;
