import { db } from "@/app/db/";
import { activityNotices, combatants } from "@/app/db/schema";
import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import type { Inventory } from "@/app/lib/inventory/inventory";
import type { ActivityNotice, AppError } from "@/app/lib/types";
import {
  messageRetentionCutoff,
  resolveMessageAccess,
} from "@/app/server/messages";

/**
 * Read-side of the inventarios. Like `messages.ts`, deliberately NOT a
 * `"use server"` file, so these queries are never published as actions.
 */

/** Newest avisos returned for one PJ's actividad. */
const MAX_ACTIVITY_NOTICES = 200;

/** Why a backpack can't be read. */
export type BackpackReadErrorCode =
  | "PARTY_NOT_FOUND"
  | "FORBIDDEN"
  | "MISSING_COMBATANT"
  | "CHARACTER_NOT_FOUND";

export type BackpackRead =
  | { role: "unclaimed" }
  | {
      role: "dm" | "player";
      combatantId: number;
      combatantName: string;
      inventory: Inventory;
      /** Only the DM gets the PJ's actividad. */
      activity?: ActivityNotice[];
    };

/**
 * Reads the inventario of one PJ. Same identity as the private messages: a
 * player reads only the PJ they claimed (the claim picks it, `combatantId` can
 * only match it), the DM reads any PJ of the party by id, with its actividad.
 */
export async function fetchBackpack(
  partyCode: string,
  dmToken: string | null,
  deviceId: string | null,
  combatantId: number | undefined,
): Promise<BackpackRead | { error: AppError & { code: BackpackReadErrorCode } }> {
  const access = await resolveMessageAccess(partyCode, dmToken, deviceId);
  if (access.role === "not-found") {
    return { error: { code: "PARTY_NOT_FOUND", message: "Party not found" } };
  }
  if (access.role === "unclaimed") return { role: "unclaimed" };

  if (
    access.role === "player" &&
    combatantId !== undefined &&
    combatantId !== access.combatantId
  ) {
    return { error: { code: "FORBIDDEN", message: "Not authorized" } };
  }

  const id = access.role === "player" ? access.combatantId : combatantId;
  if (id === undefined) {
    return { error: { code: "MISSING_COMBATANT", message: "Missing combatantId" } };
  }

  const found = await fetchCharacterInventory(access.partyId, id);
  if (!found) {
    return { error: { code: "CHARACTER_NOT_FOUND", message: "Character not found" } };
  }

  if (access.role === "player") {
    return { role: access.role, combatantId: id, ...found };
  }
  const activity = await fetchActivity(access.partyId, id);
  return { role: access.role, combatantId: id, ...found, activity };
}

/** The inventario of a PJ of the party, or null if there is no such PJ. */
async function fetchCharacterInventory(
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
 * A failure is only logged, since the write it follows is already committed and
 * reporting an error would invite a retry that applies it twice.
 */
export async function sweepExpiredActivity(partyId: number): Promise<void> {
  try {
    await db
      .delete(activityNotices)
      .where(
        and(
          eq(activityNotices.partyId, partyId),
          lt(activityNotices.createdAt, messageRetentionCutoff()),
        ),
      );
  } catch (error) {
    console.error("Error sweeping expired activity:", error);
  }
}

/** The newest avisos of a PJ's actividad, oldest first. */
async function fetchActivity(
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
export async function fetchActivityUnread(
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
