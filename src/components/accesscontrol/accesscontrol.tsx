import Budget from "@/assets/videos/budget.mp4";
import Logo from "@/assets/images/f-logo-light.svg";
import { ReactNode, useState, useEffect } from "react";
import { CiLight, CiDark } from "react-icons/ci";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import MobileLogoDark from "@/assets/images/f-m-logo-dark.svg";
import MobileLogoLight from "@/assets/images/f-m-logo-light.svg";

interface AccessControlProps {
  children: ReactNode;
  formTitle: string;
  formSubTitle: string;
  onSubTitleNavigateTitleClick: () => void;
  subTitleNavigateTitle: string;
}

const Accesscontrol = ({
  children,
  formTitle,
  formSubTitle,
  subTitleNavigateTitle,
  onSubTitleNavigateTitleClick,
}: AccessControlProps) => {
  const { theme, toggleTheme } = useThemeToggle();
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 900);

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 900);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="signup flex justify-between h-full">
      <div className="hidden lg:flex basis-[50%] pl-8 pr-8 pt-8 pb-8 relative">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute top-0 left-0 w-full h-full object-cover"
        >
          <source src={Budget} type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-[var(--common-backgroundopacity)] opacity-50" />
        <img
          src={Logo}
          alt="Logo"
          className="max-w-[200px] z-1 absolute top-10 left-10"
        />
      </div>
      <div className="basis-[100%] lg:basis-[50%] flex items-center justify-center flex-col">
        <div className="max-w-[538px]">
          <div className="flex justify-between items-center mb-5">
            <img
              src={theme === "dark" ? MobileLogoDark : MobileLogoLight}
              alt="MoneyMate"
              className={isMobileView ? "visible" : "invisible"}
            />
            {theme === "dark" ? (
              <div
                className="p-4 bg-[var(--accesscontrol-iconbackground)] rounded-4xl cursor-pointer"
                onClick={toggleTheme}
              >
                <CiLight size={20} />
              </div>
            ) : (
              <div
                className="p-4 bg-[var(--accesscontrol-iconbackground)] rounded-4xl cursor-pointer"
                onClick={toggleTheme}
              >
                <CiDark size={20} />
              </div>
            )}
          </div>
          <h4 className="font-size-large font-semibold text-[var(--accesscontrol-textprimary)]">
            {formTitle}
          </h4>
          <h6 className="font-size-medium text-[var(--accesscontrol-textsecondary)]">
            {formSubTitle}
            <span
              className="ml-2 text-[var(--common-link)] cursor-pointer underline"
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

export default Accesscontrol;
