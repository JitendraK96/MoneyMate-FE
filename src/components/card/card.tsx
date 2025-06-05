import {
  Card as ShadcnCard,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

type CardProps = {
  title: string;
  headerContent?: React.ReactNode;
  cardContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  defaultOpen?: boolean;
  collapsible?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const Card = ({
  title,
  headerContent,
  cardContent,
  footerContent,
  defaultOpen = true,
  collapsible = false,
  onOpenChange,
}: CardProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  if (!collapsible) {
    // Non-collapsible card (original behavior)
    return (
      <ShadcnCard className="bg-[var(--content-background)] border-0 gap-1 mt-5">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-[var(--content-textprimary)] card-header-title">
            {title}
          </CardTitle>
          {headerContent}
        </CardHeader>
        <CardContent className="overflow-scroll mt-6 mb-1">
          {cardContent}
        </CardContent>
        <CardFooter>{footerContent}</CardFooter>
      </ShadcnCard>
    );
  }

  // Collapsible card
  return (
    <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
      <ShadcnCard className="bg-[var(--content-background)] border-0 gap-1 mt-5">
        <CollapsibleTrigger asChild>
          <CardHeader className="flex justify-between items-center cursor-pointer hover:bg-[var(--content-hover)] transition-colors duration-200 rounded-t-lg">
            <CardTitle className="text-[var(--content-textprimary)] card-header-title">
              {title}
            </CardTitle>
            <div className="flex items-center gap-2">
              {headerContent}
              <ChevronDown
                className={`h-4 w-4 text-[var(--content-textprimary)] transition-transform duration-200 ${
                  isOpen ? "rotate-180" : "rotate-0"
                }`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-2">
          {cardContent && (
            <CardContent className="overflow-scroll mt-6 mb-6">
              {cardContent}
            </CardContent>
          )}
          {footerContent && <CardFooter>{footerContent}</CardFooter>}
        </CollapsibleContent>
      </ShadcnCard>
    </Collapsible>
  );
};

export default Card;
