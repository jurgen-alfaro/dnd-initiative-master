/**
 * localStorage-backed storage for the per-party DM token.
 *
 * The token is written once, at party creation, on the creator's device. It is
 * the sole source of truth for DM status: it never travels in the URL, so
 * tampering with query params (e.g. adding `?dm=true`) cannot grant DM access.
 * The server still validates the token for any note operation.
 */

export const dmTokenKey = (code: string) => `dnd-dm-token-${code}`;

export function storeDmToken(code: string, token: string): void {
  try {
    localStorage.setItem(dmTokenKey(code), token);
  } catch {
    // localStorage may be unavailable (e.g. private mode); DM role just
    // won't persist on this device.
  }
}

export function readDmToken(code: string): string | null {
  try {
    return localStorage.getItem(dmTokenKey(code));
  } catch {
    return null;
  }
}
