/* eslint-disable @typescript-eslint/no-explicit-any */
import Page from "@/components/page";
import { useEmiDetails } from "@/pages/emitracker/hooks/useEmiDetails";
import { useUser } from "@/context/UserContext";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { FormSchema } from "@/pages/emitracker/details/validationSchema";
import Card from "@/components/card";
import { Form, FormField } from "@/components/ui/form";
import { Input, Button } from "@/components/inputs";
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
      floatingRates: {}, // ✅ new field
    },
  });

  const { data } = useEmiDetails({ id, userId: user?.id });

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name || "",
        loanAmount: data.loan_amount || 1000,
        rateOfInterest: data.rate_of_interest || 0.1,
        tenure: data.tenure || 1,
        hikePercentage: data.hike_percentage || 0,
        prepayments: data.prepayments || {},
        floatingRates: data.floating_rates || {}, // ✅ set floatingRates
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
      "floatingRates",
    ],
  });

  const [
    name,
    loanAmount,
    rateOfInterest,
    tenure,
    hikePercentage,
    prepayments,
    floatingRates,
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
    totalPrincipalPaid: number;
  } => {
    const totalMonths = tenure * 12;
    let outstandingLoan = loanAmount;
    let currentRate = rateOfInterest;
    let emi = calculateEMI(outstandingLoan, currentRate, totalMonths);
    let totalInterest = 0;
    let totalPrincipalPaid = 0;
    const tableData: EmiTableRow[] = [];

    for (let month = 1; month <= totalMonths; month++) {
      // Floating rate change
      if (floatingRates && floatingRates[month]) {
        currentRate = floatingRates[month];
        const remainingMonths = totalMonths - month + 1;
        emi = calculateEMI(outstandingLoan, currentRate, remainingMonths);
      }

      const monthlyRate = currentRate / 12 / 100;

      // EMI hike yearly
      if (month > 1 && (month - 1) % 12 === 0) {
        emi += (emi * hikePercentage) / 100;
      }

      const interest = outstandingLoan * monthlyRate;
      const principal = emi - interest;
      const prepayment = prepayments[month] || 0;

      let appliedPrincipal = principal;
      let newOutstanding = outstandingLoan - principal - prepayment;

      if (newOutstanding < 0) {
        appliedPrincipal += newOutstanding; // adjust principal if overpaid
        newOutstanding = 0;
      }

      tableData.push({
        month,
        emi: Math.round(emi),
        towardsLoan: Math.round(appliedPrincipal),
        towardsInterest: Math.round(interest),
        outstandingLoan: Math.round(newOutstanding),
        prepayment: Math.round(prepayment),
        year: Math.ceil(month / 12),
      });

      totalInterest += interest;
      totalPrincipalPaid += appliedPrincipal + prepayment;
      outstandingLoan = newOutstanding;

      if (outstandingLoan <= 0) break;
    }

    return {
      tableData,
      totalInterest: Math.round(totalInterest),
      totalPrincipalPaid: Math.round(totalPrincipalPaid),
    };
  };

  const { tableData, totalInterest, totalPrincipalPaid } = generateTableData();

  const filteredTableData = tableData.filter((row) => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      row.month.toString().includes(search) ||
      row.year.toString().includes(search) ||
      row.emi.toString().includes(search) ||
      row.outstandingLoan.toString().includes(search)
    );
  });

  const handleSearch = (value: string) => {
    setSearchQuery(value.trim());
  };

  const handlePrepaymentChange = (month: number, amount: number) => {
    const updated = { ...form.getValues("prepayments"), [month]: amount };
    if (amount <= 0) delete updated[month];
    form.setValue("prepayments", updated, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleFloatingRateChange = (month: number, rate: number) => {
    const updated = { ...form.getValues("floatingRates"), [month]: rate };
    if (rate <= 0) delete updated[month];
    form.setValue("floatingRates", updated, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("emi_details")
      .update({
        name,
        loan_amount: loanAmount,
        rate_of_interest: rateOfInterest,
        tenure,
        hike_percentage: hikePercentage,
        prepayments,
        floating_rates: floatingRates, // ✅ store to DB
      })
      .eq("user_id", user.id)
      .eq("id", id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to update EMI details.");
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
        name,
        loan_amount: loanAmount,
        rate_of_interest: rateOfInterest,
        tenure,
        hike_percentage: hikePercentage,
        prepayments,
        floating_rates: floatingRates,
        is_paid: false,
      },
    ]);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to save EMI details.");
      return;
    }

    toast.success("EMI details saved successfully!");
    navigate("/dashboard/emitracker");
  };

  return (
    <Page
      title={isCreateMode ? "Add EMI" : "Edit EMI"}
      subTitle="Calculate your EMI with the calculator with all details"
      breadcrumbs={[
        { name: "All EMI Listing", to: "/dashboard/emitracker" },
        {
          name: isCreateMode ? "Add EMI" : "Edit EMI",
        },
      ]}
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
                      placeholder="Loan Amount"
                      label="Loan Amount"
                      required
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
                      placeholder="Rate of Interest (%)"
                      label="Rate of Interest (%)"
                      required
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
                      placeholder="Tenure (Years)"
                      label="Tenure (Years)"
                      required
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
                      placeholder="Hike EMI by (%) every year"
                      label="Hike % per Year"
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
              ).toLocaleString("en-IN", {
                maximumFractionDigits: 0,
              })}
            </div>
            <div className="font-semibold">
              Total Interest: ₹{totalInterest.toLocaleString("en-IN")}
            </div>
            <div className="font-semibold">
              Total Principal Paid: ₹
              {totalPrincipalPaid.toLocaleString("en-IN")}
            </div>
          </div>
        }
        cardContent={
          <DataTable
            data={filteredTableData}
            columns={getEmiTableColumns(
              handlePrepaymentChange,
              prepayments,
              handleFloatingRateChange,
              floatingRates
            )}
            onSearch={handleSearch}
          />
        }
      />
    </Page>
  );
};

export default Details;
