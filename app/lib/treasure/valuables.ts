import { ART_TABLE } from "./artTable";
import { poToCp } from "./coins";
import { VALUABLE_DESCRIPTIONS } from "./descriptions";
import { rollDice, rollTable, type Die } from "./dice";
import { GEM_TABLE, type ValuableRow } from "./gemTable";
import type { Roll, TreasureItem } from "./treasure";
import { VALUABLES_COLUMN } from "./valuablesColumn";

const TABLES = {
  gem: { rows: GEM_TABLE, label: "Table 3-6, gem" },
  art: { rows: ART_TABLE, label: "Table 3-7, art object" },
} as const;

/**
 * Rolls the gems and art of a treasure: the column of table 3-5 for the NE,
 * then each gem on table 3-6 and each art object on table 3-7. Each item keeps
 * the column rolls that gave it, followed by its own rolls.
 */
export function rollValuables(level: number, die: Die): TreasureItem[] {
  const label = "Table 3-5, gems and art";
  const columnRolls: Roll[] = [];
  const { valuable, count } = rollTable(
    label,
    VALUABLES_COLUMN[level - 1],
    die,
    columnRolls,
  );
  if (!valuable) return [];

  let amount = 1;
  if (count) {
    const values = rollDice(die, count);
    columnRolls.push({ label, dice: count, values });
    amount = values.reduce((a, b) => a + b, 0);
  }

  return Array.from({ length: amount }, () =>
    rollValuable(valuable, columnRolls, die),
  );
}

function rollValuable(
  category: keyof typeof TABLES,
  columnRolls: Roll[],
  die: Die,
): TreasureItem {
  const { rows, label } = TABLES[category];
  const rolls = [...columnRolls];
  const row: ValuableRow = rollTable(label, rows, die, rolls);
  const values = rollDice(die, row.dice);
  const nameRoll = die(row.names.length);
  const times = row.times > 1 ? `×${row.times.toLocaleString("en-US")}` : "";
  rolls.push(
    { label, dice: `${row.dice}${times} po`, values },
    { label, dice: `d${row.names.length}`, values: [nameRoll] },
  );

  const name = row.names[nameRoll - 1];
  return {
    category,
    inventoryCategory: "valuables",
    name,
    quantity: 1,
    usage: "none",
    valueCp: poToCp(values.reduce((a, b) => a + b, 0) * row.times),
    rolls,
    description: VALUABLE_DESCRIPTIONS[name],
  };
}
