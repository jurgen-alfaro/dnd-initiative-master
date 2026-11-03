import { rollDice, rollTable, type DiceNotation, type Die } from "./dice";
import { rollMagicItem, type MagicCategory } from "./magicTable";
import { rollMundaneItem } from "./mundaneTable";
import type { Roll, TreasureItem } from "./treasure";

/** One d% range of the objects column. `category` is null for a "—". */
export type GoodsRow = {
  upTo: number;
  category: "mundane" | MagicCategory | null;
  /** How many objects: a die, or exactly 1 when the book prints "1". */
  count: DiceNotation | 1;
};

const none = (upTo: number): GoodsRow => ({ upTo, category: null, count: 1 });

const goods = (
  upTo: number,
  category: "mundane" | MagicCategory,
  count: DiceNotation | 1,
): GoodsRow => ({ upTo, category, count });

/**
 * "Objetos mundanos y mágicos" column of DMG 3.5 table 3-5, indexed by NE − 1.
 */
export const GOODS_TABLE: readonly (readonly GoodsRow[])[] = [
  // NE 1
  [none(71), goods(95, "mundane", 1), goods(100, "minor", 1)],
  // NE 2
  [none(49), goods(85, "mundane", 1), goods(100, "minor", 1)],
  // NE 3
  [none(49), goods(79, "mundane", "1d3"), goods(100, "minor", 1)],
  // NE 4
  [none(42), goods(62, "mundane", "1d4"), goods(100, "minor", 1)],
  // NE 5
  [none(57), goods(67, "mundane", "1d4"), goods(100, "minor", "1d3")],
  // NE 6
  [
    none(54),
    goods(59, "mundane", "1d4"),
    goods(99, "minor", "1d3"),
    goods(100, "medium", 1),
  ],
  // NE 7
  [none(51), goods(97, "minor", "1d3"), goods(100, "medium", 1)],
  // NE 8
  [none(48), goods(96, "minor", "1d4"), goods(100, "medium", 1)],
  // NE 9
  [none(43), goods(91, "minor", "1d4"), goods(100, "medium", 1)],
  // NE 10
  [
    none(40),
    goods(88, "minor", "1d4"),
    goods(99, "medium", 1),
    goods(100, "major", 1),
  ],
  // NE 11
  [
    none(31),
    goods(84, "minor", "1d4"),
    goods(98, "medium", 1),
    goods(100, "major", 1),
  ],
  // NE 12
  [
    none(27),
    goods(82, "minor", "1d6"),
    goods(97, "medium", 1),
    goods(100, "major", 1),
  ],
  // NE 13
  [
    none(19),
    goods(73, "minor", "1d6"),
    goods(95, "medium", 1),
    goods(100, "major", 1),
  ],
  // NE 14
  [
    none(19),
    goods(58, "minor", "1d6"),
    goods(92, "medium", 1),
    goods(100, "major", 1),
  ],
  // NE 15
  [
    none(11),
    goods(46, "minor", "1d10"),
    goods(90, "medium", 1),
    goods(100, "major", 1),
  ],
  // NE 16
  [
    none(40),
    goods(46, "minor", "1d10"),
    goods(90, "medium", "1d3"),
    goods(100, "major", 1),
  ],
  // NE 17
  [none(33), goods(83, "medium", "1d3"), goods(100, "major", 1)],
  // NE 18
  [none(24), goods(80, "medium", "1d4"), goods(100, "major", 1)],
  // NE 19
  [none(4), goods(70, "medium", "1d4"), goods(100, "major", 1)],
  // NE 20
  [none(25), goods(65, "medium", "1d4"), goods(100, "major", "1d3")],
];

/**
 * Rolls the objects column for an NE and resolves each object it gives. Each
 * item keeps the column rolls that gave it, followed by its own rolls.
 */
export function rollGoods(level: number, die: Die): TreasureItem[] {
  const label = "Table 3-5, objects";
  const columnRolls: Roll[] = [];
  const { category, count } = rollTable(
    label,
    GOODS_TABLE[level - 1],
    die,
    columnRolls,
  );
  if (!category) return [];

  let amount = 1;
  if (count !== 1) {
    const values = rollDice(die, count);
    columnRolls.push({ label, dice: count, values });
    amount = values.reduce((a, b) => a + b, 0);
  }

  return Array.from({ length: amount }, () => {
    const item =
      category === "mundane" ? rollMundaneItem(die) : rollMagicItem(category, die);
    return { ...item, rolls: [...columnRolls, ...item.rolls] };
  });
}
