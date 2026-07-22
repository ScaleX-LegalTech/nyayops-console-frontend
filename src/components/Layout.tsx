import {
  Activity,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  ClipboardList,
  Gavel,
  History,
  LogOut,
  Moon,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

// Health/Monitoring both break down by service (Main = backend, CDE = the scraper
// service) - nested here so the sidebar itself can jump straight to a service's
// section instead of only the page defaulting to "first section open".
const SERVICE_CHILDREN = [
  { service: "backend", label: "Main" },
  { service: "cde", label: "CDE" },
];

const NAV = [
  { to: "/health", label: "Health", icon: Activity, children: SERVICE_CHILDREN },
  { to: "/monitoring", label: "Monitoring", icon: Gavel, children: SERVICE_CHILDREN },
  { to: "/tenants", label: "Tenants", icon: Building2 },
  { to: "/cause-lists/review", label: "Cause-List Review", icon: ClipboardList },
  { to: "/cause-lists/fetch-history", label: "Fetch History", icon: History },
  { to: "/bench-configs", label: "Bench Configs", icon: Gavel },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Layout() {
  const { operator, logout } = useAuth();
  const [theme, setTheme] = useState<Theme>(getStoredTheme());
  const location = useLocation();

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <div className="px-2 py-1 text-lg font-semibold group-data-[collapsible=icon]:hidden">
            NyayOps Console
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => {
                  const onPage = location.pathname.startsWith(item.to);
                  const activeService = onPage ? new URLSearchParams(location.search).get("service") : null;

                  if (!item.children) {
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton asChild tooltip={item.label} isActive={onPage}>
                          <NavLink to={item.to}>
                            <item.icon />
                            <span>{item.label}</span>
                          </NavLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <Collapsible key={item.to} defaultOpen={onPage} className="group/collapsible">
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.label} isActive={onPage && !activeService}>
                            <item.icon />
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.children.map((child) => (
                              <SidebarMenuSubItem key={child.service}>
                                <SidebarMenuSubButton asChild isActive={onPage && activeService === child.service}>
                                  <NavLink to={`${item.to}?service=${child.service}`}>
                                    <span>{child.label}</span>
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton size="lg">
                    <div className="flex flex-col text-left leading-tight">
                      <span className="truncate text-sm font-medium">{operator?.display_name}</span>
                      <span className="truncate text-xs text-muted-foreground">@{operator?.username}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width)">
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === "dark" ? <Sun /> : <Moon />}
                    {theme === "dark" ? "Light mode" : "Dark mode"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={logout}>
                    <LogOut />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <main className="flex-1 overflow-x-auto p-8">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
