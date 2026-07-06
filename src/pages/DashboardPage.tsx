import { useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { format, isBefore } from "date-fns";
import { th } from "date-fns/locale";
import {
  Package,
  AlertTriangle,
  XCircle,
  Wallet,
  ChevronRight,
  CalendarClock,
  Plus,
  ShoppingBag,
} from "lucide-react";
import { useItems } from "@/hooks/useItems";
import { useCategories } from "@/hooks/useCategories";
import { useHousehold } from "@/hooks/useHousehold";
import { checkAndNotify } from "@/services/notifications";
import { NotificationBanner } from "@/components/NotificationBanner";
import {
  computeStatus,
  daysUntilExpiry,
  isExpiringSoon,
  toDate,
} from "@/lib/itemUtils";

function getDayLabel(
  days: number,
  t: (key: string, opts?: Record<string, unknown>) => string,
) {
  if (days < 0)
    return {
      text: t("dashboard.expiredDays", { count: Math.abs(days) }),
      urgent: true,
    };
  if (days === 0) return { text: t("dashboard.expiresToday"), urgent: true };
  if (days === 1) return { text: t("dashboard.expiresTomorrow"), urgent: true };
  return { text: t("dashboard.expiresInDays", { count: days }), urgent: false };
}

export default function DashboardPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { items, loading } = useItems();
  const { categories } = useCategories();
  const { householdId } = useHousehold();
  const locale = i18n.language === "th" ? th : undefined;
  const today = useMemo(() => new Date(), []);
  const notifyCheckedRef = useRef(false);

  // ตรวจสอบและส่ง notification สำหรับ items ที่ใกล้หมดอายุ (ครั้งแรกที่ items โหลดเสร็จ + tab focus)
  useEffect(() => {
    if (loading || !householdId || notifyCheckedRef.current) return;
    notifyCheckedRef.current = true;
    checkAndNotify(items, householdId).catch(console.error);
  }, [loading, householdId, items]);

  useEffect(() => {
    const handleFocus = () => {
      if (householdId && items.length > 0) {
        checkAndNotify(items, householdId).catch(console.error);
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [householdId, items]);

  const stats = useMemo(() => {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const activeItems = items.filter((i) => computeStatus(i) !== "depleted");
    const expiringSoon = activeItems.filter(
      (i) => computeStatus(i) === "active" && isExpiringSoon(i),
    );
    const expired = items.filter((i) => computeStatus(i) === "expired");
    const monthlySpend = items
      .filter((i) => !isBefore(toDate(i.purchaseDate), startOfMonth))
      .reduce((sum, i) => sum + i.price * i.quantity, 0);
    return {
      total: activeItems.length,
      expiringSoon: expiringSoon.length,
      expired: expired.length,
      monthlySpend,
    };
  }, [items, today]);

  const expiringSoonItems = useMemo(
    () =>
      items
        .filter((i) => computeStatus(i) === "active" && isExpiringSoon(i))
        .sort((a, b) => daysUntilExpiry(a) - daysUntilExpiry(b)),
    [items],
  );

  const ganttItems = useMemo(() => {
    return items
      .filter((item) => {
        const s = computeStatus(item);
        if (s === "depleted") return false;
        const days = daysUntilExpiry(item);
        return days >= -1 && days <= 30;
      })
      .sort((a, b) => daysUntilExpiry(a) - daysUntilExpiry(b))
      .slice(0, 12);
  }, [items]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      if (computeStatus(item) !== "depleted") {
        counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1;
      }
    });
    return counts;
  }, [items]);

  const activeCategories = categories.filter((c) => categoryCounts[c.id] > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-400 dark:text-slate-500">
        <span className="animate-pulse">{t("common.loading")}</span>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 text-blue-300" />
        </div>
        <div>
          <p className="font-semibold text-gray-700 dark:text-slate-300">
            {t("dashboard.noItems")}
          </p>
          <p className="text-sm text-gray-400 dark:text-slate-400 mt-1">
            {t("dashboard.noItemsDesc")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/items/new")}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-200 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t("dashboard.addItem")}
        </button>
      </div>
    );
  }

  const greetingDate = format(today, "EEEE d MMMM", { locale });

  return (
    <div className="flex flex-col gap-6 pb-10 bg-gray-50 dark:bg-slate-900 min-h-full">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 px-5 pt-6 pb-10">
        <p className="text-blue-200 text-xs font-medium capitalize">
          {greetingDate}
        </p>
        <h1 className="text-white text-2xl font-bold mt-0.5">
          {t("dashboard.title")}
        </h1>
        {stats.expiringSoon > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-white text-xs font-medium">
              {t("dashboard.expiringAlert", { count: stats.expiringSoon })}
            </span>
          </div>
        )}
      </div>

      {/* Stats cards — overlap hero */}
      <div className="mx-4 grid grid-cols-2 gap-3">
        <StatCard
          icon={<Package className="w-5 h-5" />}
          label={t("dashboard.totalItems")}
          value={stats.total}
          iconBg="bg-blue-100"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label={t("dashboard.expiringSoon")}
          value={stats.expiringSoon}
          iconBg="bg-amber-100"
          iconColor="text-amber-500"
          badge={stats.expiringSoon > 0}
          onClick={() => navigate("/items")}
        />
        <StatCard
          icon={<XCircle className="w-5 h-5" />}
          label={t("dashboard.expired")}
          value={stats.expired}
          iconBg="bg-red-100"
          iconColor="text-red-500 dark:text-red-400 dark:text-red-500"
          badge={stats.expired > 0}
          onClick={() => navigate("/items")}
        />
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label={t("dashboard.monthlySpend")}
          value={`฿${stats.monthlySpend.toLocaleString()}`}
          iconBg="bg-green-100"
          iconColor="text-green-600 dark:text-green-400"
        />
      </div>

      {/* Notification permission banner */}
      <NotificationBanner />

      {/* Expiring soon horizontal scroll */}
      {expiringSoonItems.length > 0 && (
        <section className="px-4">
          <SectionHeader
            title={t("dashboard.expiringSection")}
            onMore={() => navigate("/items")}
            moreLabel={t("dashboard.viewAll")}
          />
          <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none">
            {expiringSoonItems.slice(0, 10).map((item) => {
              const days = daysUntilExpiry(item);
              const { text, urgent } = getDayLabel(days, t);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/items/${item.id}`)}
                  className="flex-shrink-0 w-40 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm text-left active:scale-95 transition-all border border-gray-100 dark:border-slate-700/50"
                >
                  <div
                    className={`w-8 h-1 rounded-full mb-3 ${urgent ? "bg-red-400" : "bg-amber-400"}`}
                  />
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate leading-tight">
                    {item.name}
                  </p>
                  {item.brand && (
                    <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">
                      {item.brand}
                    </p>
                  )}
                  <p
                    className={`mt-3 text-xs font-bold ${urgent ? "text-red-500 dark:text-red-400 dark:text-red-500" : "text-amber-500"}`}
                  >
                    {text}
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Category chips */}
      {activeCategories.length > 0 && (
        <section className="px-4">
          <SectionHeader title={t("dashboard.categoriesSection")} />
          <div className="flex flex-wrap gap-2">
            {activeCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => navigate("/items")}
                className="flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition-all active:scale-95"
                style={{
                  borderColor: cat.color + "40",
                  backgroundColor: cat.color + "10",
                  color: cat.color,
                }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.label[i18n.language === "th" ? "th" : "en"]}
                <span
                  className="rounded-full px-1.5 py-0.5 text-white text-[10px] font-bold"
                  style={{ backgroundColor: cat.color }}
                >
                  {categoryCounts[cat.id]}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Expiry timeline — Gantt 30 days */}
      {ganttItems.length > 0 && (
        <section className="px-4">
          <SectionHeader
            title={t("dashboard.timelineSection")}
            icon={
              <CalendarClock className="w-4 h-4 text-gray-400 dark:text-slate-500" />
            }
          />
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 shadow-sm p-4">
            {/* Date ruler */}
            <div className="flex justify-between text-[10px] text-gray-400 dark:text-slate-500 mb-3 pl-[76px]">
              <span>{t("dashboard.today")}</span>
              <span>15 {t("item.notifyDaysUnit")}</span>
              <span>{t("dashboard.in30days")}</span>
            </div>
            {/* Gantt rows */}
            <div className="flex flex-col gap-2">
              {ganttItems.map((item) => {
                const days = daysUntilExpiry(item);
                const pct = Math.min(
                  100,
                  Math.max(4, (Math.max(0, days) / 30) * 100),
                );
                const isUrgent = days <= 2;
                const isSoon = days > 2 && days <= 7;
                const barColor = isUrgent
                  ? "#ef4444"
                  : isSoon
                    ? "#f59e0b"
                    : "#22c55e";
                const textColor = isUrgent || isSoon ? "#fff" : "#15803d";
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(`/items/${item.id}`)}
                    className="flex items-center gap-2 active:opacity-70 transition-opacity"
                  >
                    <span className="w-[68px] text-xs text-gray-600 dark:text-slate-300 truncate flex-shrink-0 text-right">
                      {item.name}
                    </span>
                    <div className="flex-1 bg-gray-100 dark:bg-slate-700 rounded-full h-6 relative overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: barColor + "dd",
                        }}
                      />
                      <span
                        className="absolute inset-0 flex items-center px-2 text-[10px] font-bold"
                        style={{ color: textColor }}
                      >
                        {days < 0
                          ? t("dashboard.expiredDays", {
                              count: Math.abs(days),
                            })
                          : days === 0
                            ? t("dashboard.expiresToday")
                            : `${days} ${t("item.notifyDaysUnit")}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ---- StatCard ----
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBg: string;
  iconColor: string;
  badge?: boolean;
  onClick?: () => void;
}

function StatCard({
  icon,
  label,
  value,
  iconBg,
  iconColor,
  badge,
  onClick,
}: StatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="flex flex-col gap-3 rounded-2xl bg-white dark:bg-slate-800 p-4 text-left shadow-sm border border-gray-100 dark:border-slate-700/50 active:scale-[0.97] transition-all disabled:cursor-default relative overflow-hidden"
    >
      <div
        className={`w-9 h-9 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center`}
      >
        {icon}
      </div>
      {badge && (
        <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-200" />
      )}
      <div>
        <p className="text-2xl font-black text-gray-900 dark:text-slate-100 leading-none">
          {value}
        </p>
        <p className="text-xs font-medium text-gray-400 dark:text-slate-500 mt-1">
          {label}
        </p>
      </div>
    </button>
  );
}

// ---- SectionHeader ----
interface SectionHeaderProps {
  title: string;
  onMore?: () => void;
  moreLabel?: string;
  icon?: React.ReactNode;
}

function SectionHeader({ title, onMore, moreLabel, icon }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-1.5">
        {icon}
        <h2 className="text-sm font-bold text-gray-800 dark:text-slate-100">
          {title}
        </h2>
      </div>
      {onMore && (
        <button
          type="button"
          onClick={onMore}
          className="flex items-center gap-0.5 text-xs font-semibold text-blue-500 dark:text-blue-400 active:opacity-70"
        >
          {moreLabel ?? "View all"}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
