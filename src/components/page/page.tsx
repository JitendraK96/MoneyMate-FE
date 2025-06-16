import { ReactNode } from "react";
import Breadcrumb from "@/components/breadcrumb";

interface Route {
  name: string;
  to?: string;
}

const Page = ({
  title,
  subTitle,
  children,
  breadcrumbs,
}: {
  title: string;
  subTitle: string;
  children?: ReactNode;
  breadcrumbs?: Route[];
}) => {
  return (
    <div className="pt-5 pr-4 pb-5 pl-4">
      {breadcrumbs && <Breadcrumb breadcrumbs={breadcrumbs} />}

      <h1 className="content-header-title text-[var(--content-textprimary)]">
        {title}
      </h1>
      <p className="content-header-subtitle text-[var(--content-textsecondary)]">
        {subTitle}
      </p>
      {children}
    </div>
  );
};

export default Page;
