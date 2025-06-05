import Label from "@/components/label";
import { Switch } from "@/components/ui/switch";

interface ToggleProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export default function Toggle({
  label,
  checked,
  onCheckedChange,
  disabled = false,
  className = "",
  required = false,
}: ToggleProps) {
  return (
    <div className={className}>
      <Label>
        {label}
        {required && <span className="text-[var(--common-error)] ml-1">*</span>}
      </Label>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={(checked) => {
          console.log(checked, "checked");
          return onCheckedChange(checked);
        }}
        className="border-[var(--common-inputborder)] mt-5"
      ></Switch>
    </div>
  );
}
