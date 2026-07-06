const STORAGE_KEYS = {
  householdId: "jeaw_household_id",
  pinHash: "jeaw_pin_hash",
  sessionVerified: "jeaw_session_verified",
  houseName: "jeaw_house_name",
} as const;

export function generateHouseholdId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const random = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map((b) => chars[b % chars.length])
    .join("");
  return `jeaw-home-${random}`;
}

export async function hashPin(pin: string): Promise<string> {
  const encoded = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getStoredHouseholdId(): string | null {
  return localStorage.getItem(STORAGE_KEYS.householdId);
}

export function getStoredPinHash(): string | null {
  return localStorage.getItem(STORAGE_KEYS.pinHash);
}

export function saveHousehold(
  householdId: string,
  pinHash: string,
  houseName?: string,
): void {
  localStorage.setItem(STORAGE_KEYS.householdId, householdId);
  localStorage.setItem(STORAGE_KEYS.pinHash, pinHash);
  localStorage.setItem(STORAGE_KEYS.sessionVerified, "true");
  if (houseName) localStorage.setItem(STORAGE_KEYS.houseName, houseName);
}

export function getStoredHouseName(): string | null {
  return localStorage.getItem(STORAGE_KEYS.houseName);
}

export function saveHouseName(name: string): void {
  localStorage.setItem(STORAGE_KEYS.houseName, name);
}

export function clearHousehold(): void {
  localStorage.removeItem(STORAGE_KEYS.householdId);
  localStorage.removeItem(STORAGE_KEYS.pinHash);
  localStorage.removeItem(STORAGE_KEYS.houseName);
  sessionStorage.removeItem(STORAGE_KEYS.sessionVerified);
}

export function markSessionVerified(): void {
  sessionStorage.setItem(STORAGE_KEYS.sessionVerified, "true");
}

export function isSessionVerified(): boolean {
  return sessionStorage.getItem(STORAGE_KEYS.sessionVerified) === "true";
}

export function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEYS.sessionVerified);
}
