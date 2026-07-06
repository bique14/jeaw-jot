import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductItem } from "@/types";
import { ItemStatusBadge } from "./ItemStatusBadge";
import { ItemProgressBar } from "./ItemProgressBar";
import { daysUntilExpiry, computeStatus } from "@/lib/itemUtils";
import { format } from "date-fns";
import { toDate } from "@/lib/itemUtils";

interface Props {
  item: ProductItem;
  className?: string;
}

export function ItemCard({ item, className }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const days = daysUntilExpiry(item);
  const status = computeStatus(item);

  const daysLabel = (() => {
    if (status === "depleted") return t("item.status.depleted");
    if (days === 0) return t("item.expiresToday");
    if (days < 0)
      return t("item.expiredDaysAgo_other", { count: Math.abs(days) });
    return t("item.daysLeft_other", { count: days });
  })();

  const daysColor =
    status === "expired"
      ? "text-red-500"
      : status === "depleted"
        ? "text-gray-400"
        : days <= item.notifyDaysBefore
          ? "text-amber-500"
          : "text-gray-500";

  return (
    <button
      type="button"
      onClick={() => navigate(`/items/${item.id}`)}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl bg-white dark:bg-slate-800 p-3.5 text-left shadow-sm active:scale-[0.98] active:bg-gray-50 dark:active:bg-slate-700 transition-all",
        className,
      )}
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <Package size={22} className="text-gray-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-sm text-gray-900 dark:text-slate-100 truncate">
            {item.name}
          </p>
          <ItemStatusBadge item={item} className="flex-shrink-0" />
        </div>
        {item.brand && (
          <p className="text-xs text-gray-400 dark:text-slate-500 truncate mt-0.5">
            {item.brand}
          </p>
        )}
        <ItemProgressBar item={item} className="mt-2" />
        <div className="flex items-center justify-between mt-1.5">
          <p className={cn("text-xs font-medium", daysColor)}>{daysLabel}</p>
          <p className="text-xs text-gray-400 dark:text-slate-500">
            {format(toDate(item.expiryDate), "d MMM yy")}
          </p>
        </div>
      </div>
    </button>
  );
}
