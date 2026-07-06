/**
 * Per-browser device identity for DM recognition.
 *
 * The device id is a random UUID stored in localStorage. It is not a hardware
 * fingerprint: clearing storage or switching browser yields a new identity
 * (the recovery code exists to re-adopt a DM's parties on a new device).
 */

const DEVICE_ID_KEY = "dnd-device-id";

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (e.g. private mode): fall back to an ephemeral id
    return crypto.randomUUID();
  }
}

/** A cosmetic label for the current device, derived from the user agent. */
export function getDeviceLabel(): string {
  if (typeof navigator === "undefined") return "Unknown";
  const ua = navigator.userAgent;

  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/Android/i.test(ua)) return "Android";
  if (/Macintosh|Mac OS X/i.test(ua)) return "Mac";
  if (/Windows/i.test(ua)) return "Windows";
  if (/Linux/i.test(ua)) return "Linux";
  return "Unknown";
}
