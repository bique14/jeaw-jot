# Code Conventions

สำหรับโปรเจกต์ Jeaw — React + TypeScript + Firebase
mobile-first, mobile friendly

---

## 1. ไฟล์และโฟลเดอร์

```
components/   → PascalCase   — ItemCard.tsx, ImagePicker.tsx
pages/        → PascalCase   — Dashboard.tsx, ItemDetail.tsx
hooks/        → camelCase    — useItems.ts, useHousehold.ts
services/     → camelCase    — items.ts, storage.ts
types/        → camelCase    — index.ts
i18n/         → camelCase    — th.json, en.json
```

- 1 component ต่อ 1 ไฟล์เสมอ
- ไม่สร้างโฟลเดอร์ถ้ามีไฟล์เดียว

---

## 2. TypeScript

**ใช้ `interface` สำหรับ object shape, `type` สำหรับ union/alias**

```ts
// ✅
interface ProductItem {
  id: string;
  name: string;
  status: ItemStatus;
}

type ItemStatus = "active" | "expired" | "depleted";

// ❌ อย่าใช้ any
const item: any = {};
```

**ไม่เขียน type ที่ TypeScript infer ได้เอง**

```ts
// ✅
const count = 0;
const items = useState<ProductItem[]>([]);

// ❌ redundant
const count: number = 0;
```

**ใช้ optional chaining และ nullish coalescing**

```ts
const price = item?.price ?? 0;
const name = item?.name ?? "ไม่มีชื่อ";
```

---

## 3. React Components

**Function component เท่านั้น ไม่ใช้ class component**

```tsx
// ✅
export function ItemCard({ item }: { item: ProductItem }) {
  return <div>...</div>;
}

// ❌
export default class ItemCard extends React.Component {}
```

**Props type ประกาศ inline ถ้าน้อย field, แยก interface ถ้ามาก**

```tsx
// ✅ น้อย field — inline
function Badge({ label, color }: { label: string; color: string }) {}

// ✅ มาก field — แยก interface
interface ItemCardProps {
  item: ProductItem;
  onClick?: () => void;
  showImage?: boolean;
}
function ItemCard({ item, onClick, showImage = true }: ItemCardProps) {}
```

**Named export เสมอ ยกเว้น pages**

```tsx
// components — named export
export function ItemCard() {}

// pages — default export
export default function Dashboard() {}
```

**ไม่ nest component definition ใน component อื่น**

```tsx
// ❌
function ItemList() {
  function Row() {
    return <div />;
  } // สร้างใหม่ทุก render
  return <Row />;
}

// ✅ แยกออกมาด้านนอก หรือใส่ใน components/
function Row() {
  return <div />;
}
function ItemList() {
  return <Row />;
}
```

---

## 4. Hooks

**Custom hook ต้องขึ้นต้นด้วย `use` และ return เฉพาะสิ่งที่ caller ต้องการ**

```ts
// ✅
export function useItems(householdId: string) {
  const [items, setItems] = useState<ProductItem[]>([])
  // ...
  return { items, isLoading, error }
}

// ❌ อย่า return ทุกอย่าง
return { items, setItems, unsubscribe, internalRef, ... }
```

**แยก side effects ใน useEffect อย่างชัดเจน**

```ts
// ✅ 1 useEffect ต่อ 1 concern
useEffect(() => {
  const unsub = subscribeToItems(householdId, setItems);
  return () => unsub();
}, [householdId]);
```

---

## 5. Tailwind CSS

**ใช้ `cn()` จาก `lib/utils.ts` เสมอเมื่อมี conditional class**

```tsx
// ✅
<div className={cn('rounded-lg p-4', isExpired && 'bg-red-50 border-red-200')}>

// ❌
<div className={`rounded-lg p-4 ${isExpired ? 'bg-red-50' : ''}`}>
```

**จัดกลุ่ม class ตาม concern: layout → spacing → color → typography → state**

```tsx
// ✅ อ่านง่าย
className =
  "flex items-center gap-3 px-4 py-2 bg-white text-sm font-medium hover:bg-gray-50";
```

