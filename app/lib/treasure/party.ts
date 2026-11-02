import type { Die } from "./dice";
import { DENOMINATIONS, type Coins } from "./treasure";

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
    pc: 0,
    pp: 0,
    po: 0,
    ppt: 0,
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
