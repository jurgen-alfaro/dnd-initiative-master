import { rollDice, rollTable, type DiceNotation, type Die } from "./dice";
import type { MagicCategory, MagicResolution } from "./magicTable";
import { SCROLL_SPELL_TABLES } from "./scrollSpellTable";
import type { Roll } from "./treasure";

type ScrollType = keyof typeof SCROLL_SPELL_TABLES;

const TYPE_NAMES: Record<ScrollType, string> = { arcane: "arcano", divine: "divino" };

/** Table 7-21 ("Tipos de rollos de pergamino"). */
const TYPE_TABLE: readonly { upTo: number; type: ScrollType }[] = [
  { upTo: 70, type: "arcane" },
  { upTo: 100, type: "divine" },
];

/** Table 7-22 ("Número de conjuros en un rollo de pergamino"). */
const SPELL_COUNT: Record<MagicCategory, DiceNotation> = {
  minor: "1d3",
  medium: "1d4",
  major: "1d6",
};

/** Caster level of table 7-23, indexed by spell level. */
const CASTER_LEVEL = [1, 1, 3, 5, 7, 9, 11, 13, 15, 17] as const;

/**
 * Table 7-23 ("Niveles de conjuro del rollo de pergamino"), one column per
 * category.
 *
 * NOTE: the book prints 95-100 for level 9 in the major column, overlapping
 * 86-95; 95 stays at level 8, as in the English SRD (96-100).
 */
const LEVEL_TABLE: Record<MagicCategory, readonly { upTo: number; level: number }[]> = {
  minor: [
    { upTo: 5, level: 0 },
    { upTo: 50, level: 1 },
    { upTo: 95, level: 2 },
    { upTo: 100, level: 3 },
  ],
  medium: [
    { upTo: 5, level: 2 },
    { upTo: 65, level: 3 },
    { upTo: 95, level: 4 },
    { upTo: 100, level: 5 },
  ],
  major: [
    { upTo: 5, level: 4 },
    { upTo: 50, level: 5 },
    { upTo: 70, level: 6 },
    { upTo: 85, level: 7 },
    { upTo: 95, level: 8 },
    { upTo: 100, level: 9 },
  ],
};

/**
 * Rolls a scroll with tables 7-21 to 7-25: its type, how many spells it holds,
 * then the level and the spell of each one. Its price is the sum of its spells.
 */
export function rollScroll(category: MagicCategory, die: Die): MagicResolution {
  const rolls: Roll[] = [];
  const { type } = rollTable("Table 7-21", TYPE_TABLE, die, rolls);
  const countValues = rollDice(die, SPELL_COUNT[category]);
  const count = countValues.reduce((sum, value) => sum + value, 0);
  rolls.push({ label: "Table 7-22", dice: SPELL_COUNT[category], values: countValues });

  const spells = Array.from({ length: count }, () => {
    const { level } = rollTable(`Table 7-23, ${category}`, LEVEL_TABLE[category], die, rolls);
    const spell = rollTable(
      `Table 7-${type === "arcane" ? 24 : 25}, level ${level}`,
      SCROLL_SPELL_TABLES[type][level],
      die,
      rolls,
    );
    return { ...spell, casterLevel: CASTER_LEVEL[level] };
  });

  return {
    name: `Rollo de pergamino ${TYPE_NAMES[type]}: ${spells
      .map((s) => `${s.name} (NL ${s.casterLevel})`)
      .join(", ")}`,
    valueCp: spells.reduce((sum, s) => sum + s.valueCp, 0),
    rolls,
  };
}
