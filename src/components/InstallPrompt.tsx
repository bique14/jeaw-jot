import { useState, useEffect } from "react";
import { Share, X } from "lucide-react";
import { useTranslation } from "react-i18next";

// ตรวจว่าเป็น iOS Safari หรือเปล่า
function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

// ตรวจว่ายัง install (standalone) แล้วหรือยัง
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

export function InstallPrompt() {
  const { t, i18n } = useTranslation();
  const isEN = i18n.language !== 'th';
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIOS() || isStandalone()) return;
    const dismissed = localStorage.getItem("jeaw-install-dismissed");
    if (dismissed) return;
    // แสดงหลัง 3 วินาที
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const handleDismiss = () => {
    localStorage.setItem("jeaw-install-dismissed", "1");
    setShow(false);
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl bg-gray-900 p-4 shadow-2xl">
      <button
        type="button"
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-gray-400 active:opacity-70"
      >
        <X className="w-4 h-4" />
      </button>
      <p className="text-sm font-semibold text-white">
        {t('install.title')}
      </p>
      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
        {isEN ? (
          <>Tap{" "}<span className="inline-flex items-center gap-0.5 text-blue-400 font-medium"><Share className="w-3.5 h-3.5" /> Share</span>{" "}then{" "}<span className="text-white font-medium">&quot;Add to Home Screen&quot;</span></>
        ) : (
          <>แตะ{" "}<span className="inline-flex items-center gap-0.5 text-blue-400 font-medium"><Share className="w-3.5 h-3.5" />Share</span>{" "}แล้วเลือก{" "}<span className="text-white font-medium">&quot;Add to Home Screen&quot;</span></>
        )}
      </p>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleDismiss}
          className="text-xs text-gray-500 active:opacity-70"
        >
          {t('install.dismiss')}
        </button>
      </div>
    </div>
  );
}
