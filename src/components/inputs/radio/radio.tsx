import { Label as ShadcnLabel } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Label from "@/components/label";

interface RadioOption {
  value: string;
  label: string;
  id?: string;
}

interface GenericRadioGroupProps {
  options: RadioOption[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  className?: string;
  disabled?: boolean;
  label: string;
}

export default function GenericRadioGroup({
  options,
  defaultValue,
  value,
  onValueChange,
  name,
  className,
  disabled = false,
  label,
}: GenericRadioGroupProps) {
  return (
    <div>
      <Label>{label}</Label>
      <RadioGroup
        defaultValue={defaultValue}
        value={value}
        onValueChange={onValueChange}
        name={name}
        className={className}
        disabled={disabled}
      >
        {options.map((option, index) => {
          const radioId = option.id || `radio-${option.value}-${index}`;

          return (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={option.value}
                id={radioId}
                disabled={disabled}
              />
              <ShadcnLabel
                htmlFor={radioId}
                className={disabled ? "opacity-50" : ""}
              >
                {option.label}
              </ShadcnLabel>
            </div>
          );
        })}
      </RadioGroup>
    </div>
  );
}
