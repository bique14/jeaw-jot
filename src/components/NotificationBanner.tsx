import { useState } from "react";
import { Bell, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBanner() {
  const { t } = useTranslation();
  const { permission, requestPermission } = useNotifications();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("jeaw-notif-banner") === "1",
  );

  if (permission !== "default" || dismissed) return null;

  const handleAllow = async () => {
    await requestPermission();
    setDismissed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem("jeaw-notif-banner", "1");
    setDismissed(true);
  };

  return (
    <div className="mx-4 rounded-2xl bg-blue-50 dark:bg-blue-900/25 border border-blue-100 dark:border-blue-800/50 p-4 flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          {t("notifBanner.title")}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5 leading-relaxed">
          {t("notifBanner.desc")}
        </p>
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={handleAllow}
            className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white active:bg-blue-700 transition-colors"
          >
            {t("notifBanner.allow")}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="rounded-xl bg-blue-100 dark:bg-blue-800/40 px-4 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 active:bg-blue-200 dark:active:bg-blue-800/60 transition-colors"
          >
            {t("notifBanner.later")}
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        className="flex-shrink-0 active:opacity-60 mt-0.5"
      >
        <X className="w-4 h-4 text-blue-400" />
      </button>
    </div>
  );
}
