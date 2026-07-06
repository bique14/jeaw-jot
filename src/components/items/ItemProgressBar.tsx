import { cn } from "@/lib/utils";
import type { ProductItem } from "@/types";
import { computeStatus, isExpiringSoon, toDate } from "@/lib/itemUtils";

interface Props {
  item: ProductItem;
  className?: string;
}

export function ItemProgressBar({ item, className }: Props) {
  const status = computeStatus(item);
  const expiringSoon = status === "active" && isExpiringSoon(item);

  // คำนวณ % ที่เหลืออยู่ นับจาก purchaseDate → expiryDate
  // bar เต็ม = เพิ่งซื้อ, bar หมด = หมดอายุ
  const purchase = toDate(item.purchaseDate).getTime();
  const expiry = toDate(item.expiryDate).getTime();
  const now = Date.now();
  const total = expiry - purchase;
  const remaining = expiry - now;
  const remainingPercent =
    status === "depleted" || status === "expired"
      ? 0
      : total <= 0
        ? 0
        : Math.min(100, Math.max(4, Math.round((remaining / total) * 100)));

  const barColor =
    status === "depleted"
      ? "bg-gray-300"
      : status === "expired"
        ? "bg-red-400"
        : expiringSoon
          ? "bg-amber-400"
          : "bg-green-400";

  return (
    <div
      className={cn(
        "h-1.5 w-full rounded-full bg-gray-100 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", barColor)}
        style={{ width: `${remainingPercent}%` }}
      />
    </div>
  );
}
