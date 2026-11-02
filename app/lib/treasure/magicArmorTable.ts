import { pickRow, rollPercentile, type Die } from "./dice";
import {
  describeMagicGear,
  MAX_TOTAL_BONUS,
  rollAbilities,
  totalBonus,
  type AbilityRow,
  type SpecialAbility,
} from "./magicGear";
import type { MagicCategory, MagicResolution } from "./magicTable";
import type { Roll } from "./treasure";

const gp = (po: number) => Math.round(po * 100);

type Kind = "armor" | "shield";

/** A row of table 7-2. */
type ArmorRow = { upTo: number } & (
  | { kind: Kind; enhancement: number }
  | { specific: Kind }
  | { abilityAndRollAgain: true }
);

/** Table 7-2 ("Armadura y escudos"), one column per category. */
const ARMOR_TABLE: Record<MagicCategory, readonly ArmorRow[]> = {
  minor: [
    { upTo: 60, kind: "shield", enhancement: 1 },
    { upTo: 80, kind: "armor", enhancement: 1 },
    { upTo: 85, kind: "shield", enhancement: 2 },
    { upTo: 87, kind: "armor", enhancement: 2 },
    { upTo: 89, specific: "armor" },
    { upTo: 91, specific: "shield" },
    { upTo: 100, abilityAndRollAgain: true },
  ],
  medium: [
    { upTo: 5, kind: "shield", enhancement: 1 },
    { upTo: 10, kind: "armor", enhancement: 1 },
    { upTo: 20, kind: "shield", enhancement: 2 },
    { upTo: 30, kind: "armor", enhancement: 2 },
    { upTo: 40, kind: "shield", enhancement: 3 },
    { upTo: 50, kind: "armor", enhancement: 3 },
    { upTo: 55, kind: "shield", enhancement: 4 },
    { upTo: 57, kind: "armor", enhancement: 4 },
    { upTo: 60, specific: "armor" },
    { upTo: 63, specific: "shield" },
    { upTo: 100, abilityAndRollAgain: true },
  ],
  major: [
    { upTo: 8, kind: "shield", enhancement: 3 },
    { upTo: 16, kind: "armor", enhancement: 3 },
    { upTo: 27, kind: "shield", enhancement: 4 },
    { upTo: 38, kind: "armor", enhancement: 4 },
    { upTo: 49, kind: "shield", enhancement: 5 },
    { upTo: 57, kind: "armor", enhancement: 5 },
    { upTo: 60, specific: "armor" },
    { upTo: 63, specific: "shield" },
    { upTo: 100, abilityAndRollAgain: true },
  ],
};

/** Price of each total bonus, +1 to +10, as table 7-2 prints it (po). */
const ARMOR_BONUS_PRICES_PO = [
  1000, 4000, 9000, 16000, 25000, 36000, 49000, 64000, 81000, 100000,
];

type BaseType = { upTo: number; name: string; priceCp: number };
const base = (upTo: number, name: string, po: number): BaseType => ({
  upTo,
  name,
  priceCp: gp(po),
});

/** Tables 7-3 and 7-4: the masterwork armor or shield that is enchanted. */
const BASE_TYPES: Record<Kind, { label: string; rows: readonly BaseType[] }> = {
  armor: {
    label: "Table 7-3",
    rows: [
      base(1, "Acolchada", 155),
      base(2, "Cuero", 160),
      base(17, "Cuero tachonado", 175),
      base(32, "Camisote de mallas", 250),
      base(42, "Pieles", 165),
      base(43, "Cota de escamas", 200),
      base(44, "Cota de mallas", 300),
      base(57, "Coraza", 350),
      base(58, "Laminada", 350),
      base(59, "Cota de bandas", 400),
      base(60, "Placas y mallas", 750),
      base(100, "Completa", 1650),
    ],
  },
  shield: {
    label: "Table 7-4",
    rows: [
      base(10, "Broquel o rodela", 165),
      base(15, "Escudo ligero de madera", 153),
      base(20, "Escudo ligero de acero", 159),
      base(30, "Escudo pesado de madera", 157),
      base(95, "Escudo pesado de acero", 170),
      base(100, "Escudo pavés", 180),
    ],
  },
};

