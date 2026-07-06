import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { FirebaseError } from "firebase/app";
import { db } from "@/lib/firebase";

const COLLECTION = "households";

export type CreateHouseholdAuthResult = "ok" | "forbidden" | "failed";
export type VerifyHouseholdPinResult =
  | "ok"
  | "not-found"
  | "wrong-pin"
  | "forbidden"
  | "failed";

function rootRef(householdId: string) {
  return doc(db, COLLECTION, householdId);
}

function scopedRef(householdId: string) {
  return doc(db, COLLECTION, householdId, "meta", "auth");
}

function isPermissionDenied(error: unknown): boolean {
  return error instanceof FirebaseError && error.code === "permission-denied";
}

/**
 * Create household auth record when a new household is created.
 */
export async function createHouseholdAuth(
  householdId: string,
  pinHash: string,
  houseName?: string,
): Promise<CreateHouseholdAuthResult> {
  const payload = {
    householdId,
    pinHash,
    houseName: houseName ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(rootRef(householdId), payload);
    return "ok";
  } catch (error) {
    if (!isPermissionDenied(error)) return "failed";
  }

  try {
    await setDoc(scopedRef(householdId), payload);
    return "ok";
  } catch (error) {
    return isPermissionDenied(error) ? "forbidden" : "failed";
  }
}

/**
 * Verify join request by checking household existence + hashed PIN.
 */
export async function verifyHouseholdPin(
  householdId: string,
  pinHash: string,
): Promise<VerifyHouseholdPinResult> {
  let rootDenied = false;
  try {
    const snap = await getDoc(rootRef(householdId));
    if (snap.exists()) {
      const data = snap.data() as { pinHash?: string };
      if (!data.pinHash) return "wrong-pin";
      return data.pinHash === pinHash ? "ok" : "wrong-pin";
    }
  } catch (error) {
    if (isPermissionDenied(error)) rootDenied = true;
    else return "failed";
  }

  let scopedDenied = false;
  try {
    const snap = await getDoc(scopedRef(householdId));
    if (!snap.exists()) {
      if (rootDenied) return "forbidden";
      return "not-found";
    }

    const data = snap.data() as { pinHash?: string };
    if (!data.pinHash) return "wrong-pin";
    return data.pinHash === pinHash ? "ok" : "wrong-pin";
  } catch (error) {
    if (isPermissionDenied(error)) scopedDenied = true;
    else return "failed";
  }

  if (rootDenied || scopedDenied) return "forbidden";
  return "not-found";
}

export async function updateHouseholdPin(
  householdId: string,
  pinHash: string,
): Promise<void> {
  try {
    await updateDoc(rootRef(householdId), {
      householdId,
      pinHash,
      updatedAt: serverTimestamp(),
    });
    return;
  } catch {
    await updateDoc(scopedRef(householdId), {
      householdId,
      pinHash,
      updatedAt: serverTimestamp(),
    });
  }
}
