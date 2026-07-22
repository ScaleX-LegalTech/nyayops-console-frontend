import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

const NAV = [
  { to: "/health", label: "Health" },
  { to: "/monitoring", label: "Monitoring" },
  { to: "/tenants", label: "Tenants" },
  { to: "/cause-lists/review", label: "Cause-List Review" },
  { to: "/cause-lists/fetch-history", label: "Fetch History" },
  { to: "/bench-configs", label: "Bench Configs" },
  { to: "/settings", label: "Settings" },
];

export function Layout() {
  const { operator, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <aside className="w-56 shrink-0 border-r border-slate-200 bg-white min-h-screen p-4">
          <div className="font-semibold text-lg mb-6">NyayOps Console</div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded px-3 py-2 text-sm ${
                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-8 border-t border-slate-200 pt-4 text-sm text-slate-500">
            <div>{operator?.display_name}</div>
            <button className="mt-2 text-slate-400 hover:text-slate-700" onClick={logout}>
              Sign out
            </button>
          </div>
        </aside>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
