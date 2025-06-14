/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormItem, FormControl, FormMessage } from "@/components/ui/form";
import Label from "@/components/label";

interface SelectOption {
  id: string;
  [key: string]: any;
}

interface GenericFormSelectProps<T extends SelectOption> {
  // Form field props
  field: any;

  // Form instance (optional)
  form?: {
    setValue: (name: string, value: string, options?: any) => void;
  };

  // Data and display props
  options: T[];
  displayKey: keyof T; // Which property to display as the label
  valueKey?: keyof T; // Which property to use as the value (defaults to 'id')

  // Label and placeholder
  label?: string;
  placeholder?: string;

  // Form field name for setValue (optional)
  fieldName?: string;

  // Additional setValue options
  setValueOptions?: {
    shouldValidate?: boolean;
    shouldDirty?: boolean;
    shouldTouch?: boolean;
  };

  // Form integration
  formInput?: boolean;
  required?: boolean;

  // Optional props
  disabled?: boolean;
  className?: string;
  onChange?: (value: string) => void;
}

export default function GenericFormSelect<T extends SelectOption>({
  field,
  form,
  options,
  displayKey,
  valueKey = "id",
  label = "Select an option",
  placeholder = "Select an option",
  fieldName,
  setValueOptions = {
    shouldValidate: true,
    shouldDirty: true,
    shouldTouch: true,
  },
  formInput = true,
  required = false,
  disabled = false,
  className = "",
  onChange,
}: GenericFormSelectProps<T>) {
  const handleValueChange = (value: string) => {
    // Update the field
    field.onChange?.(value);

    // Update form setValue if both form and fieldName are provided
    if (form && fieldName) {
      form.setValue(fieldName, value, setValueOptions);
    }

    // Call custom onChange if provided
    onChange?.(value);
  };

  // Core Select component
  const SelectCore = () => (
    <Select
      value={field.value || ""}
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger
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
          ${className}
        `}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-[var(--content-background)] border-[var(--common-inputborder)]">
        {options.map((option) => (
          <SelectItem
            key={option[valueKey] as string}
            value={option[valueKey] as string}
            className="text-[var(--content-textprimary)] hover:bg-[var(--accesscontrol-inputbackground)]"
          >
            {option[displayKey] as string}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  // Return with or without form wrapper based on formInput prop
  if (!formInput) {
    return <SelectCore />;
  }

  return (
    <FormItem>
      <Label>
        {label}
        {required && <span className="text-[var(--common-error)] ml-1">*</span>}
      </Label>

      <FormControl>
        <SelectCore />
      </FormControl>

      <FormMessage />
    </FormItem>
  );
}
