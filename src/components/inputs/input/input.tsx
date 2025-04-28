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
}

const Input = ({ field, placeholder, type, label }: InputProps) => {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <ShadInput
          {...field}
          type={type}
          placeholder={placeholder ? placeholder : ""}
          className="text-[var(--secondary)] font-extra-small border-[0.5px] border-[var(--primary)] focus-visible:ring-1 pt-5 pb-5"
        />
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default Input;
