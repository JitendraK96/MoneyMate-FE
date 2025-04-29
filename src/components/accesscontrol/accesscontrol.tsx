import Budget from "@/assets/videos/budget.mp4";
import Logo from "@/assets/images/f-logo-light.svg";
import { ReactNode } from "react";

interface AccessControlProps {
  children: ReactNode;
  formTitle: string;
  formSubTitle: string;
  onSubTitleNavigateTitleClick: () => void;
  subTitleNavigateTitle: string;
}

const accesscontrol = ({
  children,
  formTitle,
  formSubTitle,
  subTitleNavigateTitle,
  onSubTitleNavigateTitleClick,
}: AccessControlProps) => {
  return (
    <div className="signup flex justify-between h-full">
      <div className="hidden lg:flex basis-[50%] bg-[var(--palette-background-secondary)] pl-8 pr-8 pt-8 pb-8 relative">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src={Budget} type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-[var(--palette-background-opacity)] opacity-50" />
        <img
          src={Logo}
          alt="Logo"
          className="max-w-[200px] z-1  absolute top-10 left-10"
        />
      </div>
      <div className="basis-[100%] lg:basis-[50%] flex items-center justify-center flex-col">
        <div className="max-w-[538px]">
          <h4 className="font-size-large font-bold text-[var(--palette-text-primary)]">
            {formTitle}
          </h4>
          <h6 className="font-size-medium text-[var(--palette-text-secondary)]">
            {formSubTitle}
            <span
              className="ml-2 text-[var(--palette-primary-link)] cursor-pointer underline"
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
