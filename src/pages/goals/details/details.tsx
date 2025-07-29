/* eslint-disable @typescript-eslint/no-explicit-any */
import Page from "@/components/page";
import { useGoalDetails } from "@/pages/goals/hooks/useGoalDetails";
import { useUser } from "@/context/UserContext";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { GoalFormSchema } from "@/pages/goals/validationSchemas/goalsSchema";
import Card from "@/components/card";
import { Form, FormField } from "@/components/ui/form";
import { Input, Button, DatePicker } from "@/components/inputs";
import { useWatch } from "react-hook-form";
import DataTable from "@/components/table";
import { getContributionTableColumns } from "./columnDefs";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import AddContributionModal from "../modals/AddContibutionModal";
import { encryptGoalData } from "@/utils/encryption";

interface ContributionTableRow {
  id: string;
  contribution_date: string;
  amount: number;
  description: string;
  created_at: string;
}

const Details = () => {
  const { user } = useUser();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const isCreateMode = !id;
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof GoalFormSchema>>({
    resolver: zodResolver(GoalFormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: {
      name: "",
      description: "",
      targetAmount: 10000,
      currentBalance: 0,
      targetDate: null,
    } as z.infer<typeof GoalFormSchema>,
  });

  const { data } = useGoalDetails({
    id: id,
    userId: user?.id,
  });

  useEffect(() => {
    if (data) {
      form.reset({
        name: data.name || "",
        description: data.description || "",
        targetAmount: data.target_amount || 10000,
        currentBalance: data.current_balance || 0,
        targetDate: data.target_date ? new Date(data.target_date) : null,
      } as z.infer<typeof GoalFormSchema>);
    }
  }, [data, form]);

  const watchedValues = useWatch({
    control: form.control,
    name: [
      "name",
      "description",
      "targetAmount",
      "currentBalance",
      "targetDate",
    ],
  });

  const [name, description, targetAmount, currentBalance, targetDate] =
    watchedValues;

  const {
    formState: { isValid, isDirty },
  } = form;

  const generateTableData = (): ContributionTableRow[] => {
    if (!data || !data.contributions) return [];

    return data.contributions.map((contribution: any) => ({
      id: contribution.id,
      contribution_date: contribution.contribution_date,
      amount: contribution.amount,
      description: contribution.description || "",
      created_at: contribution.created_at,
    }));
  };

  const tableData = generateTableData();

  const filteredTableData = tableData.filter((row) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    return (
      row.amount.toString().includes(searchLower) ||
      row.description.toLowerCase().includes(searchLower) ||
      new Date(row.contribution_date).toLocaleDateString().includes(searchLower)
    );
  });

  const handleSearch = (search: string) => {
    setSearchQuery(search.trim());
  };

  const handleUpdate = async () => {
    setIsSaving(true);
    
    const encryptedData = encryptGoalData({
      target_amount: targetAmount,
      current_balance: currentBalance,
    });
    
    const { error } = await supabase
      .from("goals")
      .update({
        name: name,
        description: description,
        target_amount: encryptedData.target_amount,
        current_balance: encryptedData.current_balance,
        target_date: targetDate?.toISOString().split("T")[0],
        is_completed: currentBalance >= targetAmount,
      })
      .eq("user_id", user.id)
      .eq("id", id);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update goal. Please try again.");
      return;
    }

    toast.success("Goal updated successfully!");
    navigate("/dashboard/goals");
  };

  const handleCreate = async () => {
    setIsSaving(true);
    
    const encryptedData = encryptGoalData({
      target_amount: targetAmount,
      current_balance: currentBalance,
    });
    
    const { error } = await supabase.from("goals").insert([
      {
        user_id: user.id,
        name: name,
        description: description,
        target_amount: encryptedData.target_amount,
        current_balance: encryptedData.current_balance,
        target_date: targetDate?.toISOString().split("T")[0],
        is_completed: false,
      },
    ]);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to save goal. Please try again.");
      return;
    }

    toast.success("Goal created successfully!");
    navigate("/dashboard/goals");
  };

  const handleContributionAdded = async () => {
    // Refresh data after contribution is added
    window.location.reload(); // Simple refresh - you can make this more elegant
  };

  // Calculate summary statistics
  const progressPercentage =
    targetAmount > 0 ? Math.round((currentBalance / targetAmount) * 100) : 0;
  const remainingAmount = Math.max(0, targetAmount - currentBalance);
  const contributionCount = tableData.length;
  const totalContributions = currentBalance;

  return (
    <Page
      title={isCreateMode ? "Add Goal" : "Edit Goal"}
      subTitle="Track your savings goals and contributions"
      breadcrumbs={[
        { name: "All Goals Listing", to: "/dashboard/goals" },
        {
          name: isCreateMode ? "Add Goal" : "Edit Goal",
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
                  name="name"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="text"
                      placeholder="Enter goal name"
                      label="Goal Name"
                      required
                      onChange={(e) => {
                        const value = e.target.value;
                        form.setValue("name", value, {
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
                      placeholder="Describe your goal (optional)"
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
                  name="targetAmount"
                  render={({ field }) => (
                    <Input
                      field={field}
                      type="number"
                      required
                      placeholder="100000"
                      label="Target Amount"
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? 0 : Number(value);
                        form.setValue("targetAmount", numValue, {
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
                  name="targetDate"
                  render={({ field }) => (
                    <DatePicker
                      field={field}
                      label="Target Date"
                      placeholder="Pick target date"
                      required
                      onChange={(selectedDate) => {
                        form.setValue("targetDate", selectedDate || null, {
                          shouldValidate: true,
                          shouldDirty: true,
                          shouldTouch: true,
                        });
                      }}
                    />
                  )}
                />
              </div>
              {isCreateMode && (
                <div className="form-wrapper no-bottom-margin">
                  <FormField
                    control={form.control}
                    name="currentBalance"
                    render={({ field }) => (
                      <Input
                        field={field}
                        type="number"
                        placeholder="0"
                        label="Current Balance (if any)"
                        onChange={(e) => {
                          const value = e.target.value;
                          const numValue = value === "" ? 0 : Number(value);
                          form.setValue("currentBalance", numValue, {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          });
                        }}
                      />
                    )}
                  />
                </div>
              )}
            </form>
          </Form>
        }
        footerContent={
          <div className="flex justify-end gap-2">
            {!isCreateMode && (
              <Button
                type="button"
                title="Add Contribution"
                variant="secondary"
                className="!bg-[var(--common-brand)] w-fit"
                onClick={() => setIsContributionModalOpen(true)}
              />
            )}
            <Button
              disabled={!isValid || !isDirty}
              type="button"
              title={isCreateMode ? "Create Goal" : "Update Goal"}
              className="!bg-[var(--common-brand)] w-fit"
              onClick={isCreateMode ? handleCreate : handleUpdate}
              isLoading={isSaving}
            />
          </div>
        }
      />

      {tableData.length > 0 && (
        <Card
          title="Contribution History"
          headerContent={
            <div className="text-[var(--content-textprimary)] flex gap-6 text-sm">
              <div className="font-semibold">
                Target Amount: ₹{targetAmount.toLocaleString("en-IN")}
              </div>
              <div className="font-semibold">
                Current Balance: ₹{totalContributions.toLocaleString("en-IN")}
              </div>
              <div className="font-semibold">
                Remaining: ₹{remainingAmount.toLocaleString("en-IN")}
              </div>
              <div className="font-semibold">
                Progress: {contributionCount} contributions (
                {progressPercentage}%)
              </div>
            </div>
          }
          cardContent={
            <DataTable
              data={filteredTableData}
              columns={getContributionTableColumns()}
              onSearch={handleSearch}
            />
          }
        />
      )}
      {data && (
        <AddContributionModal
          goal={data}
          isOpen={isContributionModalOpen}
          onClose={() => setIsContributionModalOpen(false)}
          onContributionAdded={handleContributionAdded}
        />
      )}
    </Page>
  );
};

export default Details;
