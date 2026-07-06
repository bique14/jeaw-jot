import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ProductTemplate } from "@/types";

const COLLECTION = "templates";

export async function getTemplates(
  householdId: string,
): Promise<ProductTemplate[]> {
  const q = query(
    collection(db, COLLECTION),
    where("householdId", "==", householdId),
    limit(50),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }) as ProductTemplate)
    .sort((a, b) => (b.timesAdded ?? 0) - (a.timesAdded ?? 0));
}

export async function searchTemplates(
  householdId: string,
  searchText: string,
): Promise<ProductTemplate[]> {
  const all = await getTemplates(householdId);
  const lower = searchText.toLowerCase();
  return all.filter(
    (t) =>
      t.name.toLowerCase().includes(lower) ||
      t.brand.toLowerCase().includes(lower),
  );
}

export interface UpsertTemplateInput {
  householdId: string;
  name: string;
  brand: string;
  categoryId: string;
  defaultUnit: string;
  defaultNotifyDaysBefore: number;
  lastPrice?: number;
  lifespanDays?: number;
}

/** สร้างหรืออัพเดท template โดยใช้ชื่อ+brand+householdId เป็น key */
export async function upsertTemplate(
  input: UpsertTemplateInput,
): Promise<void> {
  // ใช้ชื่อ normalize เป็น doc ID (lowercase, replace spaces)
  const key = `${input.householdId}_${input.name.toLowerCase().replace(/\s+/g, "_")}_${input.brand.toLowerCase().replace(/\s+/g, "_")}`;
  const ref = doc(db, COLLECTION, key);

  const existing = (
    await getDocs(
      query(
        collection(db, COLLECTION),
        where("householdId", "==", input.householdId),
        where("name", "==", input.name),
        where("brand", "==", input.brand),
        limit(1),
      ),
    )
  ).docs[0];

  if (existing) {
    const prev = existing.data() as ProductTemplate;
    const timesAdded = (prev.timesAdded ?? 0) + 1;
    const avgLifespan = input.lifespanDays
      ? Math.round(
          ((prev.averageLifespanDays ?? input.lifespanDays) +
            input.lifespanDays) /
            2,
        )
      : prev.averageLifespanDays;

    await setDoc(
      existing.ref,
      {
        ...prev,
        timesAdded,
        lastPrice: input.lastPrice ?? prev.lastPrice,
        averageLifespanDays: avgLifespan,
        defaultUnit: input.defaultUnit,
        defaultNotifyDaysBefore: input.defaultNotifyDaysBefore,
        categoryId: input.categoryId,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    await setDoc(ref, {
      id: key,
      householdId: input.householdId,
      name: input.name,
      brand: input.brand,
      categoryId: input.categoryId,
      defaultUnit: input.defaultUnit,
      defaultNotifyDaysBefore: input.defaultNotifyDaysBefore,
      averageLifespanDays: input.lifespanDays,
      timesAdded: 1,
      lastPrice: input.lastPrice,
      updatedAt: serverTimestamp(),
    });
  }
}
