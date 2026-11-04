import { db } from "@/app/db/";
import { combatants } from "@/app/db/schema";
import { and, eq } from "drizzle-orm";
import type { Inventory } from "@/app/lib/inventory/inventory";

/**
 * Read-side of the inventarios. Like `messages.ts`, deliberately NOT a
 * `"use server"` file, so these queries are never published as actions.
 */

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
