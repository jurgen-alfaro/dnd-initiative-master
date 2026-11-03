import type { Roll } from "./treasure";

/**
 * Randomness for the treasure tables. The die is always injected, so every
 * table can be replayed with a fixed sequence of rolls.
 */

/** Rolls one die with `sides` faces and returns an integer from 1 to `sides`. */
export type Die = (sides: number) => number;

/** Dice notation as printed in the DMG tables, e.g. "1d6" or "4d10". */
export type DiceNotation = `${number}d${number}`;

/** The browser's randomness, used in production. */
export const randomDie: Die = (sides) => Math.floor(Math.random() * sides) + 1;

/** Rolls d% (1–100). */
export function rollPercentile(die: Die): number {
  return die(100);
}

/** Rolls every die of `notation` and returns each face, in order. */
export function rollDice(die: Die, notation: DiceNotation): number[] {
  const [count, sides] = notation.split("d").map(Number);
  return Array.from({ length: count }, () => die(sides));
}

/**
 * Picks the row of a d% table. Rows are listed in order and only carry the top
 * of their range (`upTo`), because the ranges of a DMG table are contiguous.
 */
export function pickRow<Row extends { upTo: number }>(
  rows: readonly Row[],
  roll: number,
): Row {
  const row = rows.find((r) => roll <= r.upTo);
  if (!row) throw new RangeError(`No row covers a roll of ${roll}`);
  return row;
}

/** Rolls d% on a table, keeps the roll in `rolls` and returns its row. */
export function rollTable<Row extends { upTo: number }>(
  label: string,
  rows: readonly Row[],
  die: Die,
  rolls: Roll[],
): Row {
  const percentile = rollPercentile(die);
  rolls.push({ label, dice: "d%", values: [percentile] });
  return pickRow(rows, percentile);
}
