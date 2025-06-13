/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FormItem, FormControl, FormMessage } from "@/components/ui/form";
import Label from "@/components/label";
import { useState, useRef, useEffect, useLayoutEffect } from "react";

interface DatePickerProps {
  field: any;
  label?: string;
  placeholder?: string;
  disabled?: (date: Date) => boolean;
  onChange?: (value: Date | undefined) => void;
  required?: boolean;
  formInput?: boolean;
  className?: string;
}

export default function DatePicker({
  field,
  label = "Select Date",
  placeholder = "Pick a date",
  disabled,
  onChange,
  required = false,
  formInput = true,
  className = "",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [positionAbove, setPositionAbove] = useState(false);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;

    const wrapRect = wrapperRef.current!.getBoundingClientRect();
    const calHeight = calendarRef.current?.offsetHeight ?? 300; // fallback
    const spaceBelow = window.innerHeight - wrapRect.bottom;
    // flip if there's less room below than calendar height
    setPositionAbove(spaceBelow < calHeight + 8);
  }, [open]);

  const handleDateSelect = (date?: Date) => {
    field.onChange?.(date);
    onChange?.(date);
    setOpen(false);
  };

  // Core DatePicker component
  const DatePickerCore = () => (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((o) => !o)}
        className={`
          w-full
          !text-[var(--content-textplaceholder)]
          font-size-small
          border-[0.5px]
          !rounded-lg
          ${formInput ? "pt-5 pb-5" : "py-2"}
          !bg-[var(--accesscontrol-inputbackground)]
          !border-[var(--common-inputborder)]
          focus-visible:ring-[0.5px]
          ${!formInput ? "text-xs h-auto" : ""}
        `}
      >
        {field.value ? (
          format(field.value, "dd/MM/yyyy")
        ) : (
          <span>{placeholder}</span>
        )}
        <CalendarIcon
          className={`ml-auto ${formInput ? "h-4 w-4" : "h-3 w-3"}`}
        />
      </Button>

      {open && (
        <div
          ref={calendarRef}
          className={`
            absolute
            ${positionAbove ? "bottom-full mb-2" : "top-full mt-2"}
            z-50
            bg-[var(--content-background)]
            border
            border-[var(--common-inputborder)]
            shadow-lg
            rounded-md
          `}
        >
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={handleDateSelect}
            disabled={disabled}
            initialFocus
            className="text-[var(--content-textprimary)]"
            captionLayout="dropdown"
          />
        </div>
      )}
    </div>
  );

  // Return with or without form wrapper based on formInput prop
  if (!formInput) {
    return <DatePickerCore />;
  }

  return (
    <FormItem>
      <Label>
        {label}
        {required && <span className="text-[var(--common-error)] ml-1">*</span>}
      </Label>

      <FormControl>
        <DatePickerCore />
      </FormControl>

      <FormMessage />
    </FormItem>
  );
}
