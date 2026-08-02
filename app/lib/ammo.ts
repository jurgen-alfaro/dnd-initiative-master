import type { Ammo } from "@/app/lib/types";

// Single glyph for every kind of ammunition: the name carries the distinction,
// the icon only says "this is ammo".
export const AMMO_GLYPH = "\u{1F3F9}"; // 🏹

// Quantity as shown on the card: "18" without a quiver, "18/20" with one.
export function formatAmmoCount(ammo: Ammo): string {
  return ammo.max === null ? String(ammo.count) : `${ammo.count}/${ammo.max}`;
}

// Keeps a quantity inside [0, max] — used by the quick adjust buttons so a
// tap can never push a quiver below empty or above its capacity.
export function clampAmmoCount(count: number, max: number | null): number {
  const floored = Math.max(0, count);
  return max === null ? floored : Math.min(floored, max);
}