/**
 * Tables 7-7 ("Armaduras específicas") and 7-8 ("Escudos específicos"), one
 * column per category, at their market price.
 *
 * NOTE: in the major column of table 7-7 the book prints "01-10" for the Cota
 * de bandas de la suerte (a misprint, as 01-10 is the Coraza adamantina); it
 * is given 21-32, the only gap left in that column.
 */
const SPECIFIC: Record<
  Kind,
  { label: string; rows: Record<MagicCategory, readonly BaseType[]> }
> = {
  armor: {
    label: "Table 7-7",
    rows: {
      minor: [
        base(50, "Camisote de mallas de mithril", 1100),
        base(80, "Armadura completa de piel de dragón", 3300),
        base(100, "Cota de mallas élfica", 4150),
      ],
      medium: [
        base(25, "Camisote de mallas de mithril", 1100),
        base(45, "Armadura completa de piel de dragón", 3300),
        base(57, "Cota de mallas élfica", 4150),
        base(67, "Armadura de piel de rinoceronte", 5165),
        base(82, "Coraza adamantina", 10200),
        base(97, "Armadura completa enana", 16500),
        base(100, "Cota de bandas de la suerte", 18900),
      ],
      major: [
        base(10, "Coraza adamantina", 10200),
        base(20, "Armadura completa enana", 16500),
        base(32, "Cota de bandas de la suerte", 18900),
        base(50, "Armadura celestial", 22400),
        base(60, "Armadura completa de las profundidades", 24650),
        base(75, "Coraza de mando", 25400),
        base(90, "Armadura completa veloz de mithril", 26500),
        base(100, "Armadura demoníaca", 52260),
      ],
    },
  },
  shield: {
    label: "Table 7-8",
    rows: {
      minor: [
        base(30, "Broquel de maderaoscura", 205),
        base(80, "Escudo de maderaoscura", 257),
        base(95, "Escudo pesado de mithril", 1020),
        base(100, "Escudo del lanzador de conjuros", 3153),
      ],
      medium: [
        base(20, "Broquel de maderaoscura", 205),
        base(45, "Escudo de maderaoscura", 257),
        base(70, "Escudo pesado de mithril", 1020),
        base(85, "Escudo del lanzador de conjuros", 3153),
        base(90, "Escudo espinoso", 5580),
        base(95, "Escudo del león", 9170),
        base(100, "Escudo alado", 17257),
      ],
      major: [
        base(20, "Escudo del lanzador de conjuros", 3153),
        base(40, "Escudo espinoso", 5580),
        base(60, "Escudo del león", 9170),
        base(90, "Escudo alado", 17257),
        base(100, "Escudo absorbente", 50170),
      ],
    },
  },
};

/** Top of an ability's range in the minor, medium and major columns; "—" is null. */
type Columns = [number | null, number | null, number | null];
type AbilityEntry = { ability: SpecialAbility; columns: Columns };

const bonus = (
  name: string,
  value: number,
  columns: Columns,
  version?: string,
): AbilityEntry => ({ ability: { name, bonus: value, priceCp: 0, version }, columns });

const fixed = (
  name: string,
  po: number,
  columns: Columns,
  version?: string,
): AbilityEntry => ({ ability: { name, bonus: 0, priceCp: gp(po), version }, columns });

/** Splits a table printed with three columns into one row list per category. */
function byCategory(
  entries: readonly AbilityEntry[],
): Record<MagicCategory, readonly AbilityRow[]> {
  const column = (index: number): AbilityRow[] => [
    ...entries.flatMap(({ ability, columns }) => {
      const upTo = columns[index];
      return upTo === null ? [] : [{ upTo, ability }];
    }),
    { upTo: 100, ability: "rollTwice" },
  ];
  return { minor: column(0), medium: column(1), major: column(2) };
}

/**
 * Table 7-5 ("Aptitudes especiales de las armaduras"). Row 100 of every
 * column is "Tira de nuevo dos veces".
 *
 * NOTE: the book prints "01-20" for Ilusoria in the minor column and the next
 * row starts at 26; it is given 01-25, as in the original English table.
 */
