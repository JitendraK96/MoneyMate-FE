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
};

const Card = ({ title, headerContent, cardContent }: CardProps) => {
  return (
    <ShadcnCard className="bg-[var(--content-background)] border-0">
      <CardHeader className="flex justify-between items-center">
        <CardTitle className="text-[var(--content-textprimary)] card-header-title">
          {title}
        </CardTitle>
        {headerContent}
      </CardHeader>
      <CardContent>{cardContent}</CardContent>
      <CardFooter></CardFooter>
    </ShadcnCard>
  );
};

export default Card;
