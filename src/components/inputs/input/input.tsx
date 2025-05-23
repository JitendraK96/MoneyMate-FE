import { Input as ShadInput } from "@/components/ui/input";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface InputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any;
  type?: string;
  placeholder?: string;
  label: string;
  className?: string;
}

const Input = ({ field, placeholder, type, label, className }: InputProps) => {
  return (
    <FormItem>
      <FormLabel className="text-[var(--accesscontrol-textprimary)] font-size-small">
        {label}
      </FormLabel>
      <FormControl>
        <ShadInput
          {...field}
          type={type}
          placeholder={placeholder ? placeholder : ""}
          className={`text-[var(--accesscontrol-textplaceholder)] font-size-small border-[0.5px] border-[var(--common-inputborder)] rounded-lg focus-visible:ring-[0.5px] pt-5 pb-5 !bg-[var(--accesscontrol-inputbackground)] ${className}`}
        />
      </FormControl>
      <FormMessage className="font-size-extra-small text-[var(--common-error)]" />
    </FormItem>
  );
};

export default Input;
