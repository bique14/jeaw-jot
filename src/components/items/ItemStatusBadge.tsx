import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ProductItem } from "@/types";
import { computeStatus, isExpiringSoon } from "@/lib/itemUtils";

interface Props {
  item: ProductItem;
  className?: string;
}

const CONFIG = {
  active: {
    i18nKey: "item.status.active",
    className: "bg-green-100 text-green-700",
  },
  expiringSoon: {
    i18nKey: "item.status.expiringSoon",
    className: "bg-amber-100 text-amber-700",
  },
  expired: {
    i18nKey: "item.status.expired",
    className: "bg-red-100 text-red-700",
  },
  depleted: {
    i18nKey: "item.status.depleted",
    className: "bg-gray-100 text-gray-500",
  },
};

export function ItemStatusBadge({ item, className }: Props) {
  const { t } = useTranslation();
  const status = computeStatus(item);
  const key =
    status === "active" && isExpiringSoon(item) ? "expiringSoon" : status;
  const config = CONFIG[key];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {t(config.i18nKey)}
    </span>
  );
}
