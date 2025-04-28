import { Loader2 } from "lucide-react";
import { Button as ShadButton } from "@/components/ui/button";

interface ButtonProps {
  type: "button" | "submit" | "reset" | undefined;
  isLoading?: boolean;
  title: string;
  className?: string;
  variant?:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  icon?: React.ReactNode;
}

const Button = ({
  type,
  isLoading,
  title,
  variant = "default",
  className = "",
  icon,
}: ButtonProps) => {
  return (
    <ShadButton
      type={type}
      variant={variant}
      className={`bg-[var(--palette-button)] text-[var(--palette-text-tertiary)] pt-5 pb-5 hover:bg-[var(--palette-button-hover)] hover:text-[var(--palette-text-tertiary)] ${className}`}
    >
      {isLoading && <Loader2 className="animate-spin" />}
      {icon}
      {title}
    </ShadButton>
  );
};

export default Button;
