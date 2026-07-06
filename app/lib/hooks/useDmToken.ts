import { useSyncExternalStore } from "react";
import { readDmToken } from "@/app/lib/dm-token";

// The stored token doesn't change within a session in our flow, so there's
// nothing to subscribe to; return a no-op unsubscribe.
const noopSubscribe = () => () => {};

/**
 * Returns the party's DM token from localStorage, or `null` when this browser
 * is not the DM.
 *
 * The token is written only at party creation (see storeDmToken), so DM status
 * cannot be forged by editing the URL. useSyncExternalStore reads the value
 * after hydration (server snapshot is null), avoiding hydration mismatches.
 */
export function useDmToken(code: string): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => readDmToken(code),
    () => null,
  );
}
