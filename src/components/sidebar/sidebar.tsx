import {
  NotebookPen,
  LayoutDashboard,
  Search,
  ChevronRight,
  Wallet,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useThemeToggle } from "@/hooks/useThemeToggle";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import MobileLogoDark from "@/assets/images/f-m-logo-dark.svg";
import MobileLogoLight from "@/assets/images/f-m-logo-light.svg";

const items = [
  {
    title: "Dashboard",
    url: "#",
    icon: LayoutDashboard,
    subMenus: [
      {
        title: "Overview",
        url: "/dashboard/overview",
      },
    ],
  },
  {
    title: "Planning",
    url: "#",
    icon: NotebookPen,
    subMenus: [
      {
        title: "Goals",
        url: "/dashboard/goals",
      },
    ],
  },
  {
    title: "Finance",
    url: "#",
    icon: Wallet,
    subMenus: [
      {
        title: "EMI Tracker",
        url: "/dashboard/emitracker",
      },
    ],
  },
  {
    title: "Tools",
    url: "#",
    icon: Search,
    subMenus: [
      {
        title: "Reminders",
        url: "/dashboard/reminders",
      },
    ],
  },
];

const Sidebar = () => {
  const { theme } = useThemeToggle();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <ShadcnSidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-12 flex items-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="!p-0 hover:bg-transparent flex items-center gap-2 group-data-[collapsible=icon]:p-0!">
              <img
                src={theme === "dark" ? MobileLogoDark : MobileLogoLight}
                alt="MoneyMate"
                className="h-10 w-auto"
              />
              <span className="font-semibold font-size-medium text-[var(--sidebar-text)]">
                moneymate
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[var(--sidebar-text)] opacity-50">
            Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <Collapsible
                  defaultOpen
                  className="group/collapsible"
                  key={item.title}
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger
                      asChild
                      className="!hover:bg-transparent !focus:bg-transparent !bg-transparent"
                    >
                      <SidebarMenuButton asChild>
                        <span>
                          <item.icon strokeWidth={1} />
                          <span className="text-[var(--sidebar-text)]">
                            {item.title}
                          </span>
                          <ChevronRight
                            strokeWidth={1.5}
                            className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90"
                          />
                        </span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item?.subMenus?.map((menu) => (
                          <CollapsibleContent key={menu.title}>
                            <SidebarMenuSubItem>
                              <SidebarMenuButton
                                asChild
                                isActive={
                                  currentPath === menu.url ||
                                  (menu.url === "/dashboard/overview" &&
                                    currentPath === "/dashboard")
                                }
                              >
                                <Link
                                  to={menu.url}
                                  className="text-[var(--sidebar-text)] font-size-small"
                                >
                                  {menu.title}
                                </Link>
                              </SidebarMenuButton>
                            </SidebarMenuSubItem>
                          </CollapsibleContent>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </ShadcnSidebar>
  );
};

export default Sidebar;
