import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  where,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ProductItem, ItemStatus } from "@/types";
import { upsertTemplate } from "./templates.ts";

const COLLECTION = "items";

function itemsRef(householdId: string) {
  // single where — ไม่ต้องการ composite index, sort client-side
  return query(
    collection(db, COLLECTION),
    where("householdId", "==", householdId),
  );
}

/** Real-time listener — คืนค่า unsubscribe function */
export function subscribeItems(
  householdId: string,
  onData: (items: ProductItem[]) => void,
  onError?: (err: Error) => void,
): Unsubscribe {
  return onSnapshot(
    itemsRef(householdId),
    (snap) => {
      const items = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }) as ProductItem)
        .sort((a, b) => a.expiryDate.seconds - b.expiryDate.seconds);
      onData(items);
    },
    onError,
  );
}

export interface AddItemInput {
  householdId: string;
  name: string;
  brand?: string;
  categoryId: string;
  purchaseDate: Date;
  startDate: Date;
  expiryDate: Date;
  price: number;
  quantity: number;
  unit: string;
  notes?: string;
  notifyDaysBefore: number;
  createdByPin: string;
  templateId?: string;
}

export async function addItem(input: AddItemInput): Promise<string> {
  const now = serverTimestamp();
  const docRef = await addDoc(collection(db, COLLECTION), {
    ...input,
    brand: input.brand ?? "",
    notes: input.notes ?? "",
    purchaseDate: Timestamp.fromDate(input.purchaseDate),
    startDate: Timestamp.fromDate(input.startDate),
    expiryDate: Timestamp.fromDate(input.expiryDate),
    status: "active" as ItemStatus,
    createdAt: now,
    updatedAt: now,
  });

  // Auto-update template
  await upsertTemplate({
    householdId: input.householdId,
    name: input.name,
    brand: input.brand ?? "",
    categoryId: input.categoryId,
    defaultUnit: input.unit,
    defaultNotifyDaysBefore: input.notifyDaysBefore,
    lastPrice: input.price,
    lifespanDays: Math.round(
      (input.expiryDate.getTime() - input.startDate.getTime()) / 86400000,
    ),
  });

  return docRef.id;
}

export interface UpdateItemInput extends Partial<AddItemInput> {
  status?: ItemStatus;
}

export async function updateItem(
  itemId: string,
  input: UpdateItemInput,
): Promise<void> {
  const data: Record<string, unknown> = {
    ...input,
    updatedAt: serverTimestamp(),
  };

  if (input.purchaseDate)
    data.purchaseDate = Timestamp.fromDate(input.purchaseDate);
  if (input.startDate) data.startDate = Timestamp.fromDate(input.startDate);
  if (input.expiryDate) data.expiryDate = Timestamp.fromDate(input.expiryDate);

  await updateDoc(doc(db, COLLECTION, itemId), data);
}

export async function markDepleted(itemId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTION, itemId), {
    status: "depleted" as ItemStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, itemId));
}

/** One-time fetch — for export */
export async function getItemsOnce(
  householdId: string,
): Promise<ProductItem[]> {
  const snap = await getDocs(itemsRef(householdId));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as ProductItem)
    .sort((a, b) => a.expiryDate.seconds - b.expiryDate.seconds);
}
