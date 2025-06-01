import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { RootState } from "@/store";
import { setList } from "@/store/slices/reminderSlice";
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

  const reminder = useSelector((state: RootState) => state.reminder.list);

  useEffect(() => {
    const fetchEmiDetails = async () => {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching Reminder details:", error.message);
        alert("Failed to fetch EMI details. Please try again.");
        return;
      }

      dispatch(setList(data || []));
    };

    fetchEmiDetails();
  }, [dispatch, user]);

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const handleAddNewEmi = () => {
    navigate("/dashboard/reminders/create");
  };

  const handleRowClick = (id: number) => {
    navigate(`/dashboard/reminders/${id}`);
  };

  const handleDeleteEmi = (id: number) => {
    console.log("Delete Reminder with ID:", id);
  };

  console.log(reminder, "reminder");
  return (
    <Page
      title="All Reminder Listing"
      subTitle="Add all your Reminders here to keep a track with ease"
    >
      <Card
        title="Your Reminders"
        headerContent={
          <Button
            type="button"
            title="Add New Reminder"
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
            columns={getColumns(handleDeleteEmi, handleRowClick)}
            onSearch={handleSearch}
          />
        }
      />
    </Page>
  );
};

export default EmiListing;
