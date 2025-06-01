/* eslint-disable @typescript-eslint/no-explicit-any */
import Page from "@/components/page";
import { useEmiDetails } from "@/pages/emitracker/hooks/useEmiDetails";
import { useUser } from "@/context/UserContext";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormSchema } from "@/pages/emitracker/details/validationSchema";
import Card from "@/components/card";
import { Form, FormField } from "@/components/ui/form";
import { Input, Button } from "@/components/inputs";
import { useWatch } from "react-hook-form";
import DataTable from "@/components/table";
import { getEmiTableColumns } from "./emiTableColumnDefs";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";

interface EmiTableRow {
  month: number;
  emi: number;
  towardsLoan: number;
  towardsInterest: number;
  outstandingLoan: number;
  prepayment: number;
  year: number;
}

const Details = () => {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const isCreateMode = !id;
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: {
      name: "",
      loanAmount: 1000,
      rateOfInterest: 0.1,
      tenure: 1,
      hikePercentage: 0,
      prepayments: {},
    },
  });

  const { data, loading } = useEmiDetails({
    id: id,
    userId: user?.id,
  });

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name || "",
        loanAmount: data.loan_amount || 1000,
        rateOfInterest: data.rate_of_interest || 0.1,
        tenure: data.tenure || 1,
        hikePercentage: data.hike_percentage || 0,
        prepayments: data.prepayments || {},
      });
    }
  }, [data, form]);

  const watchedValues = useWatch({
    control: form.control,
    name: [
      "name",
      "loanAmount",
      "rateOfInterest",
      "tenure",
      "hikePercentage",
      "prepayments",
    ],
  });

  const [
    name,
    loanAmount,
    rateOfInterest,
    tenure,
    hikePercentage,
    prepayments,
  ] = watchedValues;

  const {
    formState: { isValid, isDirty },
  } = form;

  const calculateEMI = (principal: number, rate: number, months: number) => {
    const monthlyRate = rate / 12 / 100;
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
      (Math.pow(1 + monthlyRate, months) - 1)
    );
  };

  const generateTableData = (): {
    tableData: EmiTableRow[];
    totalInterest: number;
  } => {
    const monthlyRate = rateOfInterest / 12 / 100;
    const totalMonths = tenure * 12;
    let outstandingLoan = loanAmount;
    let emi = calculateEMI(loanAmount, rateOfInterest, totalMonths);
    let totalInterest = 0;

    const tableData: EmiTableRow[] = [];

    for (let month = 1; month <= totalMonths; month++) {
      // Apply EMI hike at the start of each year (1st month of the year)
      if (month > 1 && (month - 1) % 12 === 0) {
        emi += (emi * hikePercentage!) / 100;
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
          emi: Number(emi.toFixed(0)),
          towardsLoan: Number((towardsLoan + outstandingLoan).toFixed(0)),
          towardsInterest: Number(towardsInterest.toFixed(0)),
          outstandingLoan: 0,
          prepayment: Number(prepayment.toFixed(0)),
          year: Math.ceil(month / 12),
        });
        break;
      }

      totalInterest += towardsInterest;

      tableData.push({
        month,
        emi: Number(emi.toFixed(0)),
        towardsLoan: Number(towardsLoan.toFixed(0)),
        towardsInterest: Number(towardsInterest.toFixed(0)),
        outstandingLoan: Number(outstandingLoan.toFixed(0)),
        prepayment: Number(prepayment.toFixed(0)),
        year: Math.ceil(month / 12),
      });
    }

    return { tableData, totalInterest: Number(totalInterest.toFixed(0)) };
  };

  const { tableData, totalInterest } = generateTableData();

  const filteredTableData = tableData.filter((row) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      row.month.toString().includes(searchLower) ||
      row.year.toString().includes(searchLower) ||
      row.emi.toString().includes(searchLower) ||
      row.outstandingLoan.toString().includes(searchLower)
    );
  });

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("emi_details")
      .update({
        name: name,
        loan_amount: loanAmount,
        rate_of_interest: rateOfInterest,
        tenure,
        hike_percentage: hikePercentage,
        prepayments: prepayments,
      })
      .eq("user_id", user.id)
      .eq("id", id);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update EMI details. Please try again.");
      return;
    }

    toast.success("EMI details updated successfully!");
    navigate("/dashboard/emitracker");
  };

  const handleCreate = async () => {
    setIsSaving(true);
    const { error } = await supabase.from("emi_details").insert([
      {
        user_id: user.id,
        name: name,
        loan_amount: loanAmount,
        rate_of_interest: rateOfInterest,
        tenure,
        hike_percentage: hikePercentage,
        prepayments: prepayments,
        is_paid: false,
      },
    ]);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to save EMI details. Please try again.");
      return;
    }

    toast.success("EMI details saved successfully!");
    navigate("/dashboard/emitracker");
  };

  const handlePrepaymentChange = (month: number, amount: number) => {
    const currentPrepayments = form.getValues("prepayments") || {};

    const updatedPrepayments = {
      ...currentPrepayments,
      [month]: amount,
    };

    if (amount <= 0) {
      delete updatedPrepayments[month];
    }

    form.setValue("prepayments", updatedPrepayments, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  console.log(loading, "loading");
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
              <div className="form-wrapper">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="text"
                      placeholder="EMI Name"
                      label="Name"
                      required
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? "" : value;
                        form.setValue("name", numValue, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="loanAmount"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="number"
                      required
                      placeholder="1000"
                      label="Loan Amount"
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : Number(value);
                        form.setValue("loanAmount", numValue, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="rateOfInterest"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="number"
                      required
                      placeholder="0.1"
                      label="Rate of Interest (%)"
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : Number(value);
                        form.setValue("rateOfInterest", numValue, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                    />
                  )}
                />
              </div>
              <div className="form-wrapper no-bottom-margin">
                <FormField
                  control={form.control}
                  name="tenure"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="number"
                      required
                      placeholder="1"
                      label="tenure (Years)"
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : Number(value);
                        form.setValue("tenure", numValue, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                    />
                  )}
                />
                <FormField
                  control={form.control}
                  name="hikePercentage"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="number"
                      placeholder="0"
                      label="Hike EMI by (%) every year"
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : Number(value);
                        form.setValue("hikePercentage", numValue, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                    />
                  )}
                />
              </div>
            </form>
          </Form>
        }
        footerContent={
          <div className="flex justify-end">
            <Button
              disabled={!isValid || !isDirty}
              type="button"
              title={isCreateMode ? "Create EMI" : "Update EMI"}
              variant={"outline"}
              className="max-w-[130px] !bg-[var(--common-brand)]"
              onClick={isCreateMode ? handleCreate : handleUpdate}
              isLoading={isSaving}
            />
          </div>
        }
      />
      <Card
        title="EMI Breakdown"
        headerContent={
          <div className="text-[var(--content-textprimary)] flex gap-6 text-sm">
            <div className="font-semibold">
              Monthly EMI: ₹
              {calculateEMI(
                loanAmount,
                rateOfInterest,
                tenure * 12
              ).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </div>
            <div className="font-semibold">
              Total Interest: ₹{totalInterest.toLocaleString("en-IN")}
            </div>
          </div>
        }
        cardContent={
          <DataTable
            data={filteredTableData}
            columns={getEmiTableColumns(handlePrepaymentChange, prepayments)}
            onSearch={handleSearch}
          />
        }
      />
    </Page>
  );
};

export default Details;
