import Pusher from "pusher";

/**
 * Server-side Pusher client used to push a lightweight "something changed"
 * signal to the browsers watching a party. It never carries party data — the
 * client re-fetches the source-of-truth endpoint when it receives the signal.
 *
 * This module must only be imported from server code (Server Actions).
 */

let client: Pusher | null = null;

/**
 * Lazily builds a single Pusher client from the environment. Returns `null`
 * when the credentials are absent, so realtime stays strictly optional: the
 * app keeps working through the client's low-frequency fallback fetch.
 */
function getPusherServer(): Pusher | null {
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } =
    process.env;

  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    return null;
  }

  if (!client) {
    client = new Pusher({
      appId: PUSHER_APP_ID,
      key: PUSHER_KEY,
      secret: PUSHER_SECRET,
      cluster: PUSHER_CLUSTER,
      useTLS: true,
    });
  }

  return client;
}

/** Channel name for a party. Codes are uppercase alphanumerics. */
function partyChannel(partyCode: string): string {
  return `party-${partyCode.toUpperCase()}`;
}

/**
 * Notifies every subscriber of a party that its state changed. Emits an empty
 * `"updated"` event; subscribers react by fetching the fresh state once.
 *
 * A failed or unconfigured notification must never break the mutation that was
 * already persisted, so problems are logged and swallowed here (never thrown).
 */
export async function notifyPartyChanged(partyCode: string): Promise<void> {
  const pusher = getPusherServer();

  if (!pusher) {
    // Missing credentials: realtime disabled, clients rely on the fallback.
    console.warn(
      "Pusher is not configured; skipping realtime notification for party",
      partyCode,
    );
    return;
  }

  try {
    await pusher.trigger(partyChannel(partyCode), "updated", {});
  } catch (error) {
    console.error("Failed to notify party change via Pusher", error);
  }
}
