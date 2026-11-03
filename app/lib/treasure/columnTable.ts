import { poToCp } from "./coins";
import { rollDice, rollTable, type DiceNotation, type Die } from "./dice";
import type { MagicCategory, MagicResolution } from "./magicTable";
import type { Roll } from "./treasure";

/**
 * Tables 7-17 to 7-20 and 7-26 share one layout: a d% range per category
 * (Menor / Intermedio / Mayor, "—" when the object is not in that column), the
 * object and its market price.
 */
export type ColumnRow = {
  name: string;
  priceCp: number;
  ranges: Partial<Record<MagicCategory, readonly [number, number]>>;
};

/** "01-10" → [1, 10], "61" → [61, 61], "-" (the book's "—") → no range. */
function parseRange(text: string): readonly [number, number] | undefined {
  if (text === "-") return undefined;
  const [low, high = low] = text.split("-").map(Number);
  return [low, high];
}

/** One row of a table, ranges as printed and the price in po. */
export function entry(
  minor: string,
  medium: string,
  major: string,
  name: string,
  po: number,
): ColumnRow {
  const ranges: ColumnRow["ranges"] = {};
  const minorRange = parseRange(minor);
  const mediumRange = parseRange(medium);
  const majorRange = parseRange(major);
  if (minorRange) ranges.minor = minorRange;
  if (mediumRange) ranges.medium = mediumRange;
  if (majorRange) ranges.major = majorRange;
  return { name, priceCp: poToCp(po), ranges };
}

const ENERGY_TYPES = ["ácido", "frío", "electricidad", "fuego", "sonido"];
const ALIGNMENTS = ["caos", "mal", "bien", "ley"];

export type ColumnTable = {
  /** Number of the DMG table, for the label of the roll. */
  table: string;
  rows: readonly ColumnRow[];
  /** Goes before the name: "Anillo", "Varita"… */
  kind?: string;
  /** Wands and staffs hold 1d50 charges. */
  isCharged?: true;
};

const pluralCharges = (n: number) => `${n} ${n === 1 ? "carga" : "cargas"}`;

/**
 * Rolls a table: d% in the column of `category`, then the random parts of the
 * object — "(tipo)" and "(alineamiento)" become a concrete value, and wands
 * and staffs get their charges.
 */
export function rollColumnTable(
  { table, rows, kind, isCharged }: ColumnTable,
  category: MagicCategory,
  die: Die,
): MagicResolution {
  const rolls: Roll[] = [];
  const { row } = rollTable(
    `Table ${table}, ${category}`,
    rows.flatMap((r) => {
      const range = r.ranges[category];
      return range ? [{ upTo: range[1], row: r }] : [];
    }),
    die,
    rolls,
  );

  let name = row.name;
  const pickFrom = (
    token: string,
    label: string,
    dice: DiceNotation,
    options: string[],
  ) => {
    if (!name.includes(token)) return;
    const [face] = rollDice(die, dice);
    rolls.push({ label, dice, values: [face] });
    name = name.replace(token, `(${options[face - 1]})`);
  };
  pickFrom("(tipo)", "Energy type", "1d5", ENERGY_TYPES);
  pickFrom("(alineamiento)", "Alignment", "1d4", ALIGNMENTS);

  if (kind) name = `${kind}: ${name}`;
  if (isCharged) {
    const [charges] = rollDice(die, "1d50");
    rolls.push({ label: "Charges", dice: "1d50", values: [charges] });
    name = `${name} (${pluralCharges(charges)})`;
  }
  return { name, valueCp: row.priceCp, rolls };
}
