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
  className?: string;
}

const Password = ({
  field,
  placeholder,
  showPassword,
  setShowPassword,
  label,
  className,
}: PasswordProps) => {
  return (
    <FormItem>
      <FormLabel className="text-[var(--accesscontrol-textprimary)] font-size-small">
        {label}
      </FormLabel>
      <FormControl>
        <div className="relative">
          <Input
            {...field}
            type={showPassword ? "text" : "password"}
            placeholder={placeholder ? placeholder : ""}
            className={`text-[var(--accesscontrol-textplaceholder)] font-size-small border-[0.5px] border-[var(--common-inputborder)] rounded-lg focus-visible:ring-[0.5px] pt-5 pb-5 !bg-[var(--accesscontrol-inputbackground)] ${className}`}
          />
          <div
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-[var(--accesscontrol-textplaceholder)]"
          >
            {!showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </div>
        </div>
      </FormControl>
      <FormMessage className="font-size-extra-small text-[var(--common-error)]" />
    </FormItem>
  );
};

export default Password;
