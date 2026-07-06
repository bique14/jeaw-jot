import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Pencil, Trash2, Package } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import { useItems } from "@/hooks/useItems";
import { deleteItem, markDepleted } from "@/services/items";
import { ItemStatusBadge } from "@/components/items/ItemStatusBadge";
import { ItemProgressBar } from "@/components/items/ItemProgressBar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { daysUntilExpiry, computeStatus, toDate } from "@/lib/itemUtils";

export default function ItemDetailPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { items, loading } = useItems();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmDepleted, setConfirmDepleted] = useState(false);
  const isDark = document.documentElement.classList.contains("dark");

  const item = items.find((i) => i.id === id);
  const locale = i18n.language === "th" ? th : undefined;

  // useMemo ต้องอยู่ก่อน early return เสมอ (Rules of Hooks)
  const priceHistory = useMemo(() => {
    if (!item) return [];
    return items
      .filter((i) => i.name.toLowerCase() === item.name.toLowerCase())
      .sort(
        (a, b) =>
          toDate(a.purchaseDate).getTime() - toDate(b.purchaseDate).getTime(),
      )
      .map((i) => ({
        date: format(toDate(i.purchaseDate), "d MMM", { locale }),
        price: i.price,
      }));
  }, [items, item, locale]);

  const handleDelete = async () => {
    if (!id) return;
    await deleteItem(id);
    toast.success(t("toast.deleted"));
    navigate("/items", { replace: true });
  };

  const handleDepleted = async () => {
    if (!id) return;
    await markDepleted(id);
    setConfirmDepleted(false);
    toast.success(t("toast.depleted"));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh text-sm text-gray-400 dark:text-slate-500">
        {t("common.loading")}
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex items-center justify-center min-h-dvh text-sm text-gray-400 dark:text-slate-500">
        {t("error.notFound")}
      </div>
    );
  }

  const days = daysUntilExpiry(item);
  const status = computeStatus(item);

  const daysLabel = (() => {
    if (status === "depleted") return t("item.status.depleted");
    if (days === 0) return t("item.expiresToday");
    if (days < 0)
      return t("item.expiredDaysAgo_other", { count: Math.abs(days) });
    return t("item.daysLeft_other", { count: days });
  })();

  return (
    <div className="flex flex-col min-h-dvh bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-2 h-14 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-slate-700 transition-colors"
        >
          <ChevronLeft
            size={22}
            className="text-gray-700 dark:text-slate-300"
          />
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => navigate(`/items/${id}/edit`)}
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-gray-100 dark:active:bg-slate-700 transition-colors"
          >
            <Pencil size={18} className="text-gray-600 dark:text-slate-300" />
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full active:bg-red-50 dark:active:bg-red-900/20 transition-colors"
          >
            <Trash2 size={18} className="text-red-500" />
          </button>
        </div>
      </div>

      {/* Image / Icon */}
      <div className="mx-4 mt-4 h-48 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={56} className="text-gray-300 dark:text-slate-600" />
        )}
      </div>

      {/* Main info */}
      <div className="mx-4 mt-4 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100">
              {item.name}
            </h1>
            {item.brand && (
              <p className="text-sm text-gray-500 mt-0.5">{item.brand}</p>
            )}
          </div>
          <ItemStatusBadge item={item} />
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500 dark:text-slate-400">
              {t("itemDetail.lifespan")}
            </span>
            <span className="font-medium text-gray-700 dark:text-slate-300">
              {daysLabel}
            </span>
          </div>
          <ItemProgressBar item={item} className="h-2" />
        </div>
      </div>

      {/* Details */}
      <div className="mx-4 mt-3 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
          {t("itemDetail.details")}
        </h2>
        <div className="flex flex-col gap-2.5">
          {[
            {
              label: t("item.purchaseDate"),
              value: format(toDate(item.purchaseDate), "d MMM yyyy", {
                locale,
              }),
            },
            {
              label: t("item.startDate"),
              value: format(toDate(item.startDate), "d MMM yyyy", { locale }),
            },
            {
              label: t("item.expiryDate"),
              value: format(toDate(item.expiryDate), "d MMM yyyy", { locale }),
            },
            {
              label: t("item.price"),
              value: `${t("common.baht")}${item.price.toLocaleString()}`,
            },
            {
              label: `${t("item.quantity")} / ${t("item.unit")}`,
              value: `${item.quantity} ${item.unit}`,
            },
            {
              label: t("item.notifyDaysBefore"),
              value: `${item.notifyDaysBefore} ${t("item.notifyDaysUnit")}`,
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-slate-400">
                {label}
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-slate-100">
                {value}
              </span>
            </div>
          ))}
          {item.notes && (
            <div className="pt-2 border-t border-gray-100 dark:border-slate-700/50">
              <p className="text-xs text-gray-400 dark:text-slate-500 mb-1">
                {t("item.notes")}
              </p>
              <p className="text-sm text-gray-700 dark:text-slate-300">
                {item.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Price history chart */}
      {priceHistory.length >= 2 && (
        <div className="mx-4 mt-3 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-sm">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
              {t("analytics.priceHistory")}
            </h2>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              {t("itemDetail.priceUnit")}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart
              data={priceHistory}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? "#334155" : "#f0f0f0"}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: isDark ? "#64748b" : "#9ca3af" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: isDark ? "#64748b" : "#9ca3af" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `฿${v}`}
              />
              <Tooltip
                formatter={(v) => [`฿${Number(v).toLocaleString()}`, "ราคา"]}
                contentStyle={{
                  borderRadius: 12,
                  border: "none",
                  backgroundColor: isDark ? "#1e293b" : "#fff",
                  color: isDark ? "#f1f5f9" : "#111",
                  boxShadow: "0 4px 20px rgba(0,0,0,.15)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={{ r: 4, fill: "#8b5cf6" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Action buttons */}
      {status !== "depleted" && (
        <div className="mx-4 mt-3 mb-8">
          <button
            type="button"
            onClick={() => setConfirmDepleted(true)}
            className="w-full rounded-xl border-2 border-gray-200 dark:border-slate-600 py-3.5 text-sm font-semibold text-gray-700 dark:text-slate-200 bg-transparent dark:bg-slate-800 active:bg-gray-50 dark:active:bg-slate-700 transition-all"
          >
            {t("action.markDepleted")}
          </button>
        </div>
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmDelete}
        title={t("confirm.deleteItem")}
        message={t("confirm.deleteItemDesc", { name: item.name })}
        confirmLabel={t("action.delete")}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      {/* Depleted confirm */}
      <ConfirmDialog
        open={confirmDepleted}
        title={t("confirm.markDepleted")}
        message={t("confirm.markDepletedDesc", { name: item.name })}
        onConfirm={handleDepleted}
        onCancel={() => setConfirmDepleted(false)}
      />
    </div>
  );
}
