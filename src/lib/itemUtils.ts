import { differenceInDays, isAfter } from "date-fns";
import type { ProductItem, ItemStatus } from "@/types";
import { Timestamp } from "firebase/firestore";

export function toDate(ts: Timestamp | Date): Date {
  return ts instanceof Timestamp ? ts.toDate() : ts;
}

/** คำนวณ status จาก expiryDate ปัจจุบัน (ไม่มีวันหมดอายุ = active เสมอ) */
export function computeStatus(item: ProductItem): ItemStatus {
  if (item.status === "depleted") return "depleted";
  if (!item.expiryDate) return "active";
  return isAfter(new Date(), toDate(item.expiryDate)) ? "expired" : "active";
}

/** จำนวนวันที่เหลือก่อนหมดอายุ (ลบ = หมดแล้ว, null = ไม่มีวันหมดอายุ) */
export function daysUntilExpiry(item: ProductItem): number | null {
  if (!item.expiryDate) return null;
  return differenceInDays(toDate(item.expiryDate), new Date());
}

/** ค่าไว้ใช้ sort ตามวันหมดอายุ — ไม่มีวันหมดอายุ = ท้ายสุด */
export function expirySortValue(item: ProductItem): number {
  return item.expiryDate
    ? toDate(item.expiryDate).getTime()
    : Number.POSITIVE_INFINITY;
}

/**
 * % ของอายุการใช้งานที่ผ่านไปแล้ว (0–100)
 * นับจาก startDate (วันเริ่มใช้) → expiryDate
 * null = ไม่มีวันหมดอายุ คำนวณไม่ได้
 */
export function lifespanPercent(item: ProductItem): number | null {
  if (!item.expiryDate) return null;
  const start = toDate(item.startDate).getTime();
  const expiry = toDate(item.expiryDate).getTime();
  const now = Date.now();
  const total = expiry - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, Math.round(((now - start) / total) * 100)));
}

/** จำนวนวันที่ใช้งานไปแล้ว นับจาก startDate → depletedAt (ถ้าใช้หมดแล้ว) หรือวันนี้ */
export function daysUsed(item: ProductItem): number {
  const end =
    item.status === "depleted" && (item.depletedAt ?? item.updatedAt)
      ? toDate(item.depletedAt ?? item.updatedAt)
      : new Date();
  return Math.max(0, differenceInDays(end, toDate(item.startDate)));
}

/** ใกล้หมดอายุ = ≤ notifyDaysBefore วัน (ไม่มีวันหมดอายุ = ไม่มีวันใกล้หมด) */
export function isExpiringSoon(item: ProductItem): boolean {
  const days = daysUntilExpiry(item);
  return days !== null && days >= 0 && days <= item.notifyDaysBefore;
}
