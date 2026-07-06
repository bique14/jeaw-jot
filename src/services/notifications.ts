import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ProductItem, NotificationLog } from "@/types";
import {
  computeStatus,
  daysUntilExpiry,
  isExpiringSoon,
  toDate,
} from "@/lib/itemUtils";

const COLLECTION = "notificationLogs";

/** ตรวจว่าแจ้งรายการนี้ไปวันนี้แล้วหรือยัง (single-where query เพื่อหลีกเลี่ยง composite index) */
async function wasNotifiedToday(
  householdId: string,
  itemId: string,
): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const q = query(
    collection(db, COLLECTION),
    where("householdId", "==", householdId),
  );
  const snap = await getDocs(q);
  return snap.docs.some((doc) => {
    const data = doc.data() as NotificationLog;
    return data.itemId === itemId && toDate(data.notifiedAt) >= today;
  });
}

/** ขอ permission แจ้งเตือนจาก browser */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/** ส่ง notification สำหรับ items ที่ใกล้หมดอายุ + บันทึก log */
export async function checkAndNotify(
  items: ProductItem[],
  householdId: string,
): Promise<number> {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return 0;

  const toNotify = items.filter(
    (item) => computeStatus(item) === "active" && isExpiringSoon(item),
  );

  let count = 0;
  for (const item of toNotify) {
    const alreadyNotified = await wasNotifiedToday(householdId, item.id);
    if (alreadyNotified) continue;

    const days = daysUntilExpiry(item);
    const body =
      days === 0
        ? `${item.name} หมดอายุวันนี้!`
        : days < 0
          ? `${item.name} หมดอายุไปแล้ว ${Math.abs(days)} วัน`
          : `${item.name} จะหมดอายุในอีก ${days} วัน`;

    new Notification("Jeaw — สินค้าใกล้หมดอายุ", {
      body,
      icon: "/icon-192.png",
      tag: `jeaw-${item.id}`,
    });

    await addDoc(collection(db, COLLECTION), {
      householdId,
      itemId: item.id,
      itemName: item.name,
      notifiedAt: serverTimestamp(),
      daysBeforeExpiry: days,
      expiryDate: item.expiryDate,
    });
    count++;
  }
  return count;
}

/** นับ notification ที่ส่งไปวันนี้ */
export async function getTodayNotificationCount(
  householdId: string,
): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const q = query(
    collection(db, COLLECTION),
    where("householdId", "==", householdId),
  );
  const snap = await getDocs(q);
  return snap.docs.filter((doc) => {
    const data = doc.data() as NotificationLog;
    return toDate(data.notifiedAt) >= today;
  }).length;
}
