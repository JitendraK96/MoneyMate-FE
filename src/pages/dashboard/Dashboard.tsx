import { Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";

export default function DashboardLayout() {
  return (
    <SidebarProvider className="bg-[var(--content)]">
      <div className="flex min-h-screen w-full">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 relative">
          <Header />
          <Outlet />
        </div>
      </div>
    </SidebarProvider>
  );
}
