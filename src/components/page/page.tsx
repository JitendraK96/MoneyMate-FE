import { ReactNode } from "react";

const Page = ({
  title,
  subTitle,
  children,
}: {
  title: string;
  subTitle: string;
  children?: ReactNode;
}) => {
  return (
    <div className="pt-5 pr-4 pb-5 pl-4">
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
