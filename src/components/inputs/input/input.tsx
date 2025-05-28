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
    // Handle value vs defaultValue properly
    const inputProps = {
      ...field,
      type,
      placeholder: placeholder || "",
      onChange,
      onBlur,
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
