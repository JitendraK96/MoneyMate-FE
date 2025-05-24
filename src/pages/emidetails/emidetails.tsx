import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import {
  setLoanAmount,
  setRateOfInterest,
  setTenure,
  setHikePercentage,
  setPrepayment,
} from "@/store/slices/emiDetailsSlice";
import { RootState } from "@/store";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, useLocation, useParams } from "react-router-dom";

const EmiDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emiDetails, setEmiDetails] = useState<any>(null); // State to store EMI details
  const [loading, setLoading] = useState(false); // State to handle loading
  // Fetch EMI details from Redux store
  const { loanAmount, rateOfInterest, tenure, hikePercentage, prepayments } =
    useSelector((state: RootState) => state.emiDetails);

  useEffect(() => {
    const fetchEmiDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("emi_details")
        .select("*")
        .eq("id", id)
        .single(); // Fetch the EMI details for the given ID

      if (error) {
        console.error("Error fetching EMI details:", error.message);
        alert("Failed to fetch EMI details. Please try again.");
        navigate("/dashboard/emitracker"); // Redirect back to listing page
        return;
      }

      setEmiDetails(data);
      dispatch(setLoanAmount(data.loan_amount));
      dispatch(setRateOfInterest(data.rate_of_interest));
      dispatch(setTenure(data.tenure));
      dispatch(setHikePercentage(data.hike_percentage));
      Object.entries(data.prepayments || {}).forEach(([month, amount]) => {
        dispatch(
          setPrepayment({
            month: Number(month),
            amount: Number(amount),
          })
        );
      });
      setLoading(false);
    };

    if (id) {
      fetchEmiDetails();
    }
  }, [id, navigate]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (!emiDetails && !location.pathname.includes("create")) {
    return <p>No EMI details found.</p>;
  }

  const calculateEMI = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 12 / 100;
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
    );
  };

  const generateTableData = () => {
    const monthlyRate = rateOfInterest / 12 / 100;
    const totalMonths = tenure * 12;
    let outstandingLoan = loanAmount;
    let emi = calculateEMI(loanAmount, rateOfInterest, totalMonths);
    let totalInterest = 0;

    const tableData = [];

    for (let month = 1; month <= totalMonths; month++) {
      // Apply EMI hike at the start of each year (1st month of the year)
      if (month > 1 && (month - 1) % 12 === 0) {
        emi += (emi * hikePercentage) / 100;
      }

      const towardsInterest = outstandingLoan * monthlyRate;
      const towardsLoan = emi - towardsInterest;

      // Apply prepayment if any for the current month
      const prepayment = prepayments[month] || 0;
      outstandingLoan -= towardsLoan + prepayment;

      // Stop if the loan is fully paid
      if (outstandingLoan <= 0) {
        tableData.push({
          month,
          emi: emi.toFixed(0),
          towardsLoan: (towardsLoan + outstandingLoan).toFixed(0),
          towardsInterest: towardsInterest.toFixed(0),
          outstandingLoan: "0.00",
          prepayment: prepayment.toFixed(0),
        });
        break;
      }

      totalInterest += towardsInterest;

      tableData.push({
        month,
        emi: emi.toFixed(0),
        towardsLoan: towardsLoan.toFixed(0),
        towardsInterest: towardsInterest.toFixed(0),
        outstandingLoan: outstandingLoan.toFixed(0),
        prepayment: prepayment.toFixed(0),
      });
    }

    return { tableData, totalInterest: totalInterest.toFixed(0) };
  };

  const { tableData, totalInterest } = generateTableData();

  const handleUpdate = async () => {
    const { error } = await supabase
      .from("emi_details")
      .update({
        loan_amount: loanAmount,
        rate_of_interest: rateOfInterest,
        tenure,
        hike_percentage: hikePercentage,
        prepayments: prepayments, // Pass prepayments as a JSON object
      })
      .eq("id", id); // Update the row with the given ID

    if (error) {
      console.error("Error updating EMI details:", error.message);
      alert("Failed to update EMI details. Please try again.");
      return;
    }

    alert("EMI details updated successfully!");
    navigate("/dashboard/emitracker"); // Redirect to EMI listing page
  };

  const handleCreate = async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Error fetching user:", userError?.message);
      alert("Failed to fetch user. Please log in again.");
      return;
    }

    // Insert EMI details into the Supabase table
    const { error } = await supabase.from("emi_details").insert([
      {
        user_id: user.id, // Use user ID from Redux store
        loan_amount: loanAmount,
        rate_of_interest: rateOfInterest,
        tenure,
        hike_percentage: hikePercentage,
        prepayments: prepayments, // Pass prepayments as a JSON object
        is_paid: false, // Default to unpaid
      },
    ]);

    if (error) {
      console.error("Error saving EMI details:", error.message);
      alert("Failed to save EMI details. Please try again.");
      return;
    }

    alert("EMI details saved successfully!");
    navigate("/dashboard/emitracker"); // Redirect to EMI listing page
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">EMI Calculator</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block mb-2">Loan Amount</label>
          <input
            type="number"
            value={loanAmount}
            onChange={(e) => dispatch(setLoanAmount(Number(e.target.value)))}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Rate of Interest (%)</label>
          <input
            type="number"
            value={rateOfInterest}
            onChange={(e) =>
              dispatch(setRateOfInterest(Number(e.target.value)))
            }
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Tenure (Years)</label>
          <input
            type="number"
            value={tenure}
            onChange={(e) => dispatch(setTenure(Number(e.target.value)))}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Hike EMI by (%) every year</label>
          <input
            type="number"
            value={hikePercentage}
            onChange={(e) =>
              dispatch(setHikePercentage(Number(e.target.value)))
            }
            className="border p-2 w-full"
          />
        </div>
      </div>
      <h2 className="text-lg font-bold mb-4">
        Monthly EMI:{" "}
        {calculateEMI(loanAmount, rateOfInterest, tenure * 12).toFixed(0)}
      </h2>
      <h2 className="text-lg font-bold mb-4">
        Total Interest: {totalInterest}
      </h2>
      {/* Show the Create button only if the location includes "create" */}
      {location.pathname.includes("create") ? (
        <button
          onClick={handleCreate}
          className="mb-6 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Create
        </button>
      ) : (
        <button
          onClick={handleUpdate}
          className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Update
        </button>
      )}
      <table className="table-auto w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 p-2">Month</th>
            <th className="border border-gray-300 p-2">EMI</th>
            <th className="border border-gray-300 p-2">Towards Loan</th>
            <th className="border border-gray-300 p-2">Towards Interest</th>
            <th className="border border-gray-300 p-2">Outstanding Loan</th>
            <th className="border border-gray-300 p-2">Prepayment</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row) => (
            <tr key={row.month}>
              <td className="border border-gray-300 p-2">{row.month}</td>
              <td className="border border-gray-300 p-2">{row.emi}</td>
              <td className="border border-gray-300 p-2">{row.towardsLoan}</td>
              <td className="border border-gray-300 p-2">
                {row.towardsInterest}
              </td>
              <td className="border border-gray-300 p-2">
                {row.outstandingLoan}
              </td>
              <td className="border border-gray-300 p-2">
                <input
                  type="number"
                  value={prepayments[row.month] || ""}
                  onChange={(e) =>
                    dispatch(
                      setPrepayment({
                        month: row.month,
                        amount: Number(e.target.value),
                      })
                    )
                  }
                  className="border p-1 w-full"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmiDetails;
