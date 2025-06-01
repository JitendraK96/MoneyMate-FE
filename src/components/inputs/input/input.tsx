import { Input as ShadInput } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormControl, FormItem, FormMessage } from "@/components/ui/form";
import { forwardRef } from "react";
import Label from "@/components/label";

interface InputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field?: any;
  type?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  className?: string;
  formInput?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onTextAreaChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTextAreaBlur?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTextAreaKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  min?: string;
  step?: string;
  defaultValue?: string | number;
  value?: string | number;
  rows?: number;
}

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  (
    {
      field,
      placeholder,
      type,
      label,
      required = false,
      className,
      formInput = true,
      onChange,
      onBlur,
      onKeyDown,
      onTextAreaChange,
      onTextAreaBlur,
      onTextAreaKeyDown,
      min,
      step,
      defaultValue,
      value,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const isTextarea = type === "textarea";

    // Properly handle field props and custom handlers for Input
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Call field onChange first (for React Hook Form)
      if (field?.onChange) {
        field.onChange(e);
      }
      // Then call custom onChange if provided
      if (onChange) {
        onChange(e);
      }
    };

    const handleInputBlur = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Call field onBlur first (for React Hook Form)
      if (field?.onBlur) {
        field.onBlur(e);
      }
      // Then call custom onBlur if provided
      if (onBlur) {
        onBlur(e);
      }
    };

    const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (onKeyDown) {
        onKeyDown(e);
      }
    };

    // Properly handle field props and custom handlers for Textarea
    const handleTextAreaChange = (
      e: React.ChangeEvent<HTMLTextAreaElement>
    ) => {
      // Call field onChange first (for React Hook Form)
      if (field?.onChange) {
        field.onChange(e);
      }
      // Then call custom onChange if provided
      if (onTextAreaChange) {
        onTextAreaChange(e);
      }
    };

    const handleTextAreaBlur = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Call field onBlur first (for React Hook Form)
      if (field?.onBlur) {
        field.onBlur(e);
      }
      // Then call custom onBlur if provided
      if (onTextAreaBlur) {
        onTextAreaBlur(e);
      }
    };

    const handleTextAreaKeyDown = (
      e: React.KeyboardEvent<HTMLTextAreaElement>
    ) => {
      if (onTextAreaKeyDown) {
        onTextAreaKeyDown(e);
      }
    };

    const baseProps = {
      ...field,
      placeholder: placeholder || "",
      ref,
      ...props,
      ...(value !== undefined ? { value } : {}),
      ...(defaultValue !== undefined ? { defaultValue } : {}),
    };

    const inputProps = {
      ...baseProps,
      type,
      min,
      step,
      onChange: handleInputChange,
      onBlur: handleInputBlur,
      onKeyDown: handleInputKeyDown,
    };

    const textareaProps = {
      ...baseProps,
      rows,
      onChange: handleTextAreaChange,
      onBlur: handleTextAreaBlur,
      onKeyDown: handleTextAreaKeyDown,
    };

    const inputClassName = `text-[var(--content-textplaceholder)] font-size-small border-[0.5px] border-[var(--common-inputborder)] rounded-lg focus-visible:ring-[0.5px] pt-5 pb-5 !bg-[var(--accesscontrol-inputbackground)] ${
      className || ""
    }`;

    return (
      <>
        {formInput ? (
          <FormItem>
            <Label>
              <span>{label}</span>
              {required && (
                <span className="text-[var(--common-error)] ml-1">*</span>
              )}
            </Label>
            <FormControl>
              {isTextarea ? (
                <Textarea {...textareaProps} className={inputClassName} />
              ) : (
                <ShadInput {...inputProps} className={inputClassName} />
              )}
            </FormControl>
            <FormMessage className="font-size-extra-small text-[var(--common-error)]" />
          </FormItem>
        ) : (
          <>
            {isTextarea ? (
              <Textarea {...textareaProps} className={inputClassName} />
            ) : (
              <ShadInput {...inputProps} className={inputClassName} />
            )}
          </>
        )}
      </>
    );
  }
);

Input.displayName = "Input";

export default Input;
