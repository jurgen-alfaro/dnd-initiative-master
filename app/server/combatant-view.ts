import type { combatants } from "@/app/db/schema";
import type { Combatant, Condition } from "@/app/lib/types";

type CombatantRow = typeof combatants.$inferSelect;

/**
 * Turns a database row into the shape clients are allowed to see.
 *
 * The claim column holds the device id that owns the character's private thread
 * with the DM — it is that player's only credential, so shipping it inside a
 * party payload would hand every other member of the party the keys to those
 * messages. This mapper is the single place that decides what leaves the
 * server: the id is dropped and replaced by the two booleans the UI needs.
 *
 * `requesterDeviceId` is null during the server render, which cannot know the
 * caller's device; `claimedByMe` then resolves to false for everyone and the
 * first authenticated fetch corrects it.
 */
export function toSafeCombatant(
  row: CombatantRow,
  requesterDeviceId: string | null,
): Combatant & { partyId: number; createdAt: Date } {
  const {
    claimedByDeviceId,
    claimedAt: _claimedAt,
    conditions,
    buffs,
    ammo,
    ...rest
  } = row;

  return {
    ...rest,
    // NOTE: the column is a plain text[] in Postgres, so Drizzle cannot know the
    // values are the 5e condition names the app writes into it. Same assertion
    // the previous read path already made.
    conditions: conditions as Condition[],
    buffs: buffs ?? [],
    ammo: ammo ?? [],
    isClaimed: claimedByDeviceId !== null,
    claimedByMe:
      claimedByDeviceId !== null &&
      requesterDeviceId !== null &&
      claimedByDeviceId === requesterDeviceId,
  };
}
