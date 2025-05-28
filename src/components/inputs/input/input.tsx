import { Input as ShadInput } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { forwardRef } from "react";

interface InputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field?: any;
  type?: string;
  placeholder?: string;
  label?: string;
  className?: string;
  formInput?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  min?: string;
  step?: string;
  defaultValue?: string | number;
  value?: string | number;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      field,
      placeholder,
      type,
      label,
      className,
      formInput = true,
      onChange,
      onBlur,
      onKeyDown,
      min,
      step,
      defaultValue,
      value,
      ...props
    },
    ref
  ) => {
    // Properly handle field props and custom handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Call field onChange first (for React Hook Form)
      if (field?.onChange) {
        field.onChange(e);
      }
      // Then call custom onChange if provided
      if (onChange) {
        onChange(e);
      }
    };

    const handleBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Call field onBlur first (for React Hook Form)
      if (field?.onBlur) {
        field.onBlur(e);
      }
      // Then call custom onBlur if provided
      if (onBlur) {
        onBlur(e);
      }
    };

    const inputProps = {
      ...field,
      type,
      placeholder: placeholder || "",
      onChange: handleChange,
      onBlur: handleBlur,
      onKeyDown,
      min,
      step,
      ref,
      ...props,
      ...(value !== undefined ? { value } : {}),
      ...(defaultValue !== undefined ? { defaultValue } : {}),
    };

    const inputClassName = `text-[var(--accesscontrol-textplaceholder)] font-size-small border-[0.5px] border-[var(--common-inputborder)] rounded-lg focus-visible:ring-[0.5px] pt-5 pb-5 !bg-[var(--accesscontrol-inputbackground)] ${
      className || ""
    }`;

    return (
      <>
        {formInput ? (
          <FormItem>
            <FormLabel className="text-[var(--accesscontrol-textprimary)] font-size-small">
              {label}
            </FormLabel>
            <FormControl>
              <ShadInput {...inputProps} className={inputClassName} />
            </FormControl>
            <FormMessage className="font-size-extra-small text-[var(--common-error)]" />
          </FormItem>
        ) : (
          <ShadInput {...inputProps} className={inputClassName} />
        )}
      </>
    );
  }
);

Input.displayName = "Input";

export default Input;
