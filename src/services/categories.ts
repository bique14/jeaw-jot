import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  setDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Category } from "@/types";

const COLLECTION = "categories";

// 8 preset categories พร้อม icon lucide + สี
export const PRESET_CATEGORIES: Omit<Category, "householdId">[] = [
  {
    id: "food",
    label: { th: "อาหาร", en: "Food" },
    color: "#F97316",
    icon: "ShoppingBasket",
    isPreset: true,
    order: 0,
  },
  {
    id: "medicine",
    label: { th: "ยา/อาหารเสริม", en: "Medicine" },
    color: "#EF4444",
    icon: "Pill",
    isPreset: true,
    order: 1,
  },
  {
    id: "personal",
    label: { th: "ของใช้ส่วนตัว", en: "Personal Care" },
    color: "#8B5CF6",
    icon: "Sparkles",
    isPreset: true,
    order: 2,
  },
  {
    id: "cleaning",
    label: { th: "ของทำความสะอาด", en: "Cleaning" },
    color: "#06B6D4",
    icon: "WashingMachine",
    isPreset: true,
    order: 3,
  },
  {
    id: "baby",
    label: { th: "เด็กอ่อน", en: "Baby" },
    color: "#EC4899",
    icon: "Baby",
    isPreset: true,
    order: 4,
  },
  {
    id: "pet",
    label: { th: "สัตว์เลี้ยง", en: "Pet" },
    color: "#84CC16",
    icon: "PawPrint",
    isPreset: true,
    order: 5,
  },
  {
    id: "cosmetic",
    label: { th: "เครื่องสำอาง", en: "Cosmetics" },
    color: "#D946EF",
    icon: "Palette",
    isPreset: true,
    order: 6,
  },
  {
    id: "other",
    label: { th: "อื่นๆ", en: "Other" },
    color: "#94A3B8",
    icon: "Box",
    isPreset: true,
    order: 7,
  },
];

/** seed preset categories ที่ยังขาด (บ้านเก่าจะได้ preset ใหม่ที่เพิ่มภายหลังด้วย) */
export async function seedCategoriesIfNeeded(
  householdId: string,
): Promise<void> {
  // ใช้ single where เพื่อหลีกเลี่ยง composite index
  const q = query(
    collection(db, COLLECTION),
    where("householdId", "==", householdId),
  );
  const snap = await getDocs(q);
  const existingIds = new Set(snap.docs.map((d) => d.id));

  const missing = PRESET_CATEGORIES.filter(
    (cat) => !existingIds.has(`${householdId}_${cat.id}`),
  );
  if (missing.length === 0) return;

  await Promise.all(
    missing.map((cat) =>
      setDoc(doc(db, COLLECTION, `${householdId}_${cat.id}`), {
        ...cat,
        householdId,
      }),
    ),
  );
}

export function subscribeCategories(
  householdId: string,
  onData: (cats: Category[]) => void,
): Unsubscribe {
  // ใช้ single where (ไม่ต้องการ composite index) แล้ว sort client-side
  return onSnapshot(
    query(collection(db, COLLECTION), where("householdId", "==", householdId)),
    (snap) => {
      const cats = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }) as Category)
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
      onData(cats);
    },
    (err) => console.error("subscribeCategories error:", err),
  );
}

export async function addCategory(
  householdId: string,
  data: { label: { th: string; en: string }; color: string; icon: string },
): Promise<string> {
  const allSnap = await getDocs(
    query(collection(db, COLLECTION), where("householdId", "==", householdId)),
  );
  const maxOrder = allSnap.docs.reduce(
    (max, d) => Math.max(max, (d.data().order as number) ?? 0),
    0,
  );

  const ref = await addDoc(collection(db, COLLECTION), {
    householdId,
    ...data,
    isPreset: false,
    order: maxOrder + 1,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateCategory(
  categoryId: string,
  data: Partial<{
    label: { th: string; en: string };
    color: string;
    icon: string;
  }>,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, categoryId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, categoryId));
}