const ARMOR_ABILITIES = byCategory([
  fixed("Ilusoria", 2700, [25, 5, 3]),
  bonus("Fortificante leve", 1, [32, 8, 4], "fortificante"),
  fixed("Resbaladiza", 3750, [52, 11, null], "resbaladiza"),
  fixed("De las sombras", 3750, [72, 14, null], "sombras"),
  fixed("Silenciosa", 3750, [92, 17, null], "silenciosa"),
  bonus("Resistente a conjuros (13)", 2, [96, 19, null], "conjuros"),
  fixed("Resbaladiza, mejorada", 15000, [97, 29, 7], "resbaladiza"),
  fixed("De las sombras, mejorada", 15000, [98, 39, 10], "sombras"),
  fixed("Silenciosa, mejorada", 15000, [99, 49, 13], "silenciosa"),
  fixed("Resistente al ácido", 18000, [null, 54, 16], "ácido"),
  fixed("Resistente al frío", 18000, [null, 59, 19], "frío"),
  fixed("Resistente a la electricidad", 18000, [null, 64, 22], "electricidad"),
  fixed("Resistente al fuego", 18000, [null, 69, 25], "fuego"),
  fixed("Resistente al sonido", 18000, [null, 74, 28], "sonido"),
  bonus("Fantasmal", 3, [null, 79, 33]),
  bonus("De invulnerabilidad", 3, [null, 84, 35]),
  bonus("Fortificante moderada", 3, [null, 89, 40], "fortificante"),
  bonus("Resistente a conjuros (15)", 3, [null, 94, 42], "conjuros"),
  bonus("Salvaje", 3, [null, 99, 43]),
  fixed("Resbaladiza, mayor", 37750, [null, null, 48], "resbaladiza"),
  fixed("De las sombras, mayor", 37750, [null, null, 53], "sombras"),
  fixed("Silenciosa, mayor", 37750, [null, null, 58], "silenciosa"),
  fixed("Resistente al ácido, mejorada", 42000, [null, null, 63], "ácido"),
  fixed("Resistente al frío, mejorada", 42000, [null, null, 68], "frío"),
  fixed("Resistente a la electricidad, mejorada", 42000, [null, null, 73], "electricidad"),
  fixed("Resistente al fuego, mejorada", 42000, [null, null, 78], "fuego"),
  fixed("Resistente al sonido, mejorada", 42000, [null, null, 83], "sonido"),
  bonus("Resistente a conjuros (17)", 4, [null, null, 88], "conjuros"),
  fixed("De etereidad", 49000, [null, null, 89]),
  fixed("De controlar muertos vivientes", 49000, [null, null, 90]),
  bonus("Fortificante intensa", 5, [null, null, 92], "fortificante"),
  bonus("Resistente a conjuros (19)", 5, [null, null, 94], "conjuros"),
  fixed("Resistente al ácido, mayor", 66000, [null, null, 95], "ácido"),
  fixed("Resistente al frío, mayor", 66000, [null, null, 96], "frío"),
  fixed("Resistente a la electricidad, mayor", 66000, [null, null, 97], "electricidad"),
  fixed("Resistente al fuego, mayor", 66000, [null, null, 98], "fuego"),
  fixed("Resistente al sonido, mayor", 66000, [null, null, 99], "sonido"),
]);

/**
 * Table 7-6 ("Aptitudes especiales de los escudos"). Row 100 of every column
 * is "Tira de nuevo dos veces".
 */
