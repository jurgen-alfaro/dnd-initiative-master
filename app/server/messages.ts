import { db } from "@/app/db/";
import { combatants, messages, parties } from "@/app/db/schema";
import { and, eq, gte, inArray, sql } from "drizzle-orm";
import type { ChatMessage, MessageThreadSummary } from "@/app/lib/types";

/**
 * Read-side of the private DM ↔ player messaging. This module is deliberately
 * NOT a `"use server"` file: everything here is called from Server Actions and
 * route handlers, and marking it as actions would publish these queries as
 * callable RPC endpoints.
 */

/** Messages are dropped from the server after this many days. */
export const MESSAGE_RETENTION_DAYS = 30;

/** Newest messages returned for a single thread. */
const MAX_THREAD_MESSAGES = 200;

/** Characters of the message body shown in the DM's inbox. */
const PREVIEW_LENGTH = 80;

/** Oldest instant still served. Anything before it is treated as gone. */
export function messageRetentionCutoff(): Date {
  return new Date(Date.now() - MESSAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Who the caller is, as far as messaging is concerned. Resolved once per
 * request from the two secrets the browser holds, and then trusted by the rest
 * of the pipeline — no other code re-derives identity.
 */
export type MessageAccess =
  | { role: "dm"; partyId: number; partyCode: string }
  | {
      role: "player";
      partyId: number;
      partyCode: string;
      combatantId: number;
      combatantName: string;
    }
  | { role: "unclaimed"; partyId: number; partyCode: string }
  | { role: "not-found" };

/**
 * Decides which thread, if any, a caller may touch.
 *
 * The DM proof wins outright: a DM who also carries a device id (every browser
 * has one) must never be mistaken for a player. A player is identified purely
 * by the claim stored on the combatant — the caller never gets to name the
 * thread it wants to read, which is what keeps the conversations private.
 *
 * Holding no credentials is not an error: it is the ordinary state of a player
 * who has yet to pick a character.
 */
export async function resolveMessageAccess(
  partyCode: string,
  dmToken: string | null,
  deviceId: string | null,
): Promise<MessageAccess> {
  const party = await db.query.parties.findFirst({
    where: eq(parties.code, partyCode.toUpperCase()),
  });

  if (!party) return { role: "not-found" };

  if (dmToken && dmToken === party.dmToken) {
    return { role: "dm", partyId: party.id, partyCode: party.code };
  }

  if (deviceId) {
    const claimed = await db.query.combatants.findFirst({
      where: and(
        eq(combatants.partyId, party.id),
        eq(combatants.claimedByDeviceId, deviceId),
      ),
    });

    if (claimed) {
      return {
        role: "player",
        partyId: party.id,
        partyCode: party.code,
        combatantId: claimed.id,
        combatantName: claimed.name,
      };
    }
  }

  return { role: "unclaimed", partyId: party.id, partyCode: party.code };
}

function toChatMessage(row: typeof messages.$inferSelect): ChatMessage {
  return {
    id: row.id,
    combatantId: row.combatantId,
    sender: row.sender,
    body: row.body,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  };
}

/**
 * The DM's inbox: one row per claimed character, newest activity first.
 * Only a short preview of the last message travels — the full text is fetched
 * when a thread is opened.
 */
export async function getThreadsForDm(partyId: number): Promise<{
  threads: MessageThreadSummary[];
  unclaimedCombatants: { id: number; name: string }[];
  totalUnread: number;
}> {
  const cutoff = messageRetentionCutoff();

  const partyCharacters = await db.query.combatants.findMany({
    where: and(
      eq(combatants.partyId, partyId),
      eq(combatants.type, "player"),
      eq(combatants.isHidden, false),
    ),
  });

  // One aggregate per thread. `id` is a serial, so max(id) is the last message.
  const stats = await db
    .select({
      combatantId: messages.combatantId,
      unreadCount: sql<number>`count(*) filter (where ${messages.readAt} is null and ${messages.sender} = 'player')`.mapWith(
        Number,
      ),
      lastMessageId: sql<number>`max(${messages.id})`.mapWith(Number),
    })
    .from(messages)
    .where(and(eq(messages.partyId, partyId), gte(messages.createdAt, cutoff)))
    .groupBy(messages.combatantId);

  const lastRows =
    stats.length === 0
      ? []
      : await db
          .select({
            id: messages.id,
            combatantId: messages.combatantId,
            sender: messages.sender,
            body: messages.body,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(
            inArray(
              messages.id,
              stats.map((s) => s.lastMessageId),
            ),
          );

  const lastByCombatant = new Map(lastRows.map((r) => [r.combatantId, r]));
  const statsByCombatant = new Map(stats.map((s) => [s.combatantId, s]));

  const threads: MessageThreadSummary[] = partyCharacters
    .filter((c) => c.claimedByDeviceId !== null)
    .map((c) => {
      const last = lastByCombatant.get(c.id);
      return {
        combatantId: c.id,
        combatantName: c.name,
        unreadCount: statsByCombatant.get(c.id)?.unreadCount ?? 0,
        lastMessage: last
          ? {
              sender: last.sender,
              preview: last.body.slice(0, PREVIEW_LENGTH),
              createdAt: last.createdAt.toISOString(),
            }
          : null,
      };
    })
    .sort((a, b) => {
      // Threads with activity float to the top, newest first; silent ones keep
      // a stable alphabetical order below them.
      if (a.lastMessage && b.lastMessage) {
        return b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt);
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.combatantName.localeCompare(b.combatantName);
    });

  return {
    threads,
    unclaimedCombatants: partyCharacters
      .filter((c) => c.claimedByDeviceId === null)
      .map((c) => ({ id: c.id, name: c.name })),
    totalUnread: threads.reduce((sum, t) => sum + t.unreadCount, 0),
  };
}

/**
 * The newest slice of one thread, oldest-first for rendering. Messages past the
 * retention window are filtered out here rather than relying on the sweep, so
 * an idle party never serves stale history.
 */
export async function getThreadMessages(
  partyId: number,
  combatantId: number,
): Promise<ChatMessage[]> {
  const rows = await db.query.messages.findMany({
    where: and(
      eq(messages.partyId, partyId),
      eq(messages.combatantId, combatantId),
      gte(messages.createdAt, messageRetentionCutoff()),
    ),
    orderBy: (m, { desc }) => [desc(m.createdAt), desc(m.id)],
    limit: MAX_THREAD_MESSAGES,
  });

  return rows.reverse().map(toChatMessage);
}

/** Unread messages waiting for `role` in a thread. */
export async function getUnreadCount(
  partyId: number,
  combatantId: number,
  forRole: "dm" | "player",
): Promise<number> {
  const senderToCount = forRole === "dm" ? "player" : "dm";

  const [row] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(messages)
    .where(
      and(
        eq(messages.partyId, partyId),
        eq(messages.combatantId, combatantId),
        eq(messages.sender, senderToCount),
        sql`${messages.readAt} is null`,
        gte(messages.createdAt, messageRetentionCutoff()),
      ),
    );

  return row?.count ?? 0;
}
