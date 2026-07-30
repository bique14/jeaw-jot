import type { Timestamp } from "firebase/firestore";

export type ItemStatus = "active" | "expired" | "depleted";

export interface ProductTemplate {
  id: string;
  householdId: string;
  name: string;
  brand: string;
  categoryId: string;
  defaultUnit: string;
  defaultNotifyDaysBefore: number;
  averageLifespanDays?: number;
  timesAdded: number;
  lastPrice?: number;
  updatedAt: Timestamp;
}

export interface ProductItem {
  id: string;
  householdId: string;
  templateId?: string;

  name: string;
  brand?: string;
  categoryId: string;

  /** เว้นว่างได้ (optional) */
  purchaseDate: Timestamp | null;
  startDate: Timestamp;
  /** เว้นว่างได้ (optional) */
  expiryDate: Timestamp | null;

  price: number;
  quantity: number;
  unit: string;
  notes?: string;

  notifyDaysBefore: number;

  status: ItemStatus;
  /** เวลาที่กด "ใช้หมดแล้ว" */
  depletedAt?: Timestamp | null;

  imageUrl?: string;
  imagePath?: string;

  createdByPin: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Category {
  id: string;
  householdId: string;
  label: {
    th: string;
    en: string;
  };
  color: string;
  icon: string;
  isPreset: boolean;
  order: number;
}

export interface NotificationLog {
  id: string;
  householdId: string;
  itemId: string;
  itemName: string;
  notifiedAt: Timestamp;
  daysBeforeExpiry: number;
  expiryDate: Timestamp;
}
