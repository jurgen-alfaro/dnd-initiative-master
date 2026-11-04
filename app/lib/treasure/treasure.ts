import { z } from "zod";
import { MAX_MESSAGE_LENGTH } from "../types";
import { COIN_TABLE } from "./coinTable";
import {
  COPPER_PER_COIN,
  DENOMINATIONS,
  formatCoinList,
  formatCpAsPo,
  NO_COINS,
} from "./coins";
import { rollDice, rollTable, type Die } from "./dice";
import { rollGoods } from "./goodsTable";
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

/**
 * Categoría of the inventario an item goes to: Armas, Armaduras y escudos,
 * Consumibles, Objetos mágicos, Objetos maravillosos, Gemas y arte, Objetos
 * mundanos. Unlike `ItemCategory`, a weapon or armor goes to its own
 * categoría whether it is magic or not.
 */
export const InventoryCategorySchema = z.enum([
  "weapons",
  "armor",
  "consumables",
  "magicItems",
  "wondrous",
  "valuables",
  "mundane",
]);
export type InventoryCategory = z.infer<typeof InventoryCategorySchema>;

/** How an item is used up: beber (potions), usar (scrolls, alchemicals) or not at all. */
export const ItemUsageSchema = z.enum(["drink", "use", "none"]);
export type ItemUsage = z.infer<typeof ItemUsageSchema>;

/**
 * An indivisible object of a treasure, with the rolls that produced it and its
 * descripción (ADR-0002), when its name has one: one line per part. The name
 * carries neither the quantity nor the cargas; `formatItemName` adds them.
 */
export const TreasureItemSchema = z.object({
  category: ItemCategorySchema,
  inventoryCategory: InventoryCategorySchema,
  name: z.string().min(1).max(500),
  /** Units found (the roll of an alchemical); `valueCp` is for all of them. */
  quantity: z.number().int().min(1).max(1000),
  /** Cargas of a wand or staff. */
  charges: z.number().int().min(0).max(1000).optional(),
  usage: ItemUsageSchema,
  valueCp: z.number().int().min(0),
  rolls: z.array(RollSchema).max(50),
  description: z.string().min(1).max(3000).optional(),
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

/** Gems and art first, then the mundane and magic objects of table 3-5. */
function rollItems(level: number, die: Die): TreasureItem[] {
  return [...rollValuables(level, die), ...rollGoods(level, die)];
}

/** Rolls a whole treasure for an encounter level (NE) from 1 to 20. */
export function generateTreasure(level: number, die: Die): Treasure {
  const rows = COIN_TABLE[level - 1];
  if (!rows) throw new RangeError(`NE must be 1-20, got ${level}`);

  const label = "Table 3-5, coins";
  const coinRolls: Roll[] = [];
  const row = rollTable(label, rows, die, coinRolls);
  if (!row.dice) {
    const items = rollItems(level, die);
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
    items: rollItems(level, die),
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

const pluralCharges = (n: number) => `${n} ${n === 1 ? "carga" : "cargas"}`;

/**
 * An item's name as announced: an alchemical (the only stackable mundane
 * item) with its quantity, "Ácido ×7", and a charged item with its cargas,
 * "Varita: Luz (7 cargas)".
 */
export function formatItemName(item: TreasureItem): string {
  const isAlchemical =
    item.category === "mundane" && item.inventoryCategory === "consumables";
  const quantity = isAlchemical ? ` ×${item.quantity}` : "";
  const charges =
    item.charges === undefined ? "" : ` (${pluralCharges(item.charges)})`;
  return `${item.name}${quantity}${charges}`;
}

/** An item and its value, e.g. "Coraza (Mediana) (200 po)"; no value, no price. */
export function formatItem(item: TreasureItem): string {
  const name = formatItemName(item);
  return item.valueCp > 0 ? `${name} (${formatCpAsPo(item.valueCp)})` : name;
}

/**
 * An item as an announcement lists it: "- name (price)", then each line of its
 * description indented below. One entry, so a split never parts them.
 */
export function formatItemEntry(item: TreasureItem): string {
  const lines = item.description?.split("\n") ?? [];
  return [`- ${formatItem(item)}`, ...lines.map((line) => `  ${line}`)].join(
    "\n",
  );
}

/**
 * The private message that announces a tesoro individual to its PJ. Returns
 * one text, or several numbered parts when it would not fit in one message.
 */
export function formatIndividualAnnouncement(
  treasure: Treasure,
  characterName: string,
): string[] {
  const lines = [
    ...formatCoinList(treasure.coins).map((coins) => `- ${coins}`),
    ...treasure.items.map(formatItemEntry),
  ];
  if (lines.length === 0) lines.push("- Nothing");
  lines.push(`Total: ${formatCpAsPo(totalValueCp(treasure))}`);

  return splitIntoParts(
    `Treasure for ${characterName}`,
    lines,
    MAX_MESSAGE_LENGTH,
  );
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
  // ponytail: a single entry longer than the budget overflows its part; an
  // item caps at 500 characters of name and 3,000 of description, so only an
  // item with a huge description can overflow a 2,000-character message.
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
