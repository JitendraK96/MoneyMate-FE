/* eslint-disable @typescript-eslint/no-explicit-any */
import Page from "@/components/page";
import { useBorrowingDetails } from "@/pages/borrowing/hooks/useBorrowingDetails";
import { useUser } from "@/context/UserContext";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BorrowingFormSchema } from "@/pages/borrowing/details/validationSchema";
import Card from "@/components/card";
import { Form, FormField } from "@/components/ui/form";
import { Input, Button, DatePicker } from "@/components/inputs";
import { useWatch } from "react-hook-form";
import DataTable from "@/components/table";
import { getBorrowingTableColumns } from "./columnDefs";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { encryptBorrowingData } from "@/utils/encryption";

interface BorrowingTableRow {
  month: number;
  year: number;
  monthName: string;
  emiAmount: number;
  isPaid: boolean;
  dueDate: string;
  monthKey: string;
  paymentDetails: string;
}

const Details = () => {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [manuallyModifiedBorrowingAmount, setManuallyModifiedBorrowingAmount] =
    useState(false);
  const isCreateMode = !id;
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof BorrowingFormSchema>>({
    resolver: zodResolver(BorrowingFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: {
      title: "",
      description: "",
      startDate: null,
      borrowingAmount: 1000,
      tenure: 1,
      emiAmount: 1000,
      paidMonths: {},
      paymentDetails: {},
    } as z.infer<typeof BorrowingFormSchema>,
  });

  const { data } = useBorrowingDetails({
    id: id,
    userId: user?.id,
  });

  useEffect(() => {
    if (data) {
      form.reset({
        title: data.title || "",
        description: data.description || "",
        startDate: data.start_date ? new Date(data.start_date) : null,
        borrowingAmount: data.borrowing_amount || 1000,
        tenure: data.tenure || 1, // in years
        emiAmount: data.emi_amount || 1000,
        paidMonths: data.paid_months || {},
        paymentDetails: data.payment_details || {},
      } as z.infer<typeof BorrowingFormSchema>);
      // If loading existing data, consider borrowing amount as manually set
      if (data.borrowing_amount) {
        setManuallyModifiedBorrowingAmount(true);
      }
    }
  }, [data, form]);

  const watchedValues = useWatch({
    control: form.control,
    name: [
      "title",
      "description",
      "startDate",
      "borrowingAmount",
      "tenure",
      "emiAmount",
      "paidMonths",
      "paymentDetails",
    ],
  });

  const [
    title,
    description,
    startDate,
    borrowingAmount,
    tenure,
    emiAmount,
    paidMonths,
    paymentDetails,
  ] = watchedValues;

  const {
    formState: { isValid, isDirty },
  } = form;

  // Auto-populate borrowing amount based on tenure and EMI amount
  useEffect(() => {
    if (
      tenure &&
      emiAmount &&
      tenure > 0 &&
      emiAmount > 0 &&
      !manuallyModifiedBorrowingAmount
    ) {
      const calculatedBorrowingAmount = emiAmount * tenure * 12;

      form.setValue("borrowingAmount", calculatedBorrowingAmount, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  }, [tenure, emiAmount, form, manuallyModifiedBorrowingAmount]);

  const generateTableData = (): BorrowingTableRow[] => {
    if (!startDate || !tenure) return [];

    const start = new Date(startDate);
    const tableData: BorrowingTableRow[] = [];

    // Set start date to the first day of the month
    start.setDate(1);

    // Calculate total months based on tenure in years
    const totalMonths = tenure * 12;

    // Generate data from start date to end of tenure (all months)
    const currentMonth = new Date(start);
    let monthCounter = 1;

    while (monthCounter <= totalMonths) {
      const monthKey = `${currentMonth.getFullYear()}-${String(
        currentMonth.getMonth() + 1
      ).padStart(2, "0")}`;

      // Due date is 5th of each month
      const dueDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        5
      );

      tableData.push({
        month: monthCounter,
        year: currentMonth.getFullYear(),
        monthName: currentMonth.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        emiAmount: emiAmount,
        isPaid: paidMonths?.[monthKey] || false,
        dueDate: dueDate.toLocaleDateString("en-IN"),
        monthKey: monthKey,
        paymentDetails: paymentDetails?.[monthKey] || "",
      });

      // Move to next month
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      monthCounter++;
    }

    return tableData;
  };

  const tableData = generateTableData();

  const filteredTableData = tableData.filter((row) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      row.month.toString().includes(searchLower) ||
      row.year.toString().includes(searchLower) ||
      row.monthName.toLowerCase().includes(searchLower) ||
      row.emiAmount.toString().includes(searchLower) ||
      row.paymentDetails.toLowerCase().includes(searchLower)
    );
  });

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const handlePaymentStatusChange = (monthKey: string, isPaid: boolean) => {
    const currentPaidMonths = form.getValues("paidMonths") || {};

    const updatedPaidMonths = {
      ...currentPaidMonths,
      [monthKey]: isPaid,
    };

    if (!isPaid) {
      delete updatedPaidMonths[monthKey];
    }

    form.setValue("paidMonths", updatedPaidMonths, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handlePaymentDetailsChange = (monthKey: string, details: string) => {
    const currentPaymentDetails = form.getValues("paymentDetails") || {};

    const updatedPaymentDetails = {
      ...currentPaymentDetails,
      [monthKey]: details,
    };

    if (!details || details.trim() === "") {
      delete updatedPaymentDetails[monthKey];
    }

    form.setValue("paymentDetails", updatedPaymentDetails, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    
    const encryptedData = encryptBorrowingData({
      emi_amount: emiAmount,
      borrowing_amount: borrowingAmount,
      payment_details: paymentDetails || {},
    });
    
    const { error } = await supabase
      .from("borrowing_details")
      .update({
        title: title,
        description: description,
        start_date: startDate,
        borrowing_amount: encryptedData.borrowing_amount,
        tenure: tenure,
        emi_amount: encryptedData.emi_amount,
        paid_months: paidMonths,
        payment_details: encryptedData.payment_details,
      })
      .eq("user_id", user.id)
      .eq("id", id);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update borrowing details. Please try again.");
      return;
    }

    toast.success("Borrowing details updated successfully!");
    navigate("/dashboard/borrowing");
  };

  const handleCreate = async () => {
    setIsSaving(true);
    
    const encryptedData = encryptBorrowingData({
      emi_amount: emiAmount,
      borrowing_amount: borrowingAmount,
      payment_details: paymentDetails || {},
    });
    
    const { error } = await supabase.from("borrowing_details").insert([
      {
        user_id: user.id,
        title: title,
        description: description,
        start_date: startDate,
        borrowing_amount: encryptedData.borrowing_amount,
        tenure: tenure,
        emi_amount: encryptedData.emi_amount,
        paid_months: paidMonths,
        payment_details: encryptedData.payment_details,
        is_completed: false,
      },
    ]);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to save borrowing details. Please try again.");
      return;
    }

    toast.success("Borrowing details saved successfully!");
    navigate("/dashboard/borrowing");
  };

  // Calculate summary statistics
  const totalMonths = tenure * 12;
  const paidCount = Object.values(paidMonths || {}).filter(Boolean).length;
  const totalAmount = emiAmount * totalMonths;
  const paidAmount = paidCount * emiAmount;
  const remainingAmount = totalAmount - paidAmount;
  const progressPercentage =
    totalMonths > 0 ? Math.round((paidCount / totalMonths) * 100) : 0;

  return (
    <Page
      title={isCreateMode ? "Add Borrowing" : "Edit Borrowing"}
      subTitle="Track your borrowing and monthly EMI payments"
      breadcrumbs={[
        { name: "All Borrowing Listing", to: "/dashboard/borrowing" },
        {
          name: isCreateMode ? "Add Borrowing" : "Edit Borrowing",
        },
      ]}
    >
      <Card
        title="Details"
        cardContent={
          <Form {...form}>
            <form>
              <div className="form-wrapper two-column">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="text"
                      placeholder="Enter borrowing title"
                      label="Title"
                      required
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setValue("title", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                    />
                  )}
                />
              </div>
              <div className="form-wrapper two-column">
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="textarea"
                      placeholder="Brief description (optional)"
                      label="Description"
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setValue("description", value, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                    />
                  )}
                />
              </div>
              <div className="form-wrapper">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <DatePicker
                      field={field}
                      label="Start Date"
                      placeholder="Pick an start date"
                      required
                      onChange={(selectedDate) => {
                        form.setValue("startDate", selectedDate || null, {
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
                  name="tenure"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="number"
                      required
                      placeholder="1"
                      label="Tenure (Years)"
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
              </div>
              <div className="form-wrapper no-bottom-margin">
                <FormField
                  control={form.control}
                  name="borrowingAmount"
                  render={({ field }) => (
                    <div className="relative">
                      <Input
                        field={field}
                        type="number"
                        required
                        placeholder="Auto-calculated from EMI × Tenure"
                        label="Borrowing Amount"
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === "" ? 0 : Number(value);
                          setManuallyModifiedBorrowingAmount(true);
                          form.setValue("borrowingAmount", numValue, {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                        }}
                      />
                    </div>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emiAmount"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="number"
                      required
                      placeholder="1000"
                      label="EMI Amount"
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : Number(value);
                        form.setValue("emiAmount", numValue, {
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
              title={isCreateMode ? "Create Borrowing" : "Update Borrowing"}
              className="!bg-[var(--common-brand)]"
              onClick={isCreateMode ? handleCreate : handleUpdate}
              isLoading={isSaving}
            />
          </div>
        }
      />

      {tableData.length > 0 && (
        <Card
          title="Payment Schedule"
          headerContent={
            <div className="text-[var(--content-textprimary)] flex gap-6 text-sm">
              <div className="font-semibold">
                Total Amount: ₹{totalAmount.toLocaleString("en-IN")}
              </div>
              <div className="font-semibold">
                Paid: ₹{paidAmount.toLocaleString("en-IN")}
              </div>
              <div className="font-semibold">
                Remaining: ₹{remainingAmount.toLocaleString("en-IN")}
              </div>
              <div className="font-semibold">
                Progress: {paidCount}/{totalMonths} months ({progressPercentage}
                %)
              </div>
            </div>
          }
          cardContent={
            <DataTable
              data={filteredTableData}
              columns={getBorrowingTableColumns(
                handlePaymentStatusChange,
                handlePaymentDetailsChange,
                paymentDetails || {}
              )}
              onSearch={handleSearch}
            />
          }
        />
      )}
    </Page>
  );
};

export default Details;
