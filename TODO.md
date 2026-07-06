# Jeaw — TODO List

อิงจาก [DESIGN.md](DESIGN.md) v1.1

---

## Phase 1 — Foundation

- [x] ติดตั้ง dependencies ทั้งหมด
- [x] ติดตั้ง devDependencies
- [x] ตั้งค่า Tailwind CSS
- [x] ติดตั้งและตั้งค่า shadcn/ui
- [x] สร้าง Firebase project (Firestore + FCM — ข้าม Storage ดู Phase 8)
- [x] ตั้งค่า Firestore Security Rules
- [x] ตั้งค่า React Router v6
- [x] ตั้งค่า react-i18next พร้อมไฟล์ `th.json` และ `en.json`
- [x] ตั้งค่า vite-plugin-pwa + manifest
- [x] สร้าง type definitions (`src/types/index.ts`) — ProductItem, ProductTemplate, Category, NotificationLog
- [x] สร้าง `src/lib/firebase.ts` (Firebase init + Firestore offline persistence)
- [x] สร้าง `src/lib/utils.ts` (cn(), formatDate(), etc.)
- [x] สร้าง AppShell layout component
- [x] สร้าง Header component
- [x] สร้าง Sidebar component (desktop)
- [x] สร้าง BottomNav component (mobile)

---

## Phase 2 — Auth & Access

- [x] สร้างหน้า Setup (`/setup`) — สร้างบ้านใหม่ / เข้าร่วมบ้านที่มีอยู่
- [x] สร้างหน้า PIN (`/pin`) — กรอก PIN เพื่อเข้าใช้งาน
- [x] สร้าง PinGate component (protect routes)
- [x] สร้าง `useHousehold` hook (householdId + PIN state จาก localStorage)
- [x] PIN hashing ด้วย `crypto.subtle.digest('SHA-256', pin)`
- [x] Logic generate Household ID อัตโนมัติ

---

## Phase 3 — Core Item CRUD

- [x] สร้าง `src/services/items.ts` (Firestore CRUD — add, get, update, delete, real-time listener)
- [x] สร้าง `src/services/templates.ts` (Firestore CRUD for product templates)
- [x] สร้าง `useItems` hook (real-time Firestore listener)
- [x] สร้าง `useTemplates` hook (autocomplete query)
- [x] สร้างหน้า Items list (`/items`) พร้อม search, filter by category, sort
- [x] สร้าง `ItemStatusBadge` component (🟢🟡🔴⚫)
- [x] สร้าง `ItemProgressBar` component (แสดง % ของอายุการใช้งาน)
- [x] สร้าง `ItemCard` component (thumbnail + status + progress bar)
- [x] สร้าง `ItemForm` component พร้อม autocomplete dropdown (Add/Edit)
- [x] Zod validation schema สำหรับ ItemForm
- [x] สร้างหน้า Add Item (`/items/new`)
- [x] สร้างหน้า Edit Item (`/items/:id/edit`)
- [x] สร้างหน้า Item Detail (`/items/:id`) พร้อม progress bar + ประวัติราคา + ระยะเวลาใช้
- [x] ปุ่ม Delete item (พร้อม confirm dialog)
- [x] ปุ่ม "ใช้หมดแล้ว" (mark as depleted)
- [x] Auto-create/update ProductTemplate เมื่อ save item ใหม่

---

## Phase 4 — Categories

- [x] สร้าง `src/services/categories.ts` (Firestore CRUD)
- [x] Seed default categories เข้า Firestore ครั้งแรก (7 preset categories)
- [x] สร้าง `useCategories` hook
- [x] สร้างหน้า Categories management (`/settings/categories`)
- [x] Add / Edit / Delete custom category
- [x] Color picker สำหรับ category
- [x] Icon picker (lucide icon list) สำหรับ category
- [x] ซ่อน/แสดง preset category (ลบไม่ได้)

---

## Phase 5 — Dashboard

- [x] สร้างหน้า Dashboard (`/dashboard`)
- [x] Summary stats cards (total items, expiring soon, expired, monthly spend)
- [x] Expiring soon cards (scroll horizontal)
- [x] Expiry timeline chart (Gantt-like, 30 วันข้างหน้า)
- [x] Category chips พร้อม item count

---

## Phase 6 — Analytics

