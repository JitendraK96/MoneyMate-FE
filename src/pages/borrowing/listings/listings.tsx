import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { RootState } from "@/store";
import { setList } from "@/store/slices/borrowingSlice";
import { useUser } from "@/context/UserContext";
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

  const reminder = useSelector((state: RootState) => state.borrowing.list);

  useEffect(() => {
    const fetchBorrowings = async () => {
      const { data, error } = await supabase
        .from("borrowing_details")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching Borrowing details:", error.message);
        alert("Failed to fetch EMI details. Please try again.");
        return;
      }

      dispatch(setList(data || []));
    };

    fetchBorrowings();
  }, [dispatch, user]);

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const handleAddNewEmi = () => {
    navigate("/dashboard/borrowing/create");
  };

  const handleRowClick = (id: string) => {
    navigate(`/dashboard/borrowing/${id}`);
  };

  const handleDeleteEmi = (id: string) => {
    console.log("Delete Borrowing with ID:", id);
  };

  return (
    <Page
      title="All Borrowing Listing"
      subTitle="Add all your Borrowings here to keep a track with ease"
    >
      <Card
        title="Your Borrowings"
        headerContent={
          <Button
            type="button"
            title="Add New Borrowing"
            className="w-fit"
            onClick={handleAddNewEmi}
            icon={<CirclePlus />}
          ></Button>
        }
        cardContent={
          <DataTable
            data={
              searchQuery !== ""
                ? searchFilter({ rows: reminder, term: searchQuery })
                : reminder
            }
            columns={getColumns(handleRowClick, handleDeleteEmi)}
            onSearch={handleSearch}
          />
        }
      />
    </Page>
  );
};

export default EmiListing;
