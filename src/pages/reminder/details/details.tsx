import Page from "@/components/page";
import Card from "@/components/card";
import { useReminderDetail } from "@/pages/reminder/hooks/useReminderDetails";
import { Form, FormField } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input, Radio, DatePicker, Button } from "@/components/inputs";
import Dropdown from "@/components/dropdown";
import { useWatch } from "react-hook-form";
import { FormSchema } from "./validationSchema";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import { useUser } from "@/context/UserContext";
import { useParams } from "react-router-dom";
import { useEffect } from "react";

const Details = () => {
  const { user } = useUser();
  const { id } = useParams();
  const isCreateMode = !id;
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    criteriaMode: "all",
    shouldFocusError: true,
    defaultValues: {
      title: "",
      description: "",
      reminderType: "single",
      recurringType: "",
      dayOfWeek: "",
      weeklyExpirationDate: undefined,
      monthlyExpirationDate: undefined,
      reminderDate: undefined,
      dateOfMonth: 1,
    },
  });

  const { data } = useReminderDetail({
    id: id,
    userId: user?.id,
  });

  useEffect(() => {
    if (data) {
      form.reset({
        title: data.title || "",
        description: data.description || "",
        reminderType:
          (data.reminder_type as "single" | "recurring") || "single",
        recurringType: (data.recurring_type as "weekly" | "monthly") || "",
        dayOfWeek: dayOfWeek as
          | "monday"
          | "tuesday"
          | "wednesday"
          | "thursday"
          | "friday"
          | "saturday"
          | "sunday"
          | "",
        weeklyExpirationDate: data.weekly_expiration_date
          ? new Date(data.weekly_expiration_date)
          : undefined,
        monthlyExpirationDate: data.monthly_expiration_date
          ? new Date(data.monthly_expiration_date)
          : undefined,
        reminderDate: data.reminder_date
          ? new Date(data.reminder_date)
          : undefined,
        dateOfMonth: data.date_of_month || 1,
      });
    }
  }, [data, form]);

  const watchedValues = useWatch({
    control: form.control,
    name: [
      "reminderType",
      "recurringType",
      "title",
      "description",
      "dayOfWeek",
      "weeklyExpirationDate",
      "monthlyExpirationDate",
      "reminderDate",
      "dateOfMonth",
    ],
  });

  const [
    reminderType,
    recurringType,
    title,
    description,
    dayOfWeek,
    weeklyExpirationDate,
    monthlyExpirationDate,
    reminderDate,
    dateOfMonth,
  ] = watchedValues;

  const {
    formState: { isValid, isDirty },
  } = form;

  const handleUpdate = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("reminders")
      .update({})
      .eq("user_id", user.id)
      .eq("id", id);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to update Reminder details. Please try again.");
      return;
    }

    toast.success("Reminder details updated successfully!");
  };

  const handleCreate = async () => {
    setIsSaving(true);
    const { error } = await supabase.from("reminders").insert([
      {
        user_id: user.id,
        title: title,
        description: description,
        reminder_type: reminderType,
        reminder_date: reminderType === "single" ? reminderDate : null,
        recurring_type: recurringType || null,
        day_of_week: reminderType === "recurring" ? dayOfWeek : null,
        weekly_expiration_date:
          reminderType === "recurring" ? weeklyExpirationDate : null,
        monthly_expiration_date:
          reminderType === "recurring" ? monthlyExpirationDate : null,
        date_of_month: reminderType === "recurring" ? dateOfMonth : null,
      },
    ]);
    setIsSaving(false);

    if (error) {
      toast.error("Failed to save Reminder details. Please try again.");
      return;
    }

    toast.success("Reminder details saved successfully!");
  };

  return (
    <Page title="Reminder" subTitle="View and edit reminder details">
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
                      placeholder="Title"
                      label="Title"
                      required
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? "" : value;
                        form.setValue("title", numValue, {
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
                      placeholder="Description"
                      label="Description"
                      required
                      rows={8}
                      onChange={(e) => {
                        const value = e.target.value;
                        const numValue = value === "" ? "" : value;
                        form.setValue("description", numValue, {
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
                  name="reminderType"
                  render={({ field }) => (
                    <Radio
                      label="Reminder Type"
                      options={[
                        { value: "single", label: "Single" },
                        { value: "recurring", label: "Recurring" },
                      ]}
                      value={field.value}
                      className="mt-5"
                      onValueChange={(value) => {
                        form.setValue(
                          "reminderType",
                          value as "single" | "recurring",
                          {
                            shouldValidate: true,
                            shouldDirty: true,
                            shouldTouch: true,
                          }
                        );
                      }}
                    />
                  )}
                />
                {reminderType === "recurring" && (
                  <FormField
                    control={form.control}
                    name="recurringType"
                    render={({ field }) => (
                      <Radio
                        label="Recurring Type"
                        options={[
                          { value: "weekly", label: "Weekly" },
                          { value: "monthly", label: "Monthly" },
                        ]}
                        value={field.value}
                        className="mt-5"
                        onValueChange={(value) => {
                          form.setValue(
                            "recurringType",
                            value as "weekly" | "monthly",
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true,
                            }
                          );
                        }}
                      />
                    )}
                  />
                )}
              </div>
              {reminderType === "single" && (
                <div className="form-wrapper no-bottom-margin">
                  <FormField
                    control={form.control}
                    name="reminderDate"
                    render={({ field }) => (
                      <DatePicker
                        field={field}
                        label="Reminder Date"
                        placeholder="Pick a reminder date"
                        onChange={(selectedDate) => {
                          form.setValue(
                            "reminderDate",
                            selectedDate || new Date(),
                            {
                              shouldValidate: true,
                              shouldDirty: true,
                              shouldTouch: true,
                            }
                          );
                        }}
                      />
                    )}
                  />
                </div>
              )}

              {reminderType === "recurring" && (
                <>
                  {recurringType === "weekly" && (
                    <div className="form-wrapper no-bottom-margin">
                      <FormField
                        control={form.control}
                        name="dayOfWeek"
                        render={({ field }) => (
                          <Dropdown
                            field={field}
                            label="Day of Week"
                            placeholder="Select a day"
                            options={[
                              { value: "monday", label: "Monday" },
                              { value: "tuesday", label: "Tuesday" },
                              { value: "wednesday", label: "Wednesday" },
                              { value: "thursday", label: "Thursday" },
                              { value: "friday", label: "Friday" },
                              { value: "saturday", label: "Saturday" },
                              { value: "sunday", label: "Sunday" },
                            ]}
                            required
                            onChange={(value) => {
                              form.setValue(
                                "dayOfWeek",
                                value as
                                  | "monday"
                                  | "tuesday"
                                  | "wednesday"
                                  | "thursday"
                                  | "friday"
                                  | "saturday"
                                  | "sunday",
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true,
                                }
                              );
                            }}
                          />
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weeklyExpirationDate"
                        render={({ field }) => (
                          <DatePicker
                            field={field}
                            label="Expiry Date"
                            placeholder="Pick an expiry date"
                            onChange={(selectedDate) => {
                              form.setValue(
                                "weeklyExpirationDate",
                                selectedDate || new Date(),
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true,
                                }
                              );
                            }}
                          />
                        )}
                      />
                    </div>
                  )}
                  {recurringType === "monthly" && (
                    <div className="form-wrapper no-bottom-margin">
                      <FormField
                        control={form.control}
                        name="dateOfMonth"
                        render={({ field }) => (
                          <Input
                            field={field}
                            type="number"
                            placeholder="1"
                            label="Date of Month"
                            onChange={(e) => {
                              const value = e.target.value;
                              const numValue = value === "" ? 1 : Number(value);
                              form.setValue("dateOfMonth", numValue, {
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
                        name="monthlyExpirationDate"
                        render={({ field }) => (
                          <DatePicker
                            field={field}
                            label="Expiry Date"
                            placeholder="Pick an expiry date"
                            onChange={(selectedDate) => {
                              form.setValue(
                                "monthlyExpirationDate",
                                selectedDate || new Date(),
                                {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                  shouldTouch: true,
                                }
                              );
                            }}
                          />
                        )}
                      />
                    </div>
                  )}
                </>
              )}
            </form>
          </Form>
        }
        footerContent={
          <div className="flex justify-end">
            <Button
              disabled={!isValid || !isDirty}
              type="button"
              title={isCreateMode ? "Create Reminder" : "Update Reminder"}
              variant={"outline"}
              className="!bg-[var(--common-brand)]"
              onClick={isCreateMode ? handleCreate : handleUpdate}
              isLoading={isSaving}
            />
          </div>
        }
      />
    </Page>
  );
};

export default Details;
