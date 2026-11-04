import { db } from "@/app/db/";
import { activityNotices, combatants } from "@/app/db/schema";
import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import type { Inventory } from "@/app/lib/inventory/inventory";
import type { ActivityNotice } from "@/app/lib/types";
import { messageRetentionCutoff } from "@/app/server/messages";

/**
 * Read-side of the inventarios. Like `messages.ts`, deliberately NOT a
 * `"use server"` file, so these queries are never published as actions.
 */

/** Newest avisos returned for one PJ's actividad. */
const MAX_ACTIVITY_NOTICES = 200;

/** The inventario of a PJ of the party, or null if there is no such PJ. */
export async function getCharacterInventory(
  partyId: number,
  combatantId: number,
): Promise<{ combatantName: string; inventory: Inventory } | null> {
  const character = await db.query.combatants.findFirst({
    columns: { name: true, inventory: true },
    where: and(
      eq(combatants.id, combatantId),
      eq(combatants.partyId, partyId),
      eq(combatants.type, "player"),
    ),
  });

  return character
    ? { combatantName: character.name, inventory: character.inventory }
    : null;
}

/**
 * Drops the avisos past the retention window of the messages, after a write.
 * Best-effort, like `sweepExpiredMessages`: the reads filter by the same cutoff.
 */
export async function sweepExpiredActivity(partyId: number): Promise<void> {
  await db
    .delete(activityNotices)
    .where(
      and(
        eq(activityNotices.partyId, partyId),
        lt(activityNotices.createdAt, messageRetentionCutoff()),
      ),
    );
}

/** The newest avisos of a PJ's actividad, oldest first. */
export async function getActivity(
  partyId: number,
  combatantId: number,
): Promise<ActivityNotice[]> {
  const rows = await db.query.activityNotices.findMany({
    where: and(
      eq(activityNotices.partyId, partyId),
      eq(activityNotices.combatantId, combatantId),
      gte(activityNotices.createdAt, messageRetentionCutoff()),
    ),
    orderBy: (n, { desc }) => [desc(n.createdAt), desc(n.id)],
    limit: MAX_ACTIVITY_NOTICES,
  });

  return rows.reverse().map((row) => ({
    id: row.id,
    text: row.text,
    createdAt: row.createdAt.toISOString(),
    readAt: row.readAt?.toISOString() ?? null,
  }));
}

/** Unread avisos per PJ of the party; PJs with none are left out. */
export async function getActivityUnread(
  partyId: number,
): Promise<{ combatantId: number; count: number }[]> {
  return db
    .select({
      combatantId: activityNotices.combatantId,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(activityNotices)
    .where(
      and(
        eq(activityNotices.partyId, partyId),
        isNull(activityNotices.readAt),
        gte(activityNotices.createdAt, messageRetentionCutoff()),
      ),
    )
    .groupBy(activityNotices.combatantId);
}
