import {
  Card as ShadcnCard,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type CardProps = {
  title: string;
  headerContent?: React.ReactNode;
  cardContent?: React.ReactNode;
  footerContent?: React.ReactNode;
};

const Card = ({
  title,
  headerContent,
  cardContent,
  footerContent,
}: CardProps) => {
  return (
    <ShadcnCard className="bg-[var(--content-background)] border-0 gap-1 mt-5">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-[var(--content-textprimary)] card-header-title">
          {title}
        </CardTitle>
        {headerContent}
      </CardHeader>
      <CardContent className="overflow-scroll mt-6 mb-6">
        {cardContent}
      </CardContent>
      <CardFooter>{footerContent}</CardFooter>
    </ShadcnCard>
  );
};

export default Card;
