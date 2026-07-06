import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export function OfflineBanner() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setOffline(true);
    const handleOnline = () => setOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="flex items-center gap-2 bg-amber-500 px-4 py-2 text-white">
      <WifiOff className="w-4 h-4 flex-shrink-0" />
      <p className="text-xs font-semibold">{t("offline.banner")}</p>
    </div>
  );
}
