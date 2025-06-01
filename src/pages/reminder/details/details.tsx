import Page from "@/components/page";
import Card from "@/components/card";
import { Form, FormField } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input, Radio, DatePicker, Button } from "@/components/inputs";
import Dropdown from "@/components/dropdown";
import { useWatch } from "react-hook-form";
import { FormSchema } from "./validationSchema";

const Details = () => {
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
      recurringType: "weekly",
      dayOfWeek: "monday",
      weeklyExpirationDate: undefined,
      monthlyExpirationDate: undefined,
      reminderDate: undefined,
      dateOfMonth: 1,
    },
  });

  const watchedValues = useWatch({
    control: form.control,
    name: ["reminderType", "recurringType"],
  });

  const [reminderType, recurringType] = watchedValues;

  const {
    formState: { isValid, isDirty, errors },
  } = form;

  console.log(
    isValid,
    !isValid,
    !isDirty,
    "OKOKOK",
    !isValid || !isDirty,
    errors
  );
  return (
    <Page title="Reminder" subTitle="View and edit reminder details">
      <Card
        title="Details"
        cardContent={
          <Form {...form}>
            <form>
              <div className="form-wrapper">
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
              <div className="form-wrapper">
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
              title={"Create Now"}
              variant={"outline"}
              className="!bg-[var(--common-brand)]"
            />
          </div>
        }
      />
    </Page>
  );
};

export default Details;
