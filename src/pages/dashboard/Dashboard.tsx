import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardLayout() {
  const { setUser } = useUser();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: userData, error } = await supabase.auth.getUser();

      if (error || !userData.user) {
        console.error("Error fetching user details:", error?.message);
        return;
      }

      setUser({
        id: userData.user.id,
        email: userData.user.email || "",
        fullName: userData.user.user_metadata?.full_name || "",
        isPremium: false,
      });
    };

    fetchUser();
  }, []);

  return (
    <SidebarProvider className="bg-[var(--content)]">
      <div className="flex h-screen w-full overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="relative flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          {/* <Outlet /> */}
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
