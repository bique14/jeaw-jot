import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Bell,
  ChevronRight,
  Copy,
  Home,
  LogOut,
  Tag,
  Upload,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import { useHousehold } from "@/hooks/useHousehold";
import { useNotifications } from "@/hooks/useNotifications";
import { clearHousehold, saveHouseName } from "@/lib/pin";
import { getItemsOnce, addItem } from "@/services/items";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import type { ProductItem } from "@/types";

const NOTIFY_OPTIONS = [1, 3, 5, 7, 14, 30];

export default function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { householdId, houseName } = useHousehold();
  const { permission, requestPermission, fcmReady } = useNotifications();

  const [defaultNotifyDays, setDefaultNotifyDays] = useState<number>(() =>
    Number(localStorage.getItem("jeaw-default-notify-days") ?? "7"),
  );
  const [houseNameInput, setHouseNameInput] = useState(houseName ?? "");
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<ProductItem[] | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNotifyDaysChange = (days: number) => {
    setDefaultNotifyDays(days);
    localStorage.setItem("jeaw-default-notify-days", String(days));
  };

  const handleSaveHouseName = () => {
    const trimmed = houseNameInput.trim();
    if (trimmed.length < 2 || trimmed.length > 30) return;
    saveHouseName(trimmed);
    toast.success(t("action.save"));
  };

  const handleCopyHouseholdId = async () => {
    if (!householdId) return;
    try {
      await navigator.clipboard.writeText(householdId);
      toast.success(t("toast.householdIdCopied"));
    } catch {
      toast.error(t("error.generic"));
    }
  };

  const handleLeaveHousehold = () => {
    clearHousehold();
    navigate("/setup", { replace: true });
  };

  const handleExport = async () => {
    if (!householdId) return;
    try {
      const items = await getItemsOnce(householdId);
      const exportData = {
        version: 1,
        householdId,
        exportedAt: new Date().toISOString(),
        items: items.map((item) => ({
          ...item,
          purchaseDate: item.purchaseDate.toDate().toISOString(),
          startDate: item.startDate.toDate().toISOString(),
          expiryDate: item.expiryDate.toDate().toISOString(),
          createdAt: item.createdAt?.toDate().toISOString(),
          updatedAt: item.updatedAt?.toDate().toISOString(),
        })),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `jeaw-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("toast.exported"));
    } catch {
      toast.error(t("toast.importError"));
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const json = JSON.parse(ev.target?.result as string);
        if (!json.items || !Array.isArray(json.items))
          throw new Error("invalid");
        setPendingImport(json.items as ProductItem[]);
        setShowImportConfirm(true);
      } catch {
        toast.error(t("toast.importError"));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportConfirm = async () => {
    if (!pendingImport || !householdId) return;
    setShowImportConfirm(false);
    let count = 0;
    for (const item of pendingImport) {
      try {
        await addItem({
          householdId,
          name: item.name,
          brand: item.brand,
          categoryId: item.categoryId,
          purchaseDate: new Date(item.purchaseDate as unknown as string),
          startDate: new Date(item.startDate as unknown as string),
          expiryDate: new Date(item.expiryDate as unknown as string),
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
          notifyDaysBefore: item.notifyDaysBefore,
          createdByPin: item.createdByPin,
        });
        count++;
      } catch {
        // skip invalid
      }
    }
    setPendingImport(null);
    toast.success(t("toast.imported", { count }));
  };

  const notifyStatusText = (() => {
    if (permission === "granted")
      return fcmReady ? t("settings.notifyOnBg") : t("settings.notifyOn");
    if (permission === "denied") return t("settings.notifyBlocked");
    return t("settings.notifyOff");
  })();

  return (
    <div className="flex flex-col px-4 pt-5 pb-8 gap-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
        {t("settings.title")}
      </h1>

      {/* General */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
          {t("settings.general")}
        </p>
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-slate-700/50">
          {/* House name */}
          <div className="flex items-start gap-3 px-4 py-3.5">
            <Home size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 mb-1.5 dark:text-slate-100">
                {t("settings.houseName")}
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={houseNameInput}
                  onChange={(e) => setHouseNameInput(e.target.value)}
                  placeholder={t("settings.houseNamePlaceholder")}
                  maxLength={30}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 dark:text-slate-100 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
                />
                <button
                  type="button"
                  onClick={handleSaveHouseName}
                  disabled={houseNameInput.trim().length < 2}
                  className="rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40 active:bg-blue-700 transition-colors"
                >
                  {t("action.save")}
                </button>
              </div>
            </div>
          </div>

          {/* Household ID */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                {t("settings.householdId")}
              </p>
              <p className="text-xs text-gray-400 font-mono mt-0.5 break-all">
                {householdId}
              </p>
            </div>
            <button
              type="button"
              onClick={handleCopyHouseholdId}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 px-2.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-slate-200 active:bg-gray-100 dark:active:bg-slate-600 transition-colors"
            >
              <Copy size={13} />
              {t("settings.copy")}
            </button>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
          {t("settings.notifications")}
        </p>
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-slate-700/50">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Bell size={18} className="text-blue-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-slate-100">
                {t("settings.pushNotifications")}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{notifyStatusText}</p>
            </div>
            {permission === "default" && (
              <button
                type="button"
                onClick={requestPermission}
                className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white active:bg-blue-700 transition-colors"
              >
                {t("settings.notifyEnable")}
              </button>
            )}
            {permission === "granted" && (
              <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                ✓
              </span>
            )}
          </div>

          <div className="px-4 py-3.5">
            <p className="text-sm font-medium text-gray-900 mb-2 dark:text-slate-100">
              {t("settings.notifyDaysLabel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {NOTIFY_OPTIONS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleNotifyDaysChange(days)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                    defaultNotifyDays === days
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 active:bg-gray-200 dark:active:bg-slate-600"
                  }`}
                >
                  {days} {t("settings.notifyDaysUnit")}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {t("settings.notifyDaysHint")}
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
          {t("settings.categories")}
        </p>
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => navigate("/settings/categories")}
            className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-slate-700 transition-colors"
          >
            <Tag size={18} className="text-blue-500 dark:text-blue-400" />
            <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-slate-100">
              {t("settings.manageCategories")}
            </span>
            <ChevronRight
              size={16}
              className="text-gray-300 dark:text-slate-500"
            />
          </button>
        </div>
      </section>

      {/* Data */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-2">
          {t("settings.data")}
        </p>
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden divide-y divide-gray-50 dark:divide-slate-700/50">
          <button
            type="button"
            onClick={handleExport}
            className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-slate-700 transition-colors"
          >
            <Download size={18} className="text-blue-500 dark:text-blue-400" />
            <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-slate-100">
              {t("settings.exportJson")}
            </span>
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-gray-50 dark:active:bg-slate-700 transition-colors"
          >
            <Upload size={18} className="text-blue-500 dark:text-blue-400" />
            <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-slate-100">
              {t("settings.importJson")}
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />
        </div>
      </section>

      {/* Danger zone */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wider text-red-400 mb-2">
          {t("settings.danger")}
        </p>
        <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowLeaveConfirm(true)}
            className="flex w-full items-center gap-3 px-4 py-3.5 active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
          >
            <LogOut size={18} className="text-red-500 dark:text-red-400" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {t("settings.leaveHousehold")}
              </p>
              <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                {t("settings.leaveHouseholdDesc")}
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* Leave confirm */}
      <ConfirmDialog
        open={showLeaveConfirm}
        title={t("confirm.leaveHousehold")}
        message={t("confirm.leaveHouseholdDesc")}
        confirmLabel={t("settings.leaveHousehold")}
        destructive
        onConfirm={handleLeaveHousehold}
        onCancel={() => setShowLeaveConfirm(false)}
      />

      {/* Import confirm */}
      <ConfirmDialog
        open={showImportConfirm}
        title={t("confirm.importData")}
        message={t("confirm.importDataDesc")}
        onConfirm={handleImportConfirm}
        onCancel={() => {
          setShowImportConfirm(false);
          setPendingImport(null);
        }}
      />
    </div>
  );
}
