import Logo from "@/assets/images/f-logo-dark.svg";
import Main from "@/assets/images/main.webp";
import { ReactNode } from "react";

interface AccessControlProps {
  children: ReactNode;
  title: string;
  formTitle: string;
  formSubTitle: string;
  onSubTitleNavigateTitleClick: () => void;
  subTitleNavigateTitle: string;
}

const accesscontrol = ({
  children,
  title,
  formTitle,
  formSubTitle,
  subTitleNavigateTitle,
  onSubTitleNavigateTitleClick,
}: AccessControlProps) => {
  return (
    <div className="signup flex justify-between h-full">
      <div className="basis-[35%] bg-[var(--palette-background-secondary)] pl-8 pr-8 pt-8 pb-8">
        <img src={Logo} alt="Logo" className="max-w-[200px]" />
        <div className="flex flex-col items-center mt-[40px] mb-[40px]">
          <h3 className="font-size-large font-bold text-[var(--palette-text-primary)]">
            {title}
          </h3>
          <span className="font-size-small text-[var(--palette-text-secondary)]">
            Your budget companion.
          </span>
        </div>
        <img src={Main} alt="Main" className="w-full" />
      </div>
      <div className="basis-[65%] flex items-center justify-center flex-col">
        <div className="w-[40%]">
          <h4 className="font-size-medium font-bold text-[var(--palette-text-primary)]">
            {formTitle}
          </h4>
          <h6 className="font-size-small text-[var(--palette-text-secondary)]">
            {formSubTitle}
            <span
              className="ml-1 text-[var(--palette-primary-main)] cursor-pointer"
              onClick={onSubTitleNavigateTitleClick}
            >
              {subTitleNavigateTitle}
            </span>
          </h6>
          {children}
        </div>
      </div>
    </div>
  );
};

export default accesscontrol;
