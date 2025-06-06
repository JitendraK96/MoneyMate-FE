import { Checkbox as ShadcnCheckbox } from "@/components/ui/checkbox";

const Checkbox = ({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) => {
  return (
    <ShadcnCheckbox
      checked={checked}
      //   className="data-[state=checked]:bg-[var(--common-brand)] !&data-[state=checked]:text-[var(--common-white)]"
      onCheckedChange={(check) => {
        return onCheckedChange(check === true);
      }}
    />
  );
};

export default Checkbox;
