import { z } from "zod";
import { COIN_TABLE } from "./coinTable";
import { pickRow, rollDice, rollPercentile, type Die } from "./dice";
import { rollValuables } from "./valuables";

/**
 * Treasure generator for the DMG 3.5 tables (see ADR-0001). Pure logic: no
 * framework, no database, and the die is always passed in.
 *
 * Public interface: `generateTreasure`, `formatIndividualAnnouncement`, the
 * `Treasure` shape and its schema. Each family of tables lives in its own data
 * file next to this one (`coinTable.ts`, …) and is walked from
 * `generateTreasure`.
 */

export const MIN_ENCOUNTER_LEVEL = 1;
export const MAX_ENCOUNTER_LEVEL = 20;

export const DENOMINATIONS = ["ppt", "po", "pp", "pc"] as const;
export type Denomination = (typeof DENOMINATIONS)[number];

/** Value of one coin of each denomination, in pc. */
export const COPPER_PER_COIN: Record<Denomination, number> = {
  pc: 1,
  pp: 10,
  po: 100,
  ppt: 1000,
};

const CoinCountSchema = z.number().int().min(0).max(1_000_000_000);

export const CoinsSchema = z.object({
  pc: CoinCountSchema,
  pp: CoinCountSchema,
  po: CoinCountSchema,
  ppt: CoinCountSchema,
});
export type Coins = z.infer<typeof CoinsSchema>;

/** One throw on a table: what was rolled ("d%", "2d8") and each face. */
export const RollSchema = z.object({
  label: z.string().max(100),
  dice: z.string().max(20),
  values: z.array(z.number().int().min(1)).max(100),
});
export type Roll = z.infer<typeof RollSchema>;

export const ItemCategorySchema = z.enum([
  "gem",
  "art",
  "mundane",
  "minor",
  "medium",
  "major",
]);
export type ItemCategory = z.infer<typeof ItemCategorySchema>;

/** An indivisible object of a treasure, with the rolls that produced it. */
export const TreasureItemSchema = z.object({
  category: ItemCategorySchema,
  name: z.string().min(1).max(200),
  valueCp: z.number().int().min(0),
  rolls: z.array(RollSchema).max(50),
});
export type TreasureItem = z.infer<typeof TreasureItemSchema>;

export const TreasureSchema = z.object({
  level: z.number().int().min(MIN_ENCOUNTER_LEVEL).max(MAX_ENCOUNTER_LEVEL),
  coins: CoinsSchema,
  /** Rolls on the coins column of table 3-5: the d% and, if any, the dice. */
  coinRolls: z.array(RollSchema).max(10),
  items: z.array(TreasureItemSchema).max(200),
});
export type Treasure = z.infer<typeof TreasureSchema>;

const NO_COINS: Coins = { pc: 0, pp: 0, po: 0, ppt: 0 };

/** Rolls a whole treasure for an encounter level (NE) from 1 to 20. */
export function generateTreasure(level: number, die: Die): Treasure {
  const rows = COIN_TABLE[level - 1];
  if (!rows) throw new RangeError(`NE must be 1-20, got ${level}`);

  const label = "Table 3-5, coins";
  const percentile = rollPercentile(die);
  const coinRolls: Roll[] = [{ label, dice: "d%", values: [percentile] }];
  const row = pickRow(rows, percentile);
  if (!row.dice) {
    const items = rollValuables(level, die);
    return { level, coins: NO_COINS, coinRolls, items };
  }

  const values = rollDice(die, row.dice);
  coinRolls.push({
    label,
    dice: `${row.dice}×${row.times.toLocaleString("en-US")} ${row.coin}`,
    values,
  });
  const amount = values.reduce((a, b) => a + b, 0) * row.times;

  return {
    level,
    coins: { ...NO_COINS, [row.coin]: amount },
    coinRolls,
    items: rollValuables(level, die),
  };
}

/** Whole value of a treasure, in pc. */
export function totalValueCp(treasure: Treasure): number {
  const coins = DENOMINATIONS.reduce(
    (sum, d) => sum + treasure.coins[d] * COPPER_PER_COIN[d],
    0,
  );
  return treasure.items.reduce((sum, item) => sum + item.valueCp, coins);
}

/** A count of coins, e.g. "4,000 pc". */
export function formatCoins(count: number, denomination: Denomination): string {
  return `${count.toLocaleString("en-US")} ${denomination}`;
}

/** A value in pc shown in po, e.g. 1250 → "12.5 po". */
export function formatCpAsGp(cp: number): string {
  return `${(cp / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })} po`;
}

/** Longest body a DM chat message may have. */
const MESSAGE_LIMIT = 2000;

/**
 * The private message that announces a tesoro individual to its PJ. Returns
 * one text, or several numbered parts when it would not fit in one message.
 */
export function formatIndividualAnnouncement(
  treasure: Treasure,
  characterName: string,
): string[] {
  const lines = [
    ...DENOMINATIONS.filter((d) => treasure.coins[d] > 0).map(
      (d) => `- ${formatCoins(treasure.coins[d], d)}`,
    ),
    ...treasure.items.map(
      (item) => `- ${item.name} (${formatCpAsGp(item.valueCp)})`,
    ),
  ];
  if (lines.length === 0) lines.push("- Nothing");
  lines.push(`Total: ${formatCpAsGp(totalValueCp(treasure))}`);

  return splitIntoParts(`Treasure for ${characterName}`, lines, MESSAGE_LIMIT);
}

/** Packs whole lines into texts of at most `limit` characters. */
export function splitIntoParts(
  title: string,
  lines: string[],
  limit: number,
): string[] {
  const whole = [title, ...lines].join("\n");
  if (whole.length <= limit) return [whole];

  // Room for the widest header possible: never more parts than lines.
  // ponytail: a single line longer than the budget overflows its part; the
  // schema caps item names at 200 characters, far below any channel limit.
  const budget = limit - `${title} (${lines.length}/${lines.length})\n`.length;
  const chunks: string[][] = [];
  let size = Infinity;
  for (const line of lines) {
    if (size + 1 + line.length > budget) {
      chunks.push([]);
      size = -1;
    }
    chunks[chunks.length - 1].push(line);
    size += 1 + line.length;
  }

  return chunks.map((chunk, i) =>
    [`${title} (${i + 1}/${chunks.length})`, ...chunk].join("\n"),
  );
}
