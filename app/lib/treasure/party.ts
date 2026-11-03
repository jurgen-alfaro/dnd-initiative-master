import { MAX_NOTE_LENGTH } from "../types";
import { DENOMINATIONS, formatCoinList, formatCpAsPo, NO_COINS } from "./coins";
import type { Die } from "./dice";
import {
  formatItemEntry,
  splitIntoParts,
  totalValueCp,
  type Coins,
  type Treasure,
} from "./treasure";

/**
 * Splitting a tesoro de party among its PJs. Pure logic, like the rest of the
 * treasure module.
 */

/** Coins of the next lower denomination that make one coin (1 ppt = 10 po). */
const COINS_PER_LOWER_COIN = 10;

/**
 * Divides coins evenly among `recipients` PJs. Denominations go from ppt down
 * to pc: each PJ gets the whole division, the remainder is multiplied by 10
 * and added to the lower coin, and the copper left at the end goes whole to
 * one PJ picked with the die. The shares always add up to the original value.
 */
export function splitCoins(
  coins: Coins,
  recipients: number,
  die: Die,
): Coins[] {
  if (!Number.isInteger(recipients) || recipients < 1) {
    throw new RangeError(`Need at least one recipient, got ${recipients}`);
  }

  const shares: Coins[] = Array.from({ length: recipients }, () => ({
    ...NO_COINS,
  }));

  let carried = 0;
  for (const denomination of DENOMINATIONS) {
    const amount = coins[denomination] + carried;
    const remainder = amount % recipients;
    for (const share of shares) {
      share[denomination] = Math.floor(amount / recipients);
    }
    carried = remainder * COINS_PER_LOWER_COIN;
    if (denomination === "pc" && remainder > 0) {
      // Nothing lower to convert to: the leftover copper has a lucky owner.
      shares[die(recipients) - 1].pc += remainder;
    }
  }

  return shares;
}

/** Coins each of `count` PJs gets; nobody ticked means nothing to split. */
export function splitAmong(coins: Coins, count: number, die: Die): Coins[] {
  return count > 0 ? splitCoins(coins, count, die) : [];
}

/** The PJ (combatant id) each item goes to, keyed by its position in `items`. */
export type Assignments = Record<number, number>;

/** Who is ticked to receive a tesoro de party and who gets each item. */
export type PartySelection = {
  recipientIds: ReadonlySet<number>;
  assignments: Assignments;
};

/** Ticks or unticks a PJ; an unticked PJ frees the items it was given. */
export function toggleRecipient(
  { recipientIds, assignments }: PartySelection,
  id: number,
  isChecked: boolean,
): PartySelection {
  const next = new Set(recipientIds);
  if (isChecked) next.add(id);
  else next.delete(id);
  return {
    recipientIds: next,
    assignments: Object.fromEntries(
      Object.entries(assignments).filter(([, owner]) => next.has(owner)),
    ),
  };
}

/** Whether every item goes to one of `recipientIds`. */
export function isEveryItemAssigned(
  treasure: Treasure,
  assignments: Assignments,
  recipientIds: ReadonlySet<number>,
): boolean {
  return treasure.items.every((_, i) => {
    const owner = assignments[i];
    return owner !== undefined && recipientIds.has(owner);
  });
}

/** What one PJ is delivered: its coins and the positions of its items. */
export type RecipientShare = {
  combatantId: number;
  coins: Coins;
  itemIndexes: number[];
};

/**
 * Pairs each PJ of `recipientIds` with the coins at the same position of
 * `coinShares` and the items assigned to it.
 */
export function partyShares(
  treasure: Treasure,
  recipientIds: readonly number[],
  coinShares: readonly Coins[],
  assignments: Assignments,
): RecipientShare[] {
  if (coinShares.length !== recipientIds.length) {
    throw new RangeError(
      `${coinShares.length} coin shares for ${recipientIds.length} recipients`,
    );
  }
  return recipientIds.map((combatantId, i) => ({
    combatantId,
    coins: coinShares[i],
    itemIndexes: treasure.items.flatMap((_, itemIndex) =>
      assignments[itemIndex] === combatantId ? [itemIndex] : [],
    ),
  }));
}

/** What one PJ receives: its share of the coins and the items assigned to it. */
export type PartyShare = {
  name: string;
  coins: Coins;
  /** Positions in `Treasure.items`. */
  itemIndexes: number[];
};

/**
 * The public note that announces a tesoro de party: what each PJ received.
 * Returns one text, or several numbered parts when it would not fit in a note.
 */
export function formatPartyAnnouncement(
  treasure: Treasure,
  shares: PartyShare[],
): string[] {
  const lines = shares.flatMap((share) => {
    const received = [
      ...formatCoinList(share.coins).map((coins) => `- ${coins}`),
      ...share.itemIndexes.map((i) => formatItemEntry(treasure.items[i])),
    ];
    return [share.name, ...(received.length > 0 ? received : ["- Nothing"])];
  });
  lines.push(`Total: ${formatCpAsPo(totalValueCp(treasure))}`);

  return splitIntoParts("Party treasure", lines, MAX_NOTE_LENGTH);
}
