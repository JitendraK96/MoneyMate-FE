import { Loader2 } from "lucide-react";
import { Button as ShadButton } from "@/components/ui/button";

interface ButtonProps {
  type: "button" | "submit" | "reset" | undefined;
  isLoading?: boolean;
  title: string | React.ReactNode;
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
  onClick?: () => void;
}

const Button = ({
  type,
  isLoading,
  title,
  variant = "default",
  className = "",
  icon,
  onClick,
}: ButtonProps) => {
  return (
    <ShadButton
      type={type}
      onClick={onClick}
      variant={variant}
      className={`bg-[var(--palette-button)] text-[var(--palette-button-text)] pt-[22px] pb-[22px] cursor-pointer rounded-lg font-size-small hover:bg-[var(--palette-button)] hover:text-[var(--palette-button-text)] border-0 w-full ${className}`}
    >
      {isLoading && <Loader2 className="animate-spin" />}
      {icon}
      {title}
    </ShadButton>
  );
};

export default Button;
