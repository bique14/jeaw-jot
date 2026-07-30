import { cn } from "@/lib/utils";
import type { ProductItem } from "@/types";
import { computeStatus, isExpiringSoon, toDate } from "@/lib/itemUtils";

interface Props {
  item: ProductItem;
  className?: string;
}

/** % ที่เหลือของอายุการใช้งาน (null = คำนวณไม่ได้เพราะไม่มีวันหมดอายุ) */
export function remainingLifespanPercent(item: ProductItem): number | null {
  const status = computeStatus(item);
  if (status === "depleted" || status === "expired") return 0;
  if (!item.expiryDate) return null;

  // อายุการใช้งาน = วันเริ่มใช้ (startDate) → วันหมดอายุ
  // bar เต็ม = เพิ่งเริ่มใช้ (หรือยังไม่เริ่มใช้), bar หมด = หมดอายุ
  const start = toDate(item.startDate).getTime();
  const expiry = toDate(item.expiryDate).getTime();
  const now = Date.now();
  if (expiry <= start) return 0;
  if (now <= start) return 100;
  return Math.min(
    100,
    Math.max(2, Math.round(((expiry - now) / (expiry - start)) * 100)),
  );
}

export function ItemProgressBar({ item, className }: Props) {
  const status = computeStatus(item);
  const expiringSoon = status === "active" && isExpiringSoon(item);
  const remainingPercent = remainingLifespanPercent(item);

  const barColor =
    status === "depleted"
      ? "bg-gray-300 dark:bg-slate-600"
      : status === "expired"
        ? "bg-gradient-to-r from-red-400 to-red-500"
        : expiringSoon
          ? "bg-gradient-to-r from-amber-400 to-orange-400"
          : "bg-gradient-to-r from-emerald-400 to-green-500";

  // ไม่มีวันหมดอายุ → แถบสีฟ้าจางเต็มแบบ striped บอกว่า "ไม่จำกัดเวลา"
  if (remainingPercent === null && status === "active") {
    return (
      <div
        className={cn(
          "h-1.5 w-full rounded-full bg-blue-100/80 dark:bg-blue-900/30 overflow-hidden",
          className,
        )}
      >
        <div className="h-full w-full rounded-full bg-[repeating-linear-gradient(45deg,rgba(59,130,246,.35)_0px,rgba(59,130,246,.35)_6px,transparent_6px,transparent_12px)]" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "h-1.5 w-full rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-full transition-all", barColor)}
        style={{ width: `${remainingPercent ?? 0}%` }}
      />
    </div>
  );
}