**ไม่เขียน CSS custom เว้นแต่ Tailwind ทำไม่ได้จริงๆ**

---

## 6. Services (Firebase)

**Service function รับ plain arguments, return plain data — ไม่ผูกกับ React**

```ts
// ✅ src/services/items.ts
export async function addItem(
  householdId: string,
  data: Omit<ProductItem, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  const ref = await addDoc(collection(db, "households", householdId, "items"), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}
```

**Error handling ทำที่ hook/component ไม่ใช่ใน service**

```ts
// ✅ service — throw ต่อ
export async function deleteItem(householdId: string, itemId: string) {
  await deleteDoc(doc(db, "households", householdId, "items", itemId));
}

// ✅ hook/component — จัดการ error
try {
  await deleteItem(householdId, itemId);
  toast.success("ลบสำเร็จ");
} catch {
  toast.error("เกิดข้อผิดพลาด");
}
```

---

## 7. i18n

**ใช้ translation key เสมอ ห้าม hardcode ข้อความที่ user เห็น**

```tsx
// ✅
const { t } = useTranslation()
<button>{t('action.save')}</button>

// ❌
<button>บันทึก</button>
```

**Key structure: `namespace.section.key`**

```json
{
  "item.name": "ชื่อสินค้า",
  "action.save": "บันทึก",
  "notification.daysLeft": "เหลืออีก {{count}} วัน"
}
```

---

## 8. Imports

**ลำดับ imports (คั่นด้วยบรรทัดว่าง)**

```ts
// 1. React
import { useState, useEffect } from "react";

// 2. Third-party
import { useTranslation } from "react-i18next";
import { format } from "date-fns";

// 3. Internal — absolute path (@/)
import { useItems } from "@/hooks/useItems";
import { ItemCard } from "@/components/items/ItemCard";

// 4. Types
import type { ProductItem } from "@/types";
```

---

## 9. สิ่งที่ไม่ทำ

| ❌ หลีกเลี่ยง                    | เหตุผล                                               |
| -------------------------------- | ---------------------------------------------------- |
| `useEffect` สำหรับ derived state | ใช้ `useMemo` หรือคำนวณ inline แทน                   |
| Component ที่ยาวกว่า 150 บรรทัด  | แยกเป็น component ย่อย                               |
| Comment อธิบาย _สิ่งที่โค้ดทำ_   | โค้ดควรอ่านได้เอง ถ้าต้องอธิบาย ให้ refactor ชื่อแทน |
| Magic number/string              | ประกาศเป็น constant มีชื่อ                           |
| Prop drilling เกิน 2 ชั้น        | ใช้ Context หรือยกขึ้น component บน                  |
| `console.log` ใน production      | ลบออกก่อน commit                                     |

---

## 10. ตัวอย่าง Component ที่ดี

```tsx
import { differenceInDays } from "date-fns";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ProductItem } from "@/types";

const EXPIRY_COLORS = {
  active: "bg-green-50  text-green-700",
  "expiring-soon": "bg-yellow-50 text-yellow-700",
  expired: "bg-red-50    text-red-700",
  depleted: "bg-gray-50   text-gray-500",
} satisfies Record<string, string>;

interface ItemStatusBadgeProps {
  item: ProductItem;
}

export function ItemStatusBadge({ item }: ItemStatusBadgeProps) {
  const { t } = useTranslation();
  const daysLeft = differenceInDays(item.expiryDate.toDate(), new Date());

  const status =
    item.status === "depleted"
      ? "depleted"
      : daysLeft < 0
        ? "expired"
        : daysLeft <= item.notifyDaysBefore
          ? "expiring-soon"
          : "active";

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-xs font-medium",
        EXPIRY_COLORS[status],
      )}
    >
      {t(`item.status.${status}`)}
    </span>
  );
}
```

## 11. mobile-first, mobile friendly

เน้นการทำงานบนมือถือเป็นหลัก ทำเป็น pwa
