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

  purchaseDate: Timestamp;
  startDate: Timestamp;
  expiryDate: Timestamp;

  price: number;
  quantity: number;
  unit: string;
  notes?: string;

  notifyDaysBefore: number;

  status: ItemStatus;

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
