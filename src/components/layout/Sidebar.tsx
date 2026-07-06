import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Package, BarChart2, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
  { to: "/items", icon: Package, key: "nav.items" },
  { to: "/analytics", icon: BarChart2, key: "nav.analytics" },
  { to: "/settings", icon: Settings, key: "nav.settings" },
] as const;

export default function Sidebar() {
  const { t } = useTranslation();

  return (
    <aside className="hidden w-56 flex-shrink-0 border-r border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 md:flex md:flex-col transition-colors">
      <div className="flex h-16 items-center px-4 font-bold text-blue-600 dark:text-blue-400 text-lg tracking-wide">
        Jeaw
      </div>
      <nav className="flex flex-col gap-1 px-2 py-2">
        {navItems.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400"
                  : "text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-slate-100",
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={18}
                  className={
                    isActive
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-gray-500 dark:text-slate-500"
                  }
                />
                <span>{t(key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
