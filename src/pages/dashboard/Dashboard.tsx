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

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, is_premium")
        .eq("id", userData.user.id)
        .single();

      if (profileError) {
        console.error("Error fetching profile:", profileError.message);
        return;
      }

      setUser({
        id: userData.user.id,
        email: userData.user.email || "",
        fullName: userData.user.user_metadata?.full_name || "",
        isPremium: profile.is_premium,
      });
    };

    fetchUser();
  }, []);

  return (
    <SidebarProvider className="bg-[var(--content)]">
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 relative min-w-0">
          <Header />
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
