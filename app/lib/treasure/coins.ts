import type { Coins } from "./treasure";

/**
 * Coins and prices. Kept apart from `treasure.ts` with no runtime imports, so
 * the data tables can price their rows at load time without an import cycle.
 */

export const DENOMINATIONS = ["ppt", "po", "pp", "pc"] as const;
export type Denomination = (typeof DENOMINATIONS)[number];

/** Value of one coin of each denomination, in pc. */
export const COPPER_PER_COIN: Record<Denomination, number> = {
  pc: 1,
  pp: 10,
  po: 100,
  ppt: 1000,
};

export const NO_COINS: Coins = { pc: 0, pp: 0, po: 0, ppt: 0 };

/** A price in po, as the tables print it, in pc: 12.5 → 1250. */
export function poToCp(po: number): number {
  return Math.round(po * COPPER_PER_COIN.po);
}

/** A count of coins, e.g. "4,000 pc". */
export function formatCoins(count: number, denomination: Denomination): string {
  return `${count.toLocaleString("en-US")} ${denomination}`;
}

/** Each denomination there is some of, highest first: ["2 ppt", "5 po"]. */
export function formatCoinList(coins: Coins): string[] {
  return DENOMINATIONS.filter((d) => coins[d] > 0).map((d) =>
    formatCoins(coins[d], d),
  );
}

/** A value in pc shown in po, e.g. 1250 → "12.5 po". */
export function formatCpAsPo(cp: number): string {
  return `${(cp / COPPER_PER_COIN.po).toLocaleString("en-US", { maximumFractionDigits: 2 })} po`;
}
