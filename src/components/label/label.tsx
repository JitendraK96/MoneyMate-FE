import { FormLabel } from "@/components/ui/form";
import React from "react";

const Label = ({ children }: { children: React.ReactNode }) => {
  return (
    <FormLabel className="text-[var(--accesscontrol-textprimary)] font-size-small">
      {children}
    </FormLabel>
  );
};

export default Label;
