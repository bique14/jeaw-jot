import { Bell, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useHousehold } from "@/hooks/useHousehold";
import { useDarkMode } from "@/hooks/useDarkMode";

const LANGUAGES = ["th", "en"] as const;

export default function Header() {
  const { i18n } = useTranslation();
  const { todayCount, permission } = useNotifications();
  const { houseName } = useHousehold();
  const { dark, toggle: toggleDark } = useDarkMode();

  const toggleLanguage = () => {
    const next = i18n.language === "th" ? "en" : "th";
    i18n.changeLanguage(next);
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 transition-colors">
      <span className="font-bold text-blue-600 dark:text-blue-400 text-lg md:hidden">
        {houseName ?? "Jeaw"}
      </span>
      <span className="hidden md:block" />

      <div className="flex items-center gap-1">
        {/* Lang toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleLanguage}
          className="font-medium text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100"
        >
          {LANGUAGES.map((lang, idx) => (
            <span key={lang}>
              <span
                className={
                  i18n.language === lang
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-400 dark:text-slate-600"
                }
              >
                {lang.toUpperCase()}
              </span>
              {idx < LANGUAGES.length - 1 && (
                <span className="mx-0.5 text-gray-300 dark:text-slate-600">
                  /
                </span>
              )}
            </span>
          ))}
        </Button>

        {/* Dark mode toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDark}
          className="text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-100"
          aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </Button>

        {/* Bell */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="text-gray-500 dark:text-slate-400"
          >
            <Bell size={20} />
          </Button>
          {permission === "granted" && todayCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 pointer-events-none" />
          )}
        </div>
      </div>
    </header>
  );
}
