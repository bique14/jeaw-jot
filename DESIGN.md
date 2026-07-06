# Jeaw — Household Item Tracker

## Design Document v1.1 (July 2026)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Authentication & Access](#4-authentication--access)
5. [Data Model](#5-data-model)
6. [Feature Specifications](#6-feature-specifications)
7. [UI Structure & Routing](#7-ui-structure--routing)
8. [Page-by-Page UI Design](#8-page-by-page-ui-design)
9. [Notification System](#9-notification-system)
10. [Internationalization (i18n)](#10-internationalization-i18n)
11. [PWA & Offline Support](#11-pwa--offline-support)
12. [Image Upload & Caching](#12-image-upload--caching)
13. [Project File Structure](#13-project-file-structure)
14. [Implementation Roadmap](#14-implementation-roadmap)

---

## 1. Overview

**Jeaw** คือ Progressive Web App สำหรับ tracking ของใช้ภายในบ้าน เช่น ยาสีฟัน แชมพู ยา อาหาร โดยสามารถบันทึกวันเริ่มใช้ วันหมดอายุ ราคา และรับ push notification ก่อนของจะหมดอายุ

### เป้าหมาย

- ใช้ร่วมกัน 2 คนในบ้านเดียวกัน
- ข้อมูล sync แบบ real-time ทั้งสองคนเห็นเหมือนกัน
- รองรับ offline (ใช้ได้แม้ไม่มีเน็ต)
- Push notification แจ้งก่อนของหมดอายุ
- ถ่ายรูปหรือเลือกรูปสินค้าได้ (Firebase Storage)
- วิเคราะห์ค่าใช้จ่ายและพฤติกรรมการใช้ของผ่านกราฟ

---

## 2. Architecture

### Overview Diagram

```
┌─────────────────────────────────────────────────────┐
│                   React PWA (Client)                 │
│                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│   │  React   │  │ Recharts │  │  react-i18next   │ │
│   │ Components│  │  Charts  │  │   (EN / TH)      │ │
│   └──────────┘  └──────────┘  └──────────────────┘ │
│                                                     │
│   ┌──────────────────────────────────────────────┐  │
│   │           TanStack Query + Firebase SDK      │  │
│   │       (data fetching, caching, real-time)    │  │
│   └──────────────────────────────────────────────┘  │
│                                                     │
│   ┌──────────────────────────────────────────────┐  │
│   │          Service Worker (vite-plugin-pwa)    │  │
│   │   - Asset cache (offline)                   │  │
│   │   - Image cache CacheFirst (30 วัน)         │  │
│   │   - Web Push Notifications (FCM)            │  │
│   └──────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │ Firebase SDK (HTTPS)
          ┌──────────▼──────────────────┐
          │        Firebase (BaaS)       │
          │                             │
          │  ┌────────────┐             │
          │  │ Firestore  │  real-time  │
          │  │  Database  │  offline    │
          │  └────────────┘             │
          │                             │
          │  ┌────────────┐             │
          │  │  Storage   │  รูปภาพ    │
          │  │ (images)   │  ~300KB/รูป │
          │  └────────────┘             │
          │                             │
          │  ┌────────────┐             │
          │  │    FCM     │  push notif │
          │  │ (Cloud Msg)│             │
          │  └────────────┘             │
          └─────────────────────────────┘
```

### ทำไมถึงเลือก Firebase (Spark Plan — ฟรีตลอด)

| สิ่งที่ต้องการ              | Firebase รองรับ                          | ทำเองต้องทำอะไร                    |
| --------------------------- | ---------------------------------------- | ---------------------------------- |
| 2 users เห็นข้อมูลเหมือนกัน | Firestore real-time listener             | ❌ ต้องเขียน sync layer            |
| ใช้ได้ offline              | `enableIndexedDbPersistence()` 1 บรรทัด  | ❌ ต้องเขียน IndexedDB layer       |
| Push notification           | FCM ฟรี                                  | ✅ ต้องใช้ service worker อยู่แล้ว |
| ไม่ต้องเขียน backend        | SDK ต่อตรงจาก browser                    | ✅                                 |
| ฟรีสำหรับ 2 users           | Spark: 50k reads/วัน, 20k writes/วัน     | ไม่มีทางเกิน                       |
| เก็บรูปภาพ                  | Storage: 5 GB พื้นที่, 1 GB download/วัน | 2 users ใช้ไม่ถึง 50 MB/วัน        |

---

## 3. Tech Stack

```
Core:
  React 18+          — UI framework
  TypeScript         — type safety
  Vite               — build tool (มีแล้ว)

Backend (BaaS):
  Firebase Firestore — database (real-time + offline)
  Firebase Storage   — เก็บรูปภาพสินค้า
  Firebase FCM       — push notifications
  (ไม่มี Firebase Auth — ใช้ PIN แทน)

Styling:
  Tailwind CSS       — utility-first CSS
  shadcn/ui          — component library (accessible, TypeScript-first)

Data & Forms:
  TanStack Query     — server state management, caching
  React Hook Form    — form management
  Zod                — schema validation

Charts:
  Recharts           — React-native charting

i18n:
  react-i18next      — EN/TH language switching

PWA:
  vite-plugin-pwa    — Service Worker + manifest auto-generation
  Workbox            — (bundled กับ vite-plugin-pwa) asset caching strategy

Date Utilities:
  date-fns           — date manipulation, formatting, Thai locale

Image:
  browser-image-compression — compress รูปก่อน upload (client-side)

Routing:
  React Router v6    — client-side routing
```

### Dependencies (package.json)

```json
{
  "dependencies": {
    "firebase": "^10.x",
    "react-router-dom": "^6.x",
    "@tanstack/react-query": "^5.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "recharts": "^2.x",
    "react-i18next": "^14.x",
    "i18next": "^23.x",
    "date-fns": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.x",
    "browser-image-compression": "^2.x"
  },
  "devDependencies": {
    "vite-plugin-pwa": "^0.x",
    "tailwindcss": "^3.x",
    "autoprefixer": "^10.x",
    "postcss": "^8.x",
    "@tailwindcss/forms": "^0.x"
  }
}
```

---

## 4. Authentication & Access

### Design: PIN + Household ID (ไม่ใช้ Firebase Auth)

ง่าย เหมาะสำหรับ 2 คนในบ้านเดียวกัน ไม่ต้องสมัคร account

#### Flow

```
ครั้งแรกที่ใช้:
  1. กด "สร้างบ้านใหม่"
  2. ระบบ generate Household ID อัตโนมัติ เช่น "jeaw-home-x7k2p"
  3. ตั้ง PIN 4 หลัก
  4. บันทึก householdId + hashedPIN ใน localStorage
  → เข้าใช้งานได้

User คนที่ 2:
  1. กด "เข้าร่วมบ้านที่มีอยู่"
  2. กรอก Household ID ที่คนแรกบอก
  3. กรอก PIN
  4. บันทึก householdId + hashedPIN ใน localStorage
  → เห็นข้อมูลเดียวกันทั้งหมด

ครั้งต่อไป:
  1. เปิดแอพ → หน้า PIN lock
  2. กรอก PIN → เข้าได้ทันที
```

#### Security Considerations

- PIN hashing: ใช้ `crypto.subtle.digest('SHA-256', pin)` ก่อนเก็บ
- Firestore Security Rules: อนุญาตเฉพาะ document ที่มี `householdId` ตรงกัน
- Household ID ควร share แบบ offline (บอกปาก หรือ QR code)
- ถ้า clear localStorage ต้องกรอก Household ID + PIN ใหม่ (acceptable สำหรับ home use)

#### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /households/{householdId}/{document=**} {
      allow read, write: if request.resource.data.householdId == householdId
                         || resource.data.householdId == householdId;
    }
  }
}
```

---

## 5. Data Model

### Firestore Collection Structure

```
/households/{householdId}/
  ├── items/              ← สินค้าที่บันทึกแต่ละชิ้น
  │   └── {itemId}
  ├── templates/          ← ประวัติชื่อ/ยี่ห้อสินค้าสำหรับ autocomplete dropdown
  │   └── {templateId}
  ├── categories/         ← หมวดหมู่ (preset + user-defined)
  │   └── {categoryId}
  └── notificationLogs/   ← log การแจ้งเตือน (ป้องกัน duplicate)
      └── {logId}
```

### TypeScript Interfaces

```typescript
// ประเภทสินค้า — ใช้สร้าง dropdown autocomplete
interface ProductTemplate {
  id: string;
  householdId: string;
  name: string; // "แชมพู Head & Shoulders"
  brand: string; // "Head & Shoulders"
  categoryId: string;
  defaultUnit: string; // "ขวด"
  defaultNotifyDaysBefore: number; // 7
  averageLifespanDays?: number; // คำนวณจากประวัติ
  timesAdded: number; // นับจำนวนครั้งที่เคยซื้อ
  lastPrice?: number; // ราคาล่าสุด
  updatedAt: Timestamp;
}

// สินค้า 1 รายการที่บันทึก
interface ProductItem {
  id: string;
  householdId: string;
  templateId?: string; // อ้างอิง template (ถ้ามี)

  // ข้อมูลหลัก
  name: string;
  brand?: string;
  categoryId: string;

  // วันที่
  purchaseDate: Timestamp; // วันที่ซื้อ
  startDate: Timestamp; // วันที่เริ่มใช้
  expiryDate: Timestamp; // วันหมดอายุ (จากฉลาก หรือประมาณ)

  // รายละเอียด
  price: number; // ราคา (บาท)
  quantity: number; // จำนวน
  unit: string; // "ชิ้น", "ขวด", "kg", "หลอด"
  notes?: string; // หมายเหตุเพิ่มเติม

  // การแจ้งเตือน
  notifyDaysBefore: number; // แจ้งก่อนกี่วัน

  // สถานะ
  status: "active" | "expired" | "depleted";
  // active   = กำลังใช้อยู่
  // expired  = หมดอายุแล้ว (เกิน expiryDate)
  // depleted = ใช้หมดก่อนหมดอายุ (user กดเอง)

  // รูปภาพ
  imageUrl?: string; // Firebase Storage download URL
  imagePath?: string; // Firebase Storage path (สำหรับ delete)

  // Metadata
  createdByPin: string; // PIN hash ของคนที่สร้าง (สำหรับแสดง)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// หมวดหมู่
interface Category {
  id: string;
  householdId: string;
  label: {
    th: string; // "ห้องน้ำ"
    en: string; // "Bathroom"
  };
  color: string; // hex color "#3B82F6"
  icon: string; // lucide icon name "bath"
  isPreset: boolean;
  order: number; // สำหรับ sort
}

// Log การแจ้งเตือน
interface NotificationLog {
  id: string;
  householdId: string;
  itemId: string;
  itemName: string;
  notifiedAt: Timestamp;
  daysBeforeExpiry: number;
  expiryDate: Timestamp;
}
```

### Default Categories (Presets)

```typescript
const DEFAULT_CATEGORIES = [
  {
    id: "bathroom",
    label: { th: "ห้องน้ำ", en: "Bathroom" },
    color: "#3B82F6",
    icon: "bath",
  },
  {
    id: "kitchen",
    label: { th: "ครัว", en: "Kitchen" },
    color: "#10B981",
    icon: "utensils",
  },
  {
    id: "medicine",
    label: { th: "ยา/อาหารเสริม", en: "Medicine" },
    color: "#EF4444",
    icon: "pill",
  },
  {
    id: "food",
    label: { th: "อาหาร/เครื่องดื่ม", en: "Food" },
    color: "#F59E0B",
    icon: "shopping-bag",
  },
  {
    id: "cleaning",
    label: { th: "ทำความสะอาด", en: "Cleaning" },
    color: "#8B5CF6",
    icon: "sparkles",
  },
  {
    id: "laundry",
    label: { th: "ซักรีด", en: "Laundry" },
    color: "#06B6D4",
    icon: "shirt",
  },
  {
    id: "other",
    label: { th: "อื่นๆ", en: "Other" },
    color: "#6B7280",
    icon: "box",
  },
];
```

---

## 6. Feature Specifications

### 6.1 รูปภาพสินค้า (Image Upload)

**Upload Flow:**

```
User เลือก/ถ่ายรูป (3–8 MB)
    ↓
browser-image-compression
    → maxSizeMB: 0.3 (300 KB)
    → maxWidthOrHeight: 800px
    → useWebWorker: true (ไม่ block UI)
    ↓
Upload ไป Firebase Storage
    path: households/{householdId}/items/{itemId}.jpg
    metadata: { cacheControl: 'public, max-age=31536000, immutable' }
    ↓
ได้ download URL → เก็บใน Firestore item.imageUrl
```

**Delete Flow:**

- ลบ item → ลบรูปจาก Storage โดยใช้ `item.imagePath` ด้วยเสมอ
- เปลี่ยนรูป → ลบรูปเก่าก่อน แล้วค่อย upload ใหม่

**Firebase Storage Security Rules:**

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /households/{householdId}/items/{imageFile} {
      // อนุญาตเฉพาะ household เดียวกัน
      // ขนาดไม่เกิน 5 MB, ต้องเป็น image
      allow write: if request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
      allow read:  if true;  // URL มี token อยู่แล้ว ปลอดภัย
    }
  }
}
```

### 6.2 เพิ่มสินค้า (Add Item)

**Autocomplete Dropdown:**

- เมื่อพิมพ์ชื่อสินค้า จะ query `templates` collection
- แสดง dropdown พร้อม suggestion
- เมื่อเลือก template → กรอก field อื่นอัตโนมัติ (brand, category, unit, notifyDays, lastPrice)
- ถ้าพิมพ์ชื่อใหม่ที่ไม่มีใน template → สร้าง template ใหม่อัตโนมัติเมื่อ save

**Validation (Zod):**

```typescript
const itemSchema = z
  .object({
    name: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
    categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
    purchaseDate: z.date(),
    startDate: z.date(),
    expiryDate: z.date(),
    price: z.number().min(0),
    quantity: z.number().min(1),
    unit: z.string().min(1),
    notifyDaysBefore: z.number().min(0).max(365),
    notes: z.string().optional(),
  })
  .refine((d) => d.expiryDate > d.startDate, {
    message: "วันหมดอายุต้องหลังวันเริ่มใช้",
    path: ["expiryDate"],
  });
```

### 6.3 Edit / Delete สินค้า

- Edit: เปิด form เดิม พร้อมข้อมูลที่มีอยู่
- Delete: confirm dialog ก่อนลบ
- Mark as Depleted: ปุ่ม "ใช้หมดแล้ว" บน item detail → เปลี่ยน status เป็น `depleted`

### 6.4 Status Calculation (Client-side)

```typescript
function getItemStatus(
  item: ProductItem,
): "active" | "expiring-soon" | "expired" | "depleted" {
  if (item.status === "depleted") return "depleted";
  const now = new Date();
  const expiry = item.expiryDate.toDate();
  const daysLeft = differenceInDays(expiry, now);
  if (daysLeft < 0) return "expired";
  if (daysLeft <= item.notifyDaysBefore) return "expiring-soon";
  return "active";
}

// Color mapping
const STATUS_COLORS = {
  active: "text-green-600  bg-green-50  border-green-200",
  "expiring-soon": "text-yellow-600 bg-yellow-50 border-yellow-200",
  expired: "text-red-600    bg-red-50    border-red-200",
  depleted: "text-gray-500   bg-gray-50   border-gray-200",
};
```

### 6.5 Categories Management

- หน้า Settings → Categories
- แสดง preset (ลบไม่ได้ แต่ซ่อนได้)
- เพิ่ม/แก้ไข/ลบ custom category
- เลือก color (color picker)
- เลือก icon จาก lucide icon list

### 6.6 Analytics & Graphs

| กราฟ               | ประเภท          | ข้อมูลที่ใช้                                     |
| ------------------ | --------------- | ------------------------------------------------ |
| ค่าใช้จ่ายรายเดือน | Bar Chart       | `price` group by `purchaseDate` เดือน            |
| สัดส่วนตามหมวดหมู่ | Pie/Donut Chart | `price` group by `categoryId`                    |
| ประวัติราคาสินค้า  | Line Chart      | `price` ต่อ `purchaseDate` ของ template เดียวกัน |
| ระยะเวลาใช้เฉลี่ย  | Horizontal Bar  | `expiryDate - startDate` per template            |
| สินค้าที่ซื้อบ่อย  | Bar Chart       | `timesAdded` ของแต่ละ template                   |
| Timeline หมดอายุ   | Gantt-like      | `startDate` → `expiryDate` ของ active items      |

---

## 7. UI Structure & Routing

### Layout

```
App
├── PinGate (wrapper — ตรวจสอบ PIN ก่อน render ทุกหน้า)
│   └── AppShell
│       ├── Header (desktop: top bar, mobile: top bar เล็ก)
│       ├── Sidebar (desktop only)
│       ├── <Outlet /> (page content)
│       └── BottomNav (mobile only)
```

### Routes

```
/                     → redirect → /dashboard
/setup                → หน้าสร้าง/เข้าร่วม household (ครั้งแรก)
/pin                  → หน้ากรอก PIN
/dashboard            → Dashboard
/items                → รายการสินค้าทั้งหมด
/items/new            → เพิ่มสินค้าใหม่
/items/:id            → รายละเอียดสินค้า
/items/:id/edit       → แก้ไขสินค้า
/analytics            → กราฟวิเคราะห์
/settings             → การตั้งค่า
/settings/categories  → จัดการหมวดหมู่
```

### Navigation Items

| Icon            | TH        | EN        | Route      |
| --------------- | --------- | --------- | ---------- |
| LayoutDashboard | หน้าหลัก  | Dashboard | /dashboard |
| Package         | สินค้า    | Items     | /items     |
| BarChart2       | วิเคราะห์ | Analytics | /analytics |
| Settings        | ตั้งค่า   | Settings  | /settings  |

---

## 8. Page-by-Page UI Design

### 8.1 Setup Page (`/setup`)

```
┌─────────────────────────────────────┐
│                                     │
│         🏠  Jeaw                    │
│    Household Item Tracker           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   [สร้างบ้านใหม่]           │   │
│  │   Generate Household ID     │   │
│  │   ตั้ง PIN 4 หลัก           │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │   [เข้าร่วมบ้านที่มีอยู่]    │   │
│  │   กรอก Household ID         │   │
│  │   กรอก PIN                  │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 8.2 Dashboard (`/dashboard`)

```
┌─────────────────────────────────────────┐
│  🏠 Jeaw           🔔(3)    TH/EN  👤  │
├─────────────────────────────────────────┤
│                                         │
│  📊  24 รายการ   |  ⚠️ 3 ใกล้หมด   │
│      Total       |     Expiring         │
│  💰 ฿1,240/เดือน |  🔴 2 หมดแล้ว   │
│                                         │
├── ⚠️  ใกล้หมดอายุ ─────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐│
│  │ 🧴       │ │ 🧻       │ │ 🪥       ││
│  │ แชมพู    │ │ กระดาษ  │ │ ยาสีฟัน ││
│  │ 3 วัน   │ │ 5 วัน   │ │ 7 วัน   ││
│  │ ฿285     │ │ ฿45      │ │ ฿120     ││
│  └──────────┘ └──────────┘ └──────────┘│
│                                         │
├── 📅  Timeline (30 วันข้างหน้า) ────────┤
│  แชมพู      ████████░░░░░░  15 ก.ค.   │
│  ยาสีฟัน   ██████████░░░░  30 ก.ค.   │
│  สบู่       ████████████░░  10 ส.ค.   │
│                                         │
├── หมวดหมู่ ─────────────────────────────┤
│  [ห้องน้ำ 8]  [ครัว 6]  [ยา 4]         │
│  [อาหาร 3]   [ทำความสะอาด 3]           │
└─────────────────────────────────────────┘
```

### 8.3 Items List (`/items`)

```
┌─────────────────────────────────────────┐
│  สินค้า                    [+เพิ่ม]     │
├─────────────────────────────────────────┤
│  🔍 ค้นหาสินค้า...                      │
│  [ทั้งหมด][ห้องน้ำ][ครัว][ยา][อาหาร]  │
│  Sort: [ใกล้หมด ▼]  Filter: [Active ▼] │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ [img] แชมพู Head & Shoulders      │  │
│  │  1:1  ห้องน้ำ  •  ฿285            │  │
│  │       ┤█████████░░░░░░░├ 3 วัน   │  │
│  │       หมดอายุ 15 ก.ค. 2569  🟡   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │ [img] ยาสีฟัน Sensodyne          │  │
│  │  1:1  ห้องน้ำ  •  ฿120            │  │
│  │       ┤██████░░░░░░░░░├  90 วัน  │  │
│  │       หมดอายุ 30 ก.ย. 2569  🟢   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  💊   วิตามิน C (ไม่มีรูป)        │  │
│  │       ยา  •  ฿350                 │  │
│  │       หมดอายุไปแล้ว 2 วัน  🔴    │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Status indicator:**

- 🟢 เขียว = เหลือ > `notifyDaysBefore` วัน
- 🟡 เหลือง = เหลือ ≤ `notifyDaysBefore` วัน
- 🔴 แดง = หมดอายุแล้ว
- ⚫ เทา = `depleted` (ใช้หมดแล้ว)

### 8.4 Add / Edit Item Form (`/items/new`, `/items/:id/edit`)

```
┌─────────────────────────────────────────┐
│  ←  เพิ่มสินค้าใหม่                     │
├─────────────────────────────────────────┤
│                                         │
│  ชื่อสินค้า *                            │
│  ┌─────────────────────────────────┐   │
│  │ พิมพ์หรือเลือก...          🔍  │   │
│  └─────────────────────────────────┘   │
│    ↳ [แชมพู Head & Shoulders] ×5 ซื้อ  │
│    ↳ [แชมพู Pantene]          ×2 ซื้อ  │
│                                         │
│  หมวดหมู่ *         แบรนด์               │
│  ┌──────────────┐  ┌──────────────────┐│
│  │ ห้องน้ำ   ▼ │  │ Head & Shoulders ││
│  └──────────────┘  └──────────────────┘│
│                                         │
│  ราคา (฿) *    จำนวน *   หน่วย *       │
│  ┌──────────┐  ┌───────┐  ┌───────────┐│
│  │    285   │  │   1   │  │ ขวด    ▼ ││
│  └──────────┘  └───────┘  └───────────┘│
│                                         │
│  วันที่ซื้อ *        วันที่เริ่มใช้ *    │
│  ┌──────────────┐  ┌──────────────────┐│
│  │ 01/07/2569  │  │  01/07/2569      ││
│  └──────────────┘  └──────────────────┘│
│                                         │
│  วันหมดอายุ *        แจ้งเตือนก่อน *   │
│  ┌──────────────┐  ┌────┐              │
│  │ 15/10/2569  │  │  7 │ วัน          │
│  └──────────────┘  └────┘              │
│                                         │
│  รูปภาพสินค้า (ไม่บังคับ)               │
│  ┌─────────────────────────────────┐   │
│  │  📷 ถ่ายรูป  |  🖼️ เลือกรูป    │   │
│  │  ─────────────────────────────  │   │
│  │  [preview รูปที่เลือก / ถ่าย]   │   │
│  │  กำลัง compress... (ถ้า upload) │   │
│  └─────────────────────────────────┘   │
│                                         │
│  หมายเหตุ                               │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │           บันทึก                │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 8.5 Item Detail (`/items/:id`)

```
┌─────────────────────────────────────────┐
│  ←  แชมพู Head & Shoulders    ✏️  🗑️  │
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │  [รูปสินค้า — fullwidth 16:9]     │ │
│  │  (skeleton loader ถ้ายังโหลดไม่จบ)│ │
│  └───────────────────────────────────┘ │
│                                         │
│  🟡 เหลืออีก 3 วัน                     │
│  ┌───────────────────────────────────┐ │
│  │  ████████████████░░░░░  87%      │ │
│  │  1 ก.ค. 69          15 ก.ค. 69  │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌─────────────┬─────────────────────┐ │
│  │ หมวดหมู่    │ 🧴 ห้องน้ำ         │ │
│  │ แบรนด์     │ Head & Shoulders    │ │
│  │ ราคา       │ ฿285                │ │
│  │ จำนวน      │ 1 ขวด               │ │
│  │ วันที่ซื้อ  │ 1 ก.ค. 2569        │ │
│  │ วันเริ่มใช้ │ 1 ก.ค. 2569        │ │
│  │ วันหมดอายุ │ 15 ก.ค. 2569       │ │
│  │ แจ้งก่อน  │ 7 วัน               │ │
│  └─────────────┴─────────────────────┘ │
│                                         │
│  [  ✓ ใช้หมดแล้ว  ]                   │
│                                         │
├── 📊 ประวัติสินค้านี้ (ซื้อ 5 ครั้ง) ──┤
│                                         │
│  ราคา (฿)                              │
│  300│      •                           │
│  285│  •  • •  •                       │
│  270│•                                 │
│      ──────────────────────            │
│      ม.ค. ก.พ. มี.ค. เม.ย. ก.ค.       │
│                                         │
│  ระยะเวลาใช้ได้ (วัน)                  │
│  ม.ค. ├──── 95 ─────┤                  │
│  ก.พ. ├─── 88 ────┤                   │
│  มี.ค.├───── 102 ──────┤               │
└─────────────────────────────────────────┘
```

### 8.6 Analytics (`/analytics`)

```
┌─────────────────────────────────────────┐
│  วิเคราะห์         [3 เดือน ▼]          │
├─────────────────────────────────────────┤
│  ค่าใช้จ่ายรายเดือน (฿)                │
│  ┌───────────────────────────────────┐ │
│  │  2,000│          ██              │ │
│  │  1,500│    ██   ████  ██         │ │
│  │  1,000│  ████ ██████████         │ │
│  │       └──────────────────        │ │
│  │        พ.ค.  มิ.ย.  ก.ค.        │ │
│  └───────────────────────────────────┘ │
│                                         │
│  สัดส่วนค่าใช้จ่ายตามหมวด              │
│  ┌───────────────────────────────────┐ │
│  │       ┌──────┐                   │ │
│  │      ╱  45%  ╲  ■ ห้องน้ำ 45%   │ │
│  │     │  ห้องน้ำ│  ■ ครัว    30%   │ │
│  │      ╲      ╱   ■ ยา      15%   │ │
│  │       └──────┘  ■ อื่นๆ  10%    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  สินค้าที่ซื้อบ่อย                      │
│  แชมพู H&S    ████████████  6 ครั้ง   │
│  กระดาษชำระ   ██████████    5 ครั้ง   │
│  สบู่         ████████      4 ครั้ง   │
│                                         │
│  ระยะเวลาใช้เฉลี่ย (วัน)               │
│  ยาสีฟัน  ███████████████  95 วัน     │
│  แชมพู    ████████████     82 วัน     │
│  สบู่     ████████         60 วัน     │
└─────────────────────────────────────────┘
```

### 8.7 Settings (`/settings`)

```
┌─────────────────────────────────────────┐
│  ตั้งค่า                                │
├─────────────────────────────────────────┤
│  ทั่วไป                                 │
│  ┌───────────────────────────────────┐ │
│  │  ภาษา              [🇹🇭 ไทย ▼]   │ │
│  │  Household ID      jeaw-home-x7k  │ │
│  │  เปลี่ยน PIN       →              │ │
│  └───────────────────────────────────┘ │
│                                         │
│  การแจ้งเตือน                           │
│  ┌───────────────────────────────────┐ │
│  │  Push Notifications  [เปิด ◉]    │ │
│  │  เวลาแจ้งเตือน      [08:00 ▼]   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  หมวดหมู่               [จัดการ →]     │
│                                         │
│  ข้อมูล                                 │
│  ┌───────────────────────────────────┐ │
│  │  Export ข้อมูล (JSON)  [Export]   │ │
│  │  นำเข้าข้อมูล (JSON)  [Import]   │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## 9. Notification System

### Architecture

```
เปิดแอพ / Tab focus
    ↓
Check Firestore items ทุก active item
    ↓
daysLeft ≤ notifyDaysBefore ?
    ↓ YES
ตรวจ NotificationLog — เคยแจ้งวันนี้แล้วไหม?
    ↓ NO (ยังไม่เคยแจ้งวันนี้)
ขอ Notification Permission (ครั้งแรก)
    ↓
แสดง Web Push Notification
    +
บันทึก NotificationLog
```

### Web Push (FCM + Service Worker)

```typescript
// src/services/notification.ts

// ขอ permission
async function requestNotificationPermission(): Promise<boolean> {
  const permission = await Notification.requestPermission();
  return permission === "granted";
}

// แสดง notification
function showNotification(item: ProductItem, daysLeft: number) {
  if ("serviceWorker" in navigator && Notification.permission === "granted") {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(`⚠️ ${item.name} ใกล้หมดอายุ`, {
        body:
          daysLeft === 0
            ? "หมดอายุวันนี้!"
            : `เหลืออีก ${daysLeft} วัน (${formatDate(item.expiryDate)})`,
        icon: "/icon-192.png",
        badge: "/badge-72.png",
        tag: item.id, // ป้องกัน duplicate notification
        data: { itemId: item.id, url: `/items/${item.id}` },
        actions: [
          { action: "view", title: "ดูรายละเอียด" },
          { action: "close", title: "ปิด" },
        ],
      });
    });
  }
}
```

### iOS PWA Note

> บน iOS ต้อง Add to Home Screen ก่อนถึงจะรับ push notification ได้ (Safari 16.4+)
> ควรแสดง install prompt ให้ user ทราบ

---

## 10. Internationalization (i18n)

### Library: `react-i18next`

### File Structure

```
src/
  i18n/
    index.ts      ← config
    th.json       ← ภาษาไทย
    en.json       ← English
```

### Translation File Structure

```json
// th.json
{
  "nav": {
    "dashboard": "หน้าหลัก",
    "items": "สินค้า",
    "analytics": "วิเคราะห์",
    "settings": "ตั้งค่า"
  },
  "item": {
    "name": "ชื่อสินค้า",
    "category": "หมวดหมู่",
    "brand": "แบรนด์",
    "price": "ราคา",
    "quantity": "จำนวน",
    "unit": "หน่วย",
    "purchaseDate": "วันที่ซื้อ",
    "startDate": "วันที่เริ่มใช้",
    "expiryDate": "วันหมดอายุ",
    "notifyDaysBefore": "แจ้งเตือนก่อน",
    "notes": "หมายเหตุ",
    "status": {
      "active": "ปกติ",
      "expiringSoon": "ใกล้หมด",
      "expired": "หมดอายุ",
      "depleted": "ใช้หมดแล้ว"
    }
  },
  "dashboard": {
    "totalItems": "รายการทั้งหมด",
    "expiringSoon": "ใกล้หมดอายุ",
    "expired": "หมดอายุแล้ว",
    "monthlySpend": "ค่าใช้จ่ายเดือนนี้"
  },
  "action": {
    "add": "เพิ่ม",
    "edit": "แก้ไข",
    "delete": "ลบ",
    "save": "บันทึก",
    "cancel": "ยกเลิก",
    "confirm": "ยืนยัน",
    "markDepleted": "ใช้หมดแล้ว"
  },
  "notification": {
    "daysLeft_one": "เหลืออีก {{count}} วัน",
    "daysLeft_other": "เหลืออีก {{count}} วัน",
    "expiredDaysAgo_one": "หมดอายุไป {{count}} วันแล้ว",
    "expiredDaysAgo_other": "หมดอายุไป {{count}} วันแล้ว",
    "expiresToday": "หมดอายุวันนี้!"
  }
}
```

### Language Toggle

```tsx
// Header component
const { i18n } = useTranslation()
<button onClick={() => i18n.changeLanguage(i18n.language === 'th' ? 'en' : 'th')}>
  {i18n.language === 'th' ? '🇬🇧 EN' : '🇹🇭 TH'}
</button>
```

Language preference เก็บใน localStorage โดย i18next อัตโนมัติ

---

## 11. PWA & Offline Support

> หมายเหตุ: Image caching รายละเอียดอยู่ใน [Section 12](#12-image-upload--caching)

### vite-plugin-pwa Config

```typescript
// vite.config.ts
import { VitePWA } from "vite-plugin-pwa";

VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["favicon.ico", "apple-touch-icon.png"],
  manifest: {
    name: "Jeaw — Household Tracker",
    short_name: "Jeaw",
    theme_color: "#3B82F6",
    background_color: "#ffffff",
    display: "standalone",
    orientation: "portrait",
    icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    runtimeCaching: [
      {
        // Firestore API — NetworkFirst (ต้องการข้อมูลล่าสุดเสมอ)
        urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
        handler: "NetworkFirst",
        options: { cacheName: "firestore-cache" },
      },
      {
        // Firebase Storage images — CacheFirst (รูปไม่เปลี่ยน URL ถ้าไม่ upload ใหม่)
        urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
        handler: "CacheFirst",
        options: {
          cacheName: "item-images",
          expiration: {
            maxEntries: 100, // เก็บสูงสุด 100 รูป
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 วัน
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
  },
});
```

### Firestore Offline

```typescript
// src/lib/firebase.ts
import { enableIndexedDbPersistence } from "firebase/firestore";

enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    // หลาย tabs เปิดพร้อมกัน — offline ไม่ทำงานใน tab นี้
    console.warn("Offline persistence unavailable (multiple tabs)");
  }
});
```

### Offline Behavior

| สถานการณ์                  | พฤติกรรม                                 |
| -------------------------- | ---------------------------------------- |
| เปิดแอพไม่มีเน็ต           | แสดงข้อมูลจาก IndexedDB cache            |
| เพิ่ม/แก้ไขสินค้าไม่มีเน็ต | เขียนลง IndexedDB queue                  |
| กลับมาออนไลน์              | Firestore sync อัตโนมัติ                 |
| User 2 เห็นการเปลี่ยนแปลง  | Real-time listener อัพเดททันทีที่ออนไลน์ |

---

## 12. Image Upload & Caching _(deferred — ต้องการ Firebase Blaze plan)_

> **สถานะ:** Firebase Storage ต้องการ Blaze plan (pay-as-you-go) จึงข้ามไปก่อน
> ทางเลือกในอนาคต: Firebase Storage (upgrade Blaze) หรือ Cloudinary free tier (25 GB)
> ส่วน `imageUrl?: string` และ `imagePath?: string` ใน `ProductItem` interface ยังคงอยู่ — พร้อมเพิ่ม feature ได้ทีหลัง

### ทำไมไม่เก็บ Base64 ใน Firestore

| วิธี                       | ปัญหา                                                           |
| -------------------------- | --------------------------------------------------------------- |
| Base64 ใน Firestore        | document limit 1 MB, ทุก query โหลดรูปมาด้วย, เปลือง read quota |
| **Firebase Storage + URL** | ✅ แยกออกจาก database, cache ได้, ลบได้ง่าย                     |

### Firebase Free Tier สำหรับรูปภาพ

| Quota        | ฟรี  | 2 Users ใช้จริง                            |
| ------------ | ---- | ------------------------------------------ |
| Storage      | 5 GB | ~100 รูป × 300KB = ~30 MB                  |
| Download/วัน | 1 GB | เปิดแอพ 20 ครั้ง × 10 รูป × 300KB = ~60 MB |
| Upload/วัน   | 1 GB | upload วันละ 1–2 รูป = ~600 KB             |

→ ปลอดภัยมาก ไม่มีทางเกิน free tier

### 3 Layers ของ Image Caching

```
Layer 1: Compression ก่อน Upload
─────────────────────────────────
รูปจากกล้อง (3–8 MB)
    ↓  browser-image-compression
    → maxSizeMB: 0.3
    → maxWidthOrHeight: 800px
    → useWebWorker: true
รูปที่ compress แล้ว (~200–300 KB)
    ↓
Upload ไป Firebase Storage
    + metadata: { cacheControl: 'public, max-age=31536000, immutable' }
    ← HTTP Cache-Control บอก browser เก็บ 1 ปี

Layer 2: Browser HTTP Cache (อัตโนมัติ)
─────────────────────────────────────────
โหลดรูปครั้งแรก → browser เก็บใน disk cache
โหลดรูปครั้งต่อไป (ใน session เดิม) → จาก disk cache ทันที
    → ไม่กิน Firebase bandwidth เลย

Layer 3: Service Worker Cache (ข้าม session)
──────────────────────────────────────────────
Strategy: CacheFirst
    → เปิดรูปจาก SW cache ก่อนเสมอ
    → ถ้าไม่มีใน cache → โหลดจาก Firebase → เก็บลง cache
Expiry: 30 วัน, สูงสุด 100 รูป (LRU eviction)
Offline: รูปที่เคยเปิดแล้ว → ดูได้แม้ไม่มีเน็ต
```

### Upload Service Code

```typescript
// src/services/storage.ts
import imageCompression from "browser-image-compression";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage } from "@/lib/firebase";

export async function uploadItemImage(
  file: File,
  householdId: string,
  itemId: string,
): Promise<{ url: string; path: string }> {
  // 1. Compress
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.3,
    maxWidthOrHeight: 800,
    useWebWorker: true,
  });

  // 2. Upload พร้อม cache header
  const path = `households/${householdId}/items/${itemId}.jpg`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressed, {
    contentType: "image/jpeg",
    cacheControl: "public, max-age=31536000, immutable",
    customMetadata: { householdId },
  });

  // 3. Return URL + path
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

export async function deleteItemImage(imagePath: string): Promise<void> {
  const storageRef = ref(storage, imagePath);
  await deleteObject(storageRef);
}
```

### UI Component: ImagePicker

```typescript
// src/components/items/ImagePicker.tsx
// States:
//   idle      → แสดงปุ่ม "ถ่ายรูป" และ "เลือกรูป"
//   preview   → แสดง preview รูปที่เลือก + ปุ่ม "ลบ"
//   uploading → แสดง progress bar (compress + upload)
//   error     → แสดง error message + retry
```

### Skeleton Loader สำหรับรูป

ใช้ `loading="lazy"` + CSS skeleton ทุกที่ที่มีรูป:

```tsx
// ItemCard
<div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
  {item.imageUrl ? (
    <img
      src={item.imageUrl}
      alt={item.name}
      loading="lazy"
      className="w-full h-full object-cover"
    />
  ) : (
    <CategoryIcon
      id={item.categoryId}
      className="w-8 h-8 text-gray-400 m-auto"
    />
  )}
</div>
```

---

## 13. Project File Structure

```
jeaw/
├── public/
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── apple-touch-icon.png
│   └── badge-72.png
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   │
│   ├── lib/
│   │   ├── firebase.ts          ← Firebase init + Firestore config
│   │   └── utils.ts             ← cn(), formatDate(), etc.
│   │
│   ├── i18n/
│   │   ├── index.ts
│   │   ├── th.json
│   │   └── en.json
│   │
│   ├── types/
│   │   └── index.ts             ← ProductItem, Category, etc. interfaces
│   │
│   ├── hooks/
│   │   ├── useHousehold.ts      ← household ID + PIN state
│   │   ├── useItems.ts          ← Firestore real-time items
│   │   ├── useTemplates.ts      ← product templates / autocomplete
│   │   ├── useCategories.ts     ← categories CRUD
│   │   └── useNotifications.ts  ← check & fire notifications
│   │
│   ├── services/
│   │   ├── items.ts             ← Firestore CRUD for items
│   │   ├── templates.ts         ← Firestore CRUD for templates
│   │   ├── categories.ts        ← Firestore CRUD for categories
│   │   ├── storage.ts           ← Firebase Storage: upload, delete, compress
│   │   └── notifications.ts     ← Web Push + FCM logic
│   │
│   ├── components/
│   │   ├── ui/                  ← shadcn/ui base components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Dialog.tsx
│   │   │   ├── Select.tsx
│   │   │   └── ...
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── BottomNav.tsx
│   │   ├── items/
│   │   │   ├── ItemCard.tsx
│   │   │   ├── ItemStatusBadge.tsx
│   │   │   ├── ItemProgressBar.tsx
│   │   │   ├── ItemForm.tsx
│   │   │   └── ImagePicker.tsx  ← camera/gallery picker + compress preview
│   │   ├── charts/
│   │   │   ├── MonthlySpendChart.tsx
│   │   │   ├── CategoryPieChart.tsx
│   │   │   ├── PriceHistoryChart.tsx
│   │   │   ├── LifespanChart.tsx
│   │   │   └── ExpiryTimeline.tsx
│   │   └── common/
│   │       ├── PinGate.tsx
│   │       ├── ConfirmDialog.tsx
│   │       ├── EmptyState.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   └── pages/
│       ├── Setup.tsx
│       ├── Pin.tsx
│       ├── Dashboard.tsx
│       ├── Items.tsx
│       ├── ItemDetail.tsx
│       ├── ItemForm.tsx
│       ├── Analytics.tsx
│       └── Settings.tsx
│
├── DESIGN.md                    ← ไฟล์นี้
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

---

## 14. Implementation Roadmap

### Phase 1 — Foundation

- [ ] ติดตั้ง dependencies ทั้งหมด
- [ ] ตั้งค่า Tailwind CSS + shadcn/ui
- [ ] ตั้งค่า Firebase project + Firestore + Security Rules
- [ ] ตั้งค่า React Router
- [ ] ตั้งค่า react-i18next (th/en)
- [ ] ตั้งค่า vite-plugin-pwa
- [ ] สร้าง type definitions
- [ ] สร้าง AppShell + navigation (mobile bottom nav + desktop sidebar)

### Phase 2 — Auth & Access

- [ ] หน้า Setup (สร้าง / เข้าร่วม household)
- [ ] หน้า PIN
- [ ] PinGate component (protect routes)
- [ ] useHousehold hook

### Phase 3 — Core Item CRUD

- [ ] Firestore service functions
- [ ] useItems hook (real-time listener)
- [ ] useTemplates hook (autocomplete)
- [ ] หน้า Items list พร้อม filter/sort
- [ ] ItemCard component + status indicator + thumbnail
- [ ] ItemForm (Add/Edit) พร้อม autocomplete dropdown
- [ ] ItemDetail page พร้อม progress bar + รูปภาพ
- [ ] Delete + Mark Depleted

### Phase 4 — Categories

- [ ] Default categories seed ใน Firestore
- [ ] useCategories hook
- [ ] Settings → Categories management page

### Phase 5 — Dashboard

- [ ] Dashboard page
- [ ] Expiring soon cards
- [ ] Expiry timeline chart
- [ ] Summary stats

### Phase 6 — Analytics

- [ ] MonthlySpendChart
- [ ] CategoryPieChart
- [ ] PriceHistoryChart (per template)
- [ ] LifespanChart
- [ ] Analytics page

### Phase 7 — Notifications

- [ ] Request notification permission flow
- [ ] Check expiring items on app open
- [ ] Show Web Push notification
- [ ] NotificationLog (ป้องกัน duplicate)
- [ ] FCM setup สำหรับ background push

### Phase 8 — Image Upload

- [ ] ติดตั้ง `browser-image-compression`
- [ ] `storage.ts` service (upload, delete)
- [ ] Firebase Storage Security Rules
- [ ] `ImagePicker.tsx` component (camera + gallery + preview + progress)
- [ ] เพิ่ม `imageUrl` / `imagePath` ใน item form
- [ ] แสดง thumbnail ใน ItemCard + ItemDetail
- [ ] Skeleton loader สำหรับรูป
- [ ] ลบรูปเมื่อลบ item
- [ ] เปลี่ยนรูปใน edit form (ลบเก่า → upload ใหม่)

### Phase 9 — Polish

- [ ] Offline indicator (เมื่อไม่มีเน็ต)
- [ ] Install PWA prompt
- [ ] Export/Import JSON
- [ ] Loading states + Empty states
- [ ] Error handling + Toast notifications
- [ ] Responsive design QA (mobile/desktop)

---

_Document maintained alongside codebase — อัพเดทเมื่อ design เปลี่ยน_
