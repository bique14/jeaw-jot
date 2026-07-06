import { z } from "zod";

export const itemSchema = z
  .object({
    name: z.string().min(1, "กรุณากรอกชื่อสินค้า"),
    brand: z.string().optional(),
    categoryId: z.string().min(1, "กรุณาเลือกหมวดหมู่"),
    purchaseDate: z.string().min(1, "กรุณาเลือกวันที่ซื้อ"),
    startDate: z.string().min(1, "กรุณาเลือกวันที่เริ่มใช้"),
    expiryDate: z.string().min(1, "กรุณาเลือกวันหมดอายุ"),
    price: z.coerce.number().min(0, "ราคาต้องไม่ติดลบ"),
    quantity: z.coerce.number().min(1, "จำนวนต้องมากกว่า 0"),
    unit: z.string().min(1, "กรุณากรอกหน่วย"),
    notifyDaysBefore: z.coerce.number().min(0).max(365),
    notes: z.string().optional(),
  })
  .refine((data) => new Date(data.expiryDate) > new Date(data.startDate), {
    message: "วันหมดอายุต้องหลังวันที่เริ่มใช้",
    path: ["expiryDate"],
  });

export type ItemFormValues = z.infer<typeof itemSchema>;

export const DEFAULT_UNITS = [
  "ชิ้น",
  "กล่อง",
  "ขวด",
  "หลอด",
  "แพ็ค",
  "อัน",
  "ถุง",
  "kg",
  "g",
  "ml",
  "L",
];

export const DEFAULT_NOTIFY_DAYS = 7;