const SHIELD_ABILITIES = byCategory([
  bonus("Atrapaflechas", 1, [20, 10, 5]),
  bonus("Golpeador", 1, [40, 20, 8]),
  bonus("Cegador", 1, [50, 25, 10]),
  bonus("Fortificante leve", 1, [75, 40, 15], "fortificante"),
  bonus("Desviaflechas", 2, [92, 50, 20]),
  bonus("Animado", 2, [97, 57, 25]),
  bonus("Resistente a conjuros (13)", 2, [99, 59, null], "conjuros"),
  fixed("Resistente al ácido", 18000, [null, 63, 28], "ácido"),
  fixed("Resistente al frío", 18000, [null, 67, 31], "frío"),
  fixed("Resistente a la electricidad", 18000, [null, 71, 34], "electricidad"),
  fixed("Resistente al fuego", 18000, [null, 75, 37], "fuego"),
  fixed("Resistente al sonido", 18000, [null, 79, 40], "sonido"),
  bonus("Fantasmal", 3, [null, 85, 46]),
  bonus("Fortificante moderado", 3, [null, 95, 56], "fortificante"),
  bonus("Resistente a conjuros (15)", 3, [null, 98, 58], "conjuros"),
  bonus("Salvaje", 3, [null, 99, 59]),
  fixed("Resistente al ácido, mejorado", 42000, [null, null, 64], "ácido"),
  fixed("Resistente al frío, mejorado", 42000, [null, null, 69], "frío"),
  fixed("Resistente a la electricidad, mejorado", 42000, [null, null, 74], "electricidad"),
  fixed("Resistente al fuego, mejorado", 42000, [null, null, 79], "fuego"),
  fixed("Resistente al sonido, mejorado", 42000, [null, null, 84], "sonido"),
  bonus("Resistente a conjuros (17)", 4, [null, null, 86], "conjuros"),
  fixed("De controlar muertos vivientes", 49000, [null, null, 87]),
  bonus("Fortificante intenso", 5, [null, null, 91], "fortificante"),
  bonus("Reflectante", 5, [null, null, 93]),
  bonus("Resistente a conjuros (19)", 5, [null, null, 94], "conjuros"),
  fixed("Resistente al ácido, mayor", 66000, [null, null, 95], "ácido"),
  fixed("Resistente al frío, mayor", 66000, [null, null, 96], "frío"),
  fixed("Resistente a la electricidad, mayor", 66000, [null, null, 97], "electricidad"),
  fixed("Resistente al fuego, mayor", 66000, [null, null, 98], "fuego"),
  fixed("Resistente al sonido, mayor", 66000, [null, null, 99], "sonido"),
]);

const ABILITIES: Record<
  Kind,
  { label: string; rows: Record<MagicCategory, readonly AbilityRow[]> }
> = {
  armor: { label: "Table 7-5", rows: ARMOR_ABILITIES },
  shield: { label: "Table 7-6", rows: SHIELD_ABILITIES },
};

/**
 * Footnote of tables 7-5 and 7-6: an ability that comes up twice counts once,
 * and of two versions of one ability the best one is kept (the versions of an
 * ability are all priced as a bonus or all in po, so the dearer one is best).
 */
function keepBest(abilities: readonly SpecialAbility[]): SpecialAbility[] {
  const best = new Map<string, SpecialAbility>();
  for (const ability of abilities) {
    const key = ability.version ?? ability.name;
    const kept = best.get(key);
    if (!kept || ability.bonus + ability.priceCp > kept.bonus + kept.priceCp) {
      best.set(key, ability);
    }
  }
  return [...best.values()];
}

/** Rolls d% on a table and keeps the roll. */
function roll<Row extends { upTo: number }>(
  label: string,
  rows: readonly Row[],
  die: Die,
  rolls: Roll[],
): Row {
  const percentile = rollPercentile(die);
  rolls.push({ label, dice: "d%", values: [percentile] });
  return pickRow(rows, percentile);
}

/** Resolver of the "Armadura y escudos" family: tables 7-2 to 7-8. */
export function rollMagicArmor(
  category: MagicCategory,
  die: Die,
): MagicResolution {
  const rolls: Roll[] = [];
  const label = `Table 7-2, ${category}`;
  let abilityCount = 0;
  let row = roll(label, ARMOR_TABLE[category], die, rolls);
  // A specific object can't take an ability, so after "tira de nuevo" one is
  // rolled again.
  while (!("kind" in row) && (abilityCount > 0 || !("specific" in row))) {
    if ("abilityAndRollAgain" in row) abilityCount += 1;
    row = roll(label, ARMOR_TABLE[category], die, rolls);
  }
  if ("specific" in row) {
    const specific = SPECIFIC[row.specific];
    const specificLabel = `${specific.label}, ${category}`;
    const { name, priceCp } = roll(specificLabel, specific.rows[category], die, rolls);
    return { name, valueCp: priceCp, rolls };
  }

  const types = BASE_TYPES[row.kind];
  const type = roll(types.label, types.rows, die, rolls);
  const table = ABILITIES[row.kind];
  const abilities = keepBest(rollAbilities(
    `${table.label}, ${category}`,
    table.rows[category],
    abilityCount,
    die,
    rolls,
    (candidate, chosen) =>
      totalBonus(row.enhancement, keepBest([...chosen, candidate])) <=
      MAX_TOTAL_BONUS,
  ));
  return {
    ...describeMagicGear(type, row.enhancement, abilities, ARMOR_BONUS_PRICES_PO),
    rolls,
  };
}
