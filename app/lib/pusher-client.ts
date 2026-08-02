import Pusher from "pusher-js";

/**
 * Browser-side Pusher connection, created lazily and shared across the whole
 * app (one WebSocket, reused). Returns `null` on the server or when the public
 * credentials are missing, so callers can fall back to plain fetching.
 */

let client: Pusher | null = null;

export function getPusherClient(): Pusher | null {
  // No socket on the server (SSR / Server Components).
  if (typeof window === "undefined") return null;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

  // Realtime is optional: without config the caller degrades to its fallback.
  if (!key || !cluster) return null;

  if (!client) {
    client = new Pusher(key, { cluster });
  }

  return client;
}

// How many listeners currently hold each channel open. Several hooks watch the
// same party channel for different events, and `unsubscribe` tears the channel
// down for all of them — so whoever unmounts first would silently blind the
// others. The channel is only dropped once its last listener is gone.
const channelRefCounts = new Map<string, number>();

/**
 * Subscribes to one event of a party channel and returns the matching cleanup.
 * Returns a no-op when realtime is not configured, so callers can rely on their
 * own fallback fetching without branching.
 */
export function subscribePartyEvent(
  partyCode: string,
  eventName: string,
  handler: () => void,
): () => void {
  const pusher = getPusherClient();
  if (!pusher) return () => {};

  const channelName = `party-${partyCode.toUpperCase()}`;
  const channel = pusher.subscribe(channelName);
  channel.bind(eventName, handler);
  channelRefCounts.set(channelName, (channelRefCounts.get(channelName) ?? 0) + 1);

  return () => {
    channel.unbind(eventName, handler);
    const remaining = (channelRefCounts.get(channelName) ?? 1) - 1;

    if (remaining <= 0) {
      channelRefCounts.delete(channelName);
      pusher.unsubscribe(channelName);
    } else {
      channelRefCounts.set(channelName, remaining);
    }
  };
}

/**
 * Runs `handler` whenever the socket (re)connects, so a client that was offline
 * re-syncs immediately instead of waiting for its fallback timer.
 */
export function subscribeConnected(handler: () => void): () => void {
  const pusher = getPusherClient();
  if (!pusher) return () => {};

  pusher.connection.bind("connected", handler);
  return () => {
    pusher.connection.unbind("connected", handler);
  };
}
