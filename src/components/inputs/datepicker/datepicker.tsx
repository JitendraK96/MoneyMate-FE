/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormItem, FormControl, FormMessage } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Label from "@/components/label";

interface DatePickerProps {
  field: any;
  label?: string;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  onChange?: (value: Date | undefined) => void;
}

const DatePicker = ({
  field,
  label = "Select Date",
  placeholder = "Pick a date",
  disabled,
  onChange,
}: DatePickerProps) => {
  const defaultDisabled = (date: Date) =>
    date < new Date(new Date().setHours(0, 0, 0, 0));

  const handleDateSelect = (date: Date | undefined) => {
    // Update the form field
    field.onChange(date);

    // Call the custom onChange if provided
    if (onChange) {
      onChange(date);
    }
  };

  return (
    <FormItem>
      <Label>{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant={"outline"}
              className={
                "!text-[var(--content-textplaceholder)] font-size-small border-[0.5px] !rounded-lg pt-5 pb-5 !bg-[var(--accesscontrol-inputbackground)] !border-[var(--common-inputborder)] focus-visible:ring-[0.5px]"
              }
            >
              {field.value ? (
                format(field.value, "dd/MM/yyyy")
              ) : (
                <span>{placeholder}</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0 bg-[var(--content-background)] text-[var(--content-textsecondary)] font-size-small border-[var(--common-inputborder)]"
          align="start"
        >
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={handleDateSelect}
            disabled={disabled || defaultDisabled}
            initialFocus
            className="text-[var(--content-textprimary)]"
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  );
};

export default DatePicker;
