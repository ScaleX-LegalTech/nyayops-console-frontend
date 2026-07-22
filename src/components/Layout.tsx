import {
  Activity,
  Building2,
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
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";

const NAV = [
  { to: "/health", label: "Health", icon: Activity },
  { to: "/monitoring", label: "Monitoring", icon: Gavel },
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
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.label}
                      isActive={location.pathname.startsWith(item.to)}
                    >
                      <NavLink to={item.to}>
                        <item.icon />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="flex items-center justify-between px-2 py-1 group-data-[collapsible=icon]:hidden">
            <div className="text-sm">
              <div className="font-medium">{operator?.display_name}</div>
              <div className="text-xs text-muted-foreground">@{operator?.username}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={logout} tooltip="Sign out">
                <LogOut />
                <span>Sign out</span>
              </SidebarMenuButton>
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
