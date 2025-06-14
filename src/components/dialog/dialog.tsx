import React from "react";
import {
  Dialog as ShadcnDialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DialogProps {
  isOpen: boolean;
  handleClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
  className?: string;
  isLoading?: boolean;
}

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  handleClose,
  title,
  description,
  children,
  maxWidth = "max-w-2xl",
  className = "",
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <ShadcnDialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="!bg-[var(--content)] !border-none !border-0 !outline-none !ring-0">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--common-brand)]"></div>
          </div>
        </DialogContent>
      </ShadcnDialog>
    );
  }

  return (
    <ShadcnDialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className={`!bg-[var(--content)] !border-none !border-0 !outline-none !ring-0 ${maxWidth} ${className}`}
      >
        {(title || description) && (
          <DialogHeader>
            {title && (
              <DialogTitle className="text-[var(--content-textprimary)] flex items-center gap-2 font-size-medium">
                {title}
              </DialogTitle>
            )}
            {description && (
              <DialogDescription className="text-[var(--content-textplaceholder)] font-size-extra-small">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
      </DialogContent>
    </ShadcnDialog>
  );
};

export default Dialog;
