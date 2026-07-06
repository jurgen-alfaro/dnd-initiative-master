import { useEffect, useSyncExternalStore } from "react";

const keyFor = (code: string) => `dnd-dm-token-${code}`;

// The stored token doesn't change within a session in our flow, so there's
// nothing to subscribe to; return a no-op unsubscribe.
const noopSubscribe = () => () => {};

/**
 * Resolves the DM token for a party and persists it across visits.
 *
 * Precedence:
 *  1. A fresh token in the URL (`?dm=<token>`) — persisted to localStorage so
 *     the DM keeps their role when they return without the query param.
 *  2. A previously stored token for this party — used when no URL token is
 *     present (e.g. the DM re-opens the party from the recent-party card, or
 *     re-joins by code).
 *
 * The legacy literal `?dm=true` is treated as a UI-only flag: it is never a
 * real token and is never persisted.
 *
 * Returns the resolved token, or `null` when this browser is not the DM.
 */
export function useDmToken(
  code: string,
  urlParam: string | null,
): string | null {
  const isRealToken = !!urlParam && urlParam !== "" && urlParam !== "true";

  // Read a previously stored token from localStorage. useSyncExternalStore
  // reads it after hydration (server snapshot is null), avoiding both hydration
  // mismatches and setState-in-effect.
  const storedToken = useSyncExternalStore(
    noopSubscribe,
    () => {
      try {
        return localStorage.getItem(keyFor(code));
      } catch {
        return null;
      }
    },
    () => null,
  );

  // Persist a fresh token from the URL for future visits (write-only effect).
  useEffect(() => {
    if (!isRealToken) return;
    try {
      localStorage.setItem(keyFor(code), urlParam);
    } catch {
      // localStorage may be unavailable (e.g. private mode); the DM role
      // simply won't persist across visits in that case.
    }
  }, [code, urlParam, isRealToken]);

  return isRealToken ? urlParam : storedToken;
}
