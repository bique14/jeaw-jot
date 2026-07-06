import { differenceInDays, isAfter } from "date-fns";
import type { ProductItem, ItemStatus } from "@/types";
import { Timestamp } from "firebase/firestore";

export function toDate(ts: Timestamp | Date): Date {
  return ts instanceof Timestamp ? ts.toDate() : ts;
}

/** คำนวณ status จาก expiryDate ปัจจุบัน */
export function computeStatus(item: ProductItem): ItemStatus {
  if (item.status === "depleted") return "depleted";
  const now = new Date();
  const expiry = toDate(item.expiryDate);
  return isAfter(now, expiry) ? "expired" : "active";
}

/** จำนวนวันที่เหลือก่อนหมดอายุ (ลบ = หมดแล้ว) */
export function daysUntilExpiry(item: ProductItem): number {
  return differenceInDays(toDate(item.expiryDate), new Date());
}

/** % ของอายุการใช้งานที่ผ่านไปแล้ว (0–100) */
export function lifespanPercent(item: ProductItem): number {
  const start = toDate(item.startDate).getTime();
  const expiry = toDate(item.expiryDate).getTime();
  const now = Date.now();
  const total = expiry - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((now - start) / total) * 100)));
}

/** ใกล้หมดอายุ = ≤ notifyDaysBefore วัน */
export function isExpiringSoon(item: ProductItem): boolean {
  const days = daysUntilExpiry(item);
  return days >= 0 && days <= item.notifyDaysBefore;
}
