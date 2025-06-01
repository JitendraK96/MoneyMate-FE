/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { FormItem, FormControl, FormMessage } from "@/components/ui/form";
import Label from "@/components/label";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  field: any;
  label?: string;
  placeholder?: string;
  options: DropdownOption[];
  className?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}

const Dropdown = ({
  field,
  label = "Select Option",
  placeholder = "Choose an option",
  options,
  className = "",
  required = false,
  onChange,
}: DropdownProps) => {
  const selectedOption = options.find((option) => option.value === field.value);

  const handleOptionSelect = (value: string) => {
    // Update the form field
    field.onChange(value);

    // Call custom onChange if provided
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <FormItem className={className}>
      <Label>
        <span>{label}</span>
        {required && <span className="text-[var(--common-error)] ml-1">*</span>}
      </Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <FormControl>
            <Button
              variant="outline"
              className="text-[var(--accesscontrol-textplaceholder)] font-size-small border-[0.5px] !rounded-lg pt-5 pb-5 !bg-[var(--accesscontrol-inputbackground)] !border-[var(--common-inputborder)] focus-visible:ring-1 focus-visible:ring-[var(--common-primarycolor)] focus-visible:border-[var(--common-primarycolor)] focus-visible:bg-[var(--accesscontrol-inputbackground)] w-full justify-between"
            >
              <span
                className={
                  selectedOption ? "text-[var(--content-textplaceholder)]" : ""
                }
              >
                {selectedOption ? selectedOption.label : placeholder}
              </span>
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-full !bg-[var(--content)] !border-[var(--common-inputborder)]"
          align="start"
        >
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              className="font-size-small text-[var(--content-textprimary)] cursor-pointer hover:bg-[var(--accesscontrol-inputbackground)]"
              onClick={() => handleOptionSelect(option.value)}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <FormMessage />
    </FormItem>
  );
};

export default Dropdown;
