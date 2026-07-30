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

/** ดึง itemId ทั้งหมดที่แจ้งเตือนไปแล้ววันนี้ (query เดียว ไม่ต้อง N+1) */
async function getNotifiedTodayItemIds(
  householdId: string,
): Promise<Set<string>> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const q = query(
    collection(db, COLLECTION),
    where("householdId", "==", householdId),
  );
  const snap = await getDocs(q);
  const ids = new Set<string>();
  snap.docs.forEach((doc) => {
    const data = doc.data() as NotificationLog;
    if (data.notifiedAt && toDate(data.notifiedAt) >= today) {
      ids.add(data.itemId);
    }
  });
  return ids;
}

/** ขอ permission แจ้งเตือนจาก browser */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

/**
 * แสดง notification ผ่าน Service Worker (จำเป็นสำหรับ PWA/Android —
 * `new Notification()` ใช้ไม่ได้ในหน้าเว็บที่ติดตั้งเป็นแอพ)
 * ถ้าไม่มี SW จะ fallback เป็น Notification constructor
 */
async function showNotification(
  title: string,
  options: NotificationOptions,
): Promise<boolean> {
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(title, options);
        return true;
      }
    }
  } catch {
    // ตกไปใช้ fallback ด้านล่าง
  }
  try {
    new Notification(title, options);
    return true;
  } catch {
    return false;
  }
}

/** ทดสอบส่ง notification ทันที — ใช้เช็คว่าเครื่องนี้แจ้งเตือนได้จริง */
export async function sendTestNotification(): Promise<boolean> {
  if (!("Notification" in window) || Notification.permission !== "granted")
    return false;
  return showNotification("Jeaw — ทดสอบการแจ้งเตือน", {
    body: "การแจ้งเตือนทำงานได้ปกติ 🎉",
    icon: "/icon-192.png",
    tag: "jeaw-test",
  });
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
  if (toNotify.length === 0) return 0;

  const notifiedToday = await getNotifiedTodayItemIds(householdId);

  let count = 0;
  for (const item of toNotify) {
    if (notifiedToday.has(item.id)) continue;

    const days = daysUntilExpiry(item);
    if (days === null) continue;
    const body =
      days === 0
        ? `${item.name} หมดอายุวันนี้!`
        : days < 0
          ? `${item.name} หมดอายุไปแล้ว ${Math.abs(days)} วัน`
          : `${item.name} จะหมดอายุในอีก ${days} วัน`;

    const shown = await showNotification("Jeaw — สินค้าใกล้หมดอายุ", {
      body,
      icon: "/icon-192.png",
      tag: `jeaw-${item.id}`,
    });
    if (!shown) continue;

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
