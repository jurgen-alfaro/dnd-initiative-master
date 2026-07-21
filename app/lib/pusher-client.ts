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
