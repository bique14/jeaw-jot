import {
  getStoredHouseholdId,
  getStoredPinHash,
  getStoredHouseName,
} from "@/lib/pin";

export interface HouseholdState {
  householdId: string | null;
  hasPin: boolean;
  isReady: boolean;
  houseName: string | null;
}

export function useHousehold(): HouseholdState {
  const householdId = getStoredHouseholdId();
  const pinHash = getStoredPinHash();
  const houseName = getStoredHouseName();

  return {
    householdId,
    hasPin: !!pinHash,
    isReady: !!householdId && !!pinHash,
    houseName,
  };
}
