import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface PasswordProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any;
  placeholder?: string;
  showPassword: boolean;
  setShowPassword: (flag: boolean) => void;
  label: string;
}

const Password = ({
  field,
  placeholder,
  showPassword,
  setShowPassword,
  label,
}: PasswordProps) => {
  return (
    <FormItem>
      <FormLabel>{label}</FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            {...field}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder ? placeholder : ""}
            className="text-[var(--secondary)] font-extra-small border-[0.5px] border-[var(--primary)] focus-visible:ring-1 pt-5 pb-5"
          />
          <div
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--secondary)]"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>
      </FormControl>
      <FormMessage />
    </FormItem>
  );
};

export default Password;