- [x] สร้างหน้า Analytics (`/analytics`) พร้อม date range picker
- [x] `MonthlySpendChart` — Bar chart ค่าใช้จ่ายรายเดือน
- [x] `CategoryPieChart` — Pie/Donut chart สัดส่วนตามหมวดหมู่
- [x] `PriceHistoryChart` — Line chart ประวัติราคาของ template เดียวกัน (ใน Item Detail)
- [x] `LifespanChart` — Horizontal bar chart ระยะเวลาใช้เฉลี่ย
- [x] `ExpiryTimeline` — Gantt-like chart (ใน Dashboard)
- [x] กราฟสินค้าที่ซื้อบ่อย — Bar chart จาก timesAdded

---

## Phase 7 — Notifications

- [x] สร้าง `src/services/notifications.ts`
- [x] ขอ Notification permission flow (ครั้งแรกที่เข้าแอพ)
- [x] Logic ตรวจ expiring items เมื่อเปิดแอพ / tab focus
- [x] แสดง Web Push Notification ผ่าน Service Worker
- [x] บันทึก NotificationLog เพื่อป้องกันแจ้งซ้ำในวันเดียวกัน
- [x] สร้าง `useNotifications` hook
- [x] ตั้งค่า FCM (Firebase Cloud Messaging) สำหรับ background push
- [x] iOS PWA install prompt ("Add to Home Screen")
- [x] Notification badge บน bell icon ใน Header
- [x] ตั้งค่าเวลาแจ้งเตือนใน Settings

---

## (Skip) Phase 8 — Image Upload _(deferred — ต้องการ Firebase Blaze plan)_

> **หมายเหตุ:** Firebase Storage ต้อง upgrade เป็น Blaze plan (pay-as-you-go)
> ทางเลือก: Cloudinary free tier (25 GB) หรือ upgrade Blaze แล้วค่อยทำ

- [ ] ตัดสินใจ: Firebase Storage (Blaze) หรือ Cloudinary
- [ ] สร้าง `src/services/storage.ts` (uploadItemImage, deleteItemImage)
- [ ] ตั้งค่า Storage Security Rules (max 5 MB, image only)
- [ ] `browser-image-compression` — compress ก่อน upload (maxSizeMB: 0.3, maxWidthOrHeight: 800)
- [ ] ตั้งค่า Cache-Control header ตอน upload (`public, max-age=31536000, immutable`)
- [ ] สร้าง `ImagePicker.tsx` component (states: idle / preview / uploading / error)
- [ ] รองรับกล้อง (capture) และ gallery บน mobile
- [ ] เพิ่ม `imageUrl` / `imagePath` field ใน ItemForm
- [ ] แสดง thumbnail (1:1) ใน ItemCard
- [ ] แสดงรูป fullwidth (16:9) พร้อม skeleton loader ใน ItemDetail
- [ ] ลบรูปจาก Storage เมื่อ delete item
- [ ] เปลี่ยนรูปใน edit form (ลบเก่า → upload ใหม่)
- [ ] Fallback แสดง category icon เมื่อไม่มีรูป

---

## Phase 9 — Polish

- [x] Offline indicator banner (เมื่อ network ขาด) — `OfflineBanner.tsx` + AppShell
- [x] PWA install prompt component — `InstallPrompt.tsx` (Phase 7)
- [x] Export ข้อมูลเป็น JSON — SettingsPage
- [x] Import ข้อมูลจาก JSON — SettingsPage
- [ ] Loading states ทุก async operation
- [ ] Empty states ทุกหน้า (ยังไม่มีข้อมูล)
- [x] Error handling + Toast notifications (sonner) — AppShell Toaster + ItemDetailPage + SettingsPage
- [x] Confirm dialog สำหรับ destructive actions — `ConfirmDialog.tsx` (delete, import, leave)
- [x] ปุ่ม "ออกจากบ้าน" ใน Settings — clear localStorage + redirect ไป /setup (พร้อม confirm dialog)
- [ ] Responsive design QA บน mobile (iOS Safari, Android Chrome)
- [ ] Responsive design QA บน desktop
- [x] อยากให้ตอนสร้างบ้าน สามารถใส่ชื่อบ้านได้ และเอามาแสดงแทนคำว่า "หน้าหลัก" (validate ชื่อ และจำนวนตัวอักษรให้ดีด้วย)

---

_อัพเดทเมื่อทำงานเสร็จแต่ละ task_
