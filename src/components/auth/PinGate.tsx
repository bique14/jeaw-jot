import { Navigate, Outlet } from "react-router-dom";
import {
  getStoredHouseholdId,
  getStoredPinHash,
  isSessionVerified,
} from "@/lib/pin";

/**
 * PinGate — ตรวจสอบสิทธิ์ก่อนเข้าหน้าที่ต้องการ PIN
 *
 * Logic:
 *   ไม่มี householdId  → /setup
 *   มี householdId แต่ยังไม่ verify PIN ใน session นี้ → /pin
 *   verify แล้ว → แสดง children ตามปกติ
 */
export default function PinGate() {
  const householdId = getStoredHouseholdId();
  const pinHash = getStoredPinHash();

  if (!householdId || !pinHash) {
    return <Navigate to="/setup" replace />;
  }

  if (!isSessionVerified()) {
    return <Navigate to="/pin" replace />;
  }

  return <Outlet />;
}
