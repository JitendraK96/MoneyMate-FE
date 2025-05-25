import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import { CiLight, CiDark } from "react-icons/ci";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";

const Header = () => {
  const { theme, toggleTheme } = useThemeToggle();
  const navigate = useNavigate();
  const { clearUser } = useUser();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
      alert("Failed to log out. Please try again.");
      return;
    }
    clearUser();
    navigate("/signin");
  };

  return (
    <div className="w-full h-[50px] flex justify-between items-center bg-[var(--sidebar-background)] pt-2 pr-4 pl-4 pb-2">
      <SidebarTrigger className="text-[var(--sidebar-text)]" />
      <div className="flex items-center gap-4">
        {theme === "dark" ? (
          <div
            className="p-2 bg-[var(--accesscontrol-iconbackground)] rounded-4xl cursor-pointer"
            onClick={toggleTheme}
          >
            <CiLight size={16} />
          </div>
        ) : (
          <div
            className="p-2 bg-[var(--accesscontrol-iconbackground)] rounded-4xl cursor-pointer"
            onClick={toggleTheme}
          >
            <CiDark size={16} />
          </div>
        )}
        <Avatar>
          <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
          <AvatarFallback>JK</AvatarFallback>
        </Avatar>
        <LogOut
          size={18}
          className="text-[var(--sidebar-text)]"
          onClick={handleLogout}
        />
      </div>
    </div>
  );
};

export default Header;
