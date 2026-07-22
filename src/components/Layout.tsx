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
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { applyTheme, getStoredTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

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

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="flex w-60 shrink-0 flex-col border-r bg-card p-4">
        <div className="mb-6 text-lg font-semibold">NyayOps Console</div>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto pt-4">
          <Separator className="mb-4" />
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{operator?.display_name}</div>
              <div className="text-xs text-muted-foreground">@{operator?.username}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={logout}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
