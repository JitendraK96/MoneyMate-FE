import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { RootState } from "@/store";
import { setEmiList } from "@/store/slices/emiDetailsSlice";

const EmiListing = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Fetch EMI list from Redux
  const emiList = useSelector((state: RootState) => state.emiDetails.emiList);

  useEffect(() => {
    const fetchEmiDetails = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("Error fetching user:", userError?.message);
        alert("Failed to fetch user. Please log in again.");
        return;
      }

      // Fetch EMI details for the logged-in user
      const { data, error } = await supabase
        .from("emi_details")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching EMI details:", error.message);
        alert("Failed to fetch EMI details. Please try again.");
        return;
      }

      // Update EMI list in Redux
      dispatch(setEmiList(data || []));
    };

    fetchEmiDetails();
  }, [dispatch]);

  const handleAddNewEmi = () => {
    navigate("/dashboard/emitracker/create");
  };

  const handleRowClick = (emi: { id: number }) => {
    // Navigate to the EmiDetails page with the EMI ID
    navigate(`/dashboard/emitracker/${emi.id}`);
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">EMI Listing</h1>
      <button
        onClick={handleAddNewEmi}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Add New EMI
      </button>
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">ID</th>
            <th className="border border-gray-300 p-2">Loan Amount</th>
            <th className="border border-gray-300 p-2">Rate of Interest (%)</th>
            <th className="border border-gray-300 p-2">Tenure (Years)</th>
            <th className="border border-gray-300 p-2">Hike (%)</th>
          </tr>
        </thead>
        <tbody>
          {emiList.map((emi) => (
            <tr
              key={emi.id}
              className="cursor-pointer hover:bg-gray-100"
              onClick={() => handleRowClick(emi)}
            >
              <td className="border border-gray-300 p-2">{emi.id}</td>
              <td className="border border-gray-300 p-2">{emi.loan_amount}</td>
              <td className="border border-gray-300 p-2">
                {emi.rate_of_interest}
              </td>
              <td className="border border-gray-300 p-2">{emi.tenure}</td>
              <td className="border border-gray-300 p-2">
                {emi.hike_percentage}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmiListing;
