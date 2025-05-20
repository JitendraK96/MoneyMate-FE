import {
  Calendar,
  Home,
  Inbox,
  Search,
  Settings,
  ChevronRight,
} from "lucide-react";

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
    title: "Home",
    url: "#",
    icon: Home,
    subMenus: [
      {
        title: "Sub Home",
        url: "#",
        icon: Home,
      },
      {
        title: "Sub Home 1",
        url: "#",
        icon: Home,
      },
      {
        title: "Sub Home 2",
        url: "#",
        icon: Home,
      },
    ],
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
    subMenus: [
      {
        title: "Sub Home",
        url: "#",
        icon: Home,
      },
    ],
  },
  {
    title: "Calendar",
    url: "#",
    icon: Calendar,
    subMenus: [
      {
        title: "Sub Home",
        url: "#",
        icon: Home,
      },
    ],
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
    subMenus: [
      {
        title: "Sub Home",
        url: "#",
        icon: Home,
      },
    ],
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
    subMenus: [
      {
        title: "Sub Home",
        url: "#",
        icon: Home,
      },
    ],
  },
];

const Sidebar = () => {
  const { theme } = useThemeToggle();
  return (
    <ShadcnSidebar variant="floating" collapsible="icon">
      <SidebarHeader className="h-12 flex items-center">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="!p-0 hover:bg-transparent flex items-center gap-2 group-data-[collapsible=icon]:p-0!">
              <img
                src={theme === "dark" ? MobileLogoDark : MobileLogoLight}
                alt="MoneyMate"
                className="h-10 w-auto"
              />
              <span className="font-semibold text-base">MoneyMate</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <Collapsible defaultOpen className="group/collapsible">
                  <SidebarMenuItem key={item.title}>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton asChild>
                        <span>
                          <item.icon />
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                        </span>
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item?.subMenus?.map((menu) => {
                          return (
                            <CollapsibleContent>
                              <SidebarMenuSubItem>
                                <SidebarMenuButton asChild>
                                  <a href={menu.url}>{menu.title}</a>
                                </SidebarMenuButton>
                              </SidebarMenuSubItem>
                            </CollapsibleContent>
                          );
                        })}
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
