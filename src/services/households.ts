import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION = "households";

export type VerifyHouseholdPinResult = "ok" | "not-found" | "wrong-pin";

/**
 * Create household auth record when a new household is created.
 */
export async function createHouseholdAuth(
  householdId: string,
  pinHash: string,
  houseName?: string,
): Promise<void> {
  await setDoc(doc(db, COLLECTION, householdId), {
    pinHash,
    houseName: houseName ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Verify join request by checking household existence + hashed PIN.
 */
export async function verifyHouseholdPin(
  householdId: string,
  pinHash: string,
): Promise<VerifyHouseholdPinResult> {
  const snap = await getDoc(doc(db, COLLECTION, householdId));
  if (!snap.exists()) return "not-found";

  const data = snap.data() as { pinHash?: string };
  if (!data.pinHash) return "wrong-pin";
  return data.pinHash === pinHash ? "ok" : "wrong-pin";
}

export async function updateHouseholdPin(
  householdId: string,
  pinHash: string,
): Promise<void> {
  await updateDoc(doc(db, COLLECTION, householdId), {
    pinHash,
    updatedAt: serverTimestamp(),
  });
}
