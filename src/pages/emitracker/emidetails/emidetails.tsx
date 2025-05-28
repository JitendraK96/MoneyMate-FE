import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import {
  setName,
  setLoanAmount,
  setRateOfInterest,
  setTenure,
  setHikePercentage,
  setPrepayment,
  resetEmiForm,
} from "@/store/slices/emiDetailsSlice";
import { RootState } from "@/store";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import Page from "@/components/page";
import Card from "@/components/card";
import { Form, FormField } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button, Input } from "@/components/inputs";

const FormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .max(50, { message: "Name must not exceed 50 characters." })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Name can only contain letters and spaces.",
    }),
  loanAmount: z
    .number({
      required_error: "Loan amount is required.",
      invalid_type_error: "Loan amount must be a number.",
    })
    .min(1000, { message: "Loan amount must be at least ₹1,000." })
    .max(10000000, { message: "Loan amount cannot exceed ₹1,00,00,000." }),
  rateOfInterest: z
    .number({
      required_error: "Rate of interest is required.",
      invalid_type_error: "Rate of interest must be a number.",
    })
    .min(0.1, { message: "Rate of interest must be at least 0.1%." })
    .max(50, { message: "Rate of interest cannot exceed 50%." }),
  tenure: z
    .number({
      required_error: "Tenure is required.",
      invalid_type_error: "Tenure must be a number.",
    })
    .int({ message: "Tenure must be a whole number." })
    .min(1, { message: "Tenure must be at least 1 year." })
    .max(30, { message: "Tenure cannot exceed 30 years." }),
  hikeEmiByPercentage: z
    .number({
      required_error: "EMI hike percentage is required.",
      invalid_type_error: "EMI hike percentage must be a number.",
    })
    .min(0, { message: "EMI hike percentage cannot be negative." })
    .max(100, { message: "EMI hike percentage cannot exceed 100%." })
    .optional()
    .or(z.literal(0)),
});

const EmiDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation(); // Get the current location
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [emiDetails, setEmiDetails] = useState<any>(null); // State to store EMI details
  const [loading, setLoading] = useState(false); // State to handle loading
  // Fetch EMI details from Redux store
  const {
    name,
    loanAmount,
    rateOfInterest,
    tenure,
    hikePercentage,
    prepayments,
  } = useSelector((state: RootState) => state.emiDetails.form);
  const { user } = useUser();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      loanAmount: 0,
      rateOfInterest: 0,
      tenure: 1,
      hikeEmiByPercentage: 0,
    },
  });

  useEffect(() => {
    form.reset({
      name: name || "",
      loanAmount: loanAmount || 0,
      rateOfInterest: rateOfInterest || 0,
      tenure: tenure || 1,
      hikeEmiByPercentage: hikePercentage || 0,
    });
  }, [name, loanAmount, rateOfInterest, tenure, hikePercentage, form]);

  useEffect(() => {
    dispatch(resetEmiForm());
  }, [dispatch]);

  useEffect(() => {
    const fetchEmiDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("emi_details")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single(); // Fetch the EMI details for the given ID

      if (error) {
        console.error("Error fetching EMI details:", error.message);
        alert("Failed to fetch EMI details. Please try again.");
        navigate("/dashboard/emitracker"); // Redirect back to listing page
        return;
      }

      setEmiDetails(data);
      dispatch(setName(data.name));
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
        name: name,
        loan_amount: loanAmount,
        rate_of_interest: rateOfInterest,
        tenure,
        hike_percentage: hikePercentage,
        prepayments: prepayments, // Pass prepayments as a JSON object
      })
      .eq("user_id", user.id)
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
    if (!user) {
      alert("Failed to fetch user. Please log in again.");
      return;
    }

    // Insert EMI details into the Supabase table
    const { error } = await supabase.from("emi_details").insert([
      {
        user_id: user.id, // Use user ID from Redux store
        name: name,
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
    <Page
      title="EMI Calculator"
      subTitle="Calculate your EMI with the calculator with all details"
    >
      <Card
        title="Details"
        cardContent={
          <Form {...form}>
            <form>
              <div className="flex gap-5 mb-6">
                <div className="flex-1 max-w-[500px]">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <Input
                        field={field}
                        type="text"
                        placeholder="EMI Name"
                        label="Name"
                        onChange={(e) => dispatch(setName(e.target.value))}
                      />
                    )}
                  />
                </div>
                <div className="flex-1 max-w-[500px]">
                  <FormField
                    control={form.control}
                    name="loanAmount"
                    render={({ field }) => (
                      <Input
                        field={field}
                        type="number"
                        placeholder="1000"
                        label="Loan Amount"
                        onChange={(e) =>
                          dispatch(setLoanAmount(Number(e.target.value)))
                        }
                      />
                    )}
                  />
                </div>
              </div>
              <div className="flex gap-5 mb-6">
                <div className="flex-1 max-w-[500px]">
                  <FormField
                    control={form.control}
                    name="rateOfInterest"
                    render={({ field }) => (
                      <Input
                        field={field}
                        type="number"
                        placeholder="0.1"
                        label="Rate of Interest (%)"
                        onChange={(e) =>
                          dispatch(setRateOfInterest(Number(e.target.value)))
                        }
                      />
                    )}
                  />
                </div>
                <div className="flex-1 max-w-[500px]">
                  <FormField
                    control={form.control}
                    name="tenure"
                    render={({ field }) => (
                      <Input
                        field={field}
                        type="number"
                        placeholder="1"
                        label="tenure (Years)"
                        onChange={(e) =>
                          dispatch(setTenure(Number(e.target.value)))
                        }
                      />
                    )}
                  />
                </div>
              </div>
              <div className="flex gap-5">
                <div className="flex-1 max-w-[500px]">
                  <FormField
                    control={form.control}
                    name="hikeEmiByPercentage"
                    render={({ field }) => (
                      <Input
                        field={field}
                        type="number"
                        placeholder="0"
                        label="Hike EMI by (%) every year"
                        onChange={(e) =>
                          dispatch(setHikePercentage(Number(e.target.value)))
                        }
                      />
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        }
        footerContent={
          <div className="flex justify-end">
            <Button
              type="button"
              title={
                location.pathname.includes("create")
                  ? "Create EMI"
                  : "Update EMI"
              }
              variant={"outline"}
              className="max-w-[130px] !bg-[var(--common-brand)]"
              onClick={
                location.pathname.includes("create")
                  ? handleCreate
                  : handleUpdate
              }
            />
          </div>
        }
      />

      <h2 className="text-lg font-bold mb-4">
        Monthly EMI:{" "}
        {calculateEMI(loanAmount, rateOfInterest, tenure * 12).toFixed(0)}
      </h2>
      <h2 className="text-lg font-bold mb-4">
        Total Interest: {totalInterest}
      </h2>
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
    </Page>
  );
};

export default EmiDetails;
