import * as React from "react";
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
  disabled?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type,
      isLoading,
      title,
      variant = "default",
      className = "",
      icon,
      onClick,
      disabled = false,
      ...props
    },
    ref
  ) => {
    // Conditional styling based on variant
    const getVariantStyles = () => {
      if (variant === "outline") {
        return "bg-transparent text-[var(--common-brand)] border border-[var(--common-brand)] hover:text-[var(--common-brand)]";
      }

      // Default styles for other variants
      return "bg-[var(--common-brand)] text-[var(--common-white)] hover:bg-[var(--common-brand)] hover:text-[var(--common-white)]";
    };

    return (
      <ShadButton
        ref={ref}
        type={type}
        onClick={onClick}
        variant={variant}
        className={`pt-[22px] pb-[22px] cursor-pointer rounded-lg font-size-small w-full ${getVariantStyles()} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="animate-spin" />}
        {icon}
        {title}
      </ShadButton>
    );
  }
);

Button.displayName = "Button";

export default Button;
