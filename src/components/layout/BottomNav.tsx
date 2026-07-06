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

export default function BottomNav() {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden pointer-events-none">
      <div
        className="mx-3 mt-0 pointer-events-auto"
        style={{ paddingBottom: "max(0.55rem, env(safe-area-inset-bottom))" }}
      >
        <div
          className={cn(
            "relative overflow-hidden flex h-[64px] items-center rounded-[24px] px-2 gap-0.5",
            "border border-white/60 dark:border-white/10",
            "bg-white/35 dark:bg-slate-700/20",
            "shadow-[0_12px_38px_rgba(15,23,42,0.18)] dark:shadow-[0_18px_42px_rgba(2,6,23,0.55)]",
            "backdrop-blur-2xl [backdrop-filter:saturate(180%)_blur(20px)]",
          )}
        >
          {/* glass layers */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/65 via-white/28 to-white/12 dark:from-white/10 dark:via-white/5 dark:to-transparent" />
          <div className="pointer-events-none absolute left-3 right-3 top-0 h-px bg-white/90 dark:bg-white/25" />

          {navItems.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              className="relative z-10 flex flex-1 items-center justify-center h-full"
            >
              {({ isActive }) => (
                <div
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-[3px] rounded-2xl transition-all duration-300 w-full py-2",
                    isActive
                      ? "bg-white/70 dark:bg-white/14 text-slate-900 dark:text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_6px_18px_rgba(59,130,246,0.25)]"
                      : "text-slate-500 dark:text-slate-400 active:bg-white/35 dark:active:bg-white/10",
                  )}
                >
                  {isActive && (
                    <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/70 dark:ring-white/20" />
                  )}
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.4 : 1.9}
                    className={cn(
                      isActive && "text-blue-600 dark:text-blue-300",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] font-semibold leading-none tracking-tight",
                      isActive
                        ? "text-slate-800 dark:text-slate-100"
                        : "text-slate-600 dark:text-slate-400",
                    )}
                  >
                    {t(key)}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
