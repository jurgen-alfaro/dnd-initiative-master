import { poToCp } from "./coins";
import {
  rollDice,
  rollPercentile,
  rollTable,
  type DiceNotation,
  type Die,
} from "./dice";
import type { Gender } from "./magicGear";
import type { Roll, TreasureItem } from "./treasure";

/** What a leaf of the tables gives. */
type Priced = {
  name: string;
  priceCp: number;
  /** Dice for how many are found; the price is per unit. */
  quantity?: DiceNotation;
  /** An armor, which is rolled as Pequeña or Mediana. */
  sized?: true;
};

/**
 * A d% range of a table: either an object, or a nested table with its own d%
 * (which is how table 3-8 hands over to tables 7-11, 7-12 and 7-13).
 */
export type Node<Leaf = Priced> = { upTo: number } & (
  | { item: Leaf }
  | { table: string; rows: readonly Node<Leaf>[] }
);

/** Damage a weapon deals (PHB table 7-5). */
export type DamageType = "bludgeoning" | "piercing" | "slashing";

/**
 * A weapon of tables 7-11 to 7-13, with what the magic weapon tables need:
 * the gender its abilities agree with and the damage it deals.
 */
export type Weapon = {
  /** Without "de gran calidad". */
  name: string;
  /** Price of the masterwork weapon, as the tables print it. */
  priceCp: number;
  gender: Gender;
  /** Empty for a weapon that deals no damage (the net). */
  damage: readonly DamageType[];
  /** Takes the abilities of ranged weapons (table 7-15). */
  isRanged?: true;
  /** Can be thrown: has a range increment and isn't shot (PHB table 7-5). */
  isThrown?: true;
  /** Has two heads (footnote 2 of tables 7-11 and 7-12). */
  isDouble?: true;
};

const item = (upTo: number, name: string, po: number): Node => ({
  upTo,
  item: { name, priceCp: poToCp(po) },
});

const alchemical = (
  upTo: number,
  name: string,
  quantity: DiceNotation,
  po: number,
): Node => ({ upTo, item: { name, priceCp: poToCp(po), quantity } });

const armor = (upTo: number, name: string, po: number): Node => ({
  upTo,
  item: { name, priceCp: poToCp(po), sized: true },
});

const M: Gender = "masculine";
const F: Gender = "feminine";
const B: DamageType = "bludgeoning";
const P: DamageType = "piercing";
const S: DamageType = "slashing";

/** A weapon of tables 7-11 to 7-13, priced in pc as the masterwork one. */
const weapon = (
  upTo: number,
  name: string,
  priceCp: number,
  gender: Gender,
  damage: readonly DamageType[],
  flags: Pick<Weapon, "isRanged" | "isThrown" | "isDouble"> = {},
): Node<Weapon> => ({ upTo, item: { name, priceCp, gender, damage, ...flags } });

type WeaponArgs = [
  upTo: number,
  name: string,
  priceCp: number,
  gender: Gender,
  damage: readonly DamageType[],
];
const ranged = (...args: WeaponArgs) => weapon(...args, { isRanged: true });
/** A melee weapon that can also be thrown (dagger, spear…). */
const thrown = (...args: WeaponArgs) => weapon(...args, { isThrown: true });
/** A weapon made to be thrown (javelin, dart…): ranged and thrown. */
const thrownRanged = (...args: WeaponArgs) =>
  weapon(...args, { isRanged: true, isThrown: true });
const double = (...args: WeaponArgs) => weapon(...args, { isDouble: true });

/** The mundane version of a weapon table: every weapon is "de gran calidad". */
function masterwork(rows: readonly Node<Weapon>[]): Node[] {
  return rows.map((row) =>
    "rows" in row
      ? { ...row, rows: masterwork(row.rows) }
      : {
          upTo: row.upTo,
          item: { name: `${row.item.name} de gran calidad`, priceCp: row.item.priceCp },
        },
  );
}

const ARMOR_SIZE_LABEL = "Table 3-8, armor size";
/** Armor size: d% 01-10 is Pequeña, 11-100 is Mediana. */
const SMALL_ARMOR_UP_TO = 10;

/** Ammunition of table 7-13, fifty pieces each. */
export const AMMUNITION: readonly Node<Weapon>[] = [
  ranged(50, "Flechas (50)", 35000, F, [P]),
  ranged(80, "Virotes de ballesta (50)", 35000, M, [P]),
  ranged(100, "Balas de honda (50)", 35000, F, [B]),
];

/** Table 7-11: armas cuerpo a cuerpo comunes. */
export const COMMON_MELEE: readonly Node<Weapon>[] = [
  double(3, "Bastón", 60000, M, [B]),
  weapon(8, "Cimitarra", 31500, F, [S]),
  thrown(12, "Daga", 30200, F, [P, S]),
  weapon(22, "Espada bastarda", 33500, F, [S]),
  weapon(27, "Espada corta", 31000, F, [P]),
  weapon(40, "Espada larga", 31500, F, [S]),
  weapon(50, "Espadón", 35000, M, [S]),
  weapon(54, "Estoque", 32000, M, [P]),
  weapon(64, "Gran hacha", 32000, F, [S]),
  weapon(75, "Hacha de guerra enana", 33000, F, [S]),
  weapon(79, "Kama", 30200, F, [S]),
  thrown(83, "Lanza corta", 30200, F, [P]),
  weapon(87, "Maza ligera", 30500, F, [B]),
  weapon(92, "Maza pesada", 31200, F, [B]),
  weapon(96, "Nunchaku", 30200, M, [B]),
  weapon(100, "Siangham", 30300, M, [P]),
];

/** Table 7-12: armas infrecuentes. */
export const UNCOMMON_WEAPONS: readonly Node<Weapon>[] = [
  weapon(3, "Alabarda", 31000, F, [P, S]),
  weapon(5, "Alfanjón", 37500, M, [S]),
  ranged(9, "Ballesta de mano", 40000, F, [P]),
  ranged(12, "Ballesta de repetición", 55000, F, [P]),
  weapon(14, "Bisarma", 30900, F, [S]),
  weapon(16, "Cachiporra", 30100, F, [B]),
  weapon(19, "Cadena armada", 32500, F, [P]),
  thrown(21, "Clava", 30000, F, [B]),
  double(24, "Espada de dos hojas", 70000, F, [S]),
  weapon(26, "Gran clava", 30500, F, [B]),
  weapon(28, "Guadaña", 31800, F, [P, S]),
  weapon(30, "Guantelete", 30200, M, [B]),
  weapon(32, "Guantelete armado", 30500, M, [P]),
  weapon(34, "Guja", 30800, F, [S]),
  weapon(38, "Hacha de batalla", 31000, F, [S]),
  weapon(40, "Hacha de mano", 30600, F, [S]),
  double(43, "Hacha doble orca", 66000, F, [S]),
  weapon(45, "Hoz", 30600, F, [S]),
  weapon(48, "Kukri", 30800, M, [S]),
  weapon(50, "Lanza larga", 30500, F, [P]),
  weapon(52, "Lanza ligera de caballería", 30600, F, [P]),
  weapon(54, "Lanza pesada de caballería", 31000, F, [P]),
  weapon(57, "Látigo", 30100, M, [S]),
  double(60, "Mangual doble", 69000, M, [B]),
  weapon(64, "Mangual ligero", 30800, M, [B]),
  weapon(69, "Mangual pesado", 31500, M, [B]),
  weapon(72, "Martillo de guerra", 31200, M, [B]),
  double(75, "Martillo ganchudo gnomo", 62000, M, [B, P]),
  thrown(77, "Martillo ligero", 30100, M, [B]),
  weapon(80, "Maza de armas", 30800, F, [B, P]),
  thrown(83, "Media lanza", 30100, F, [P]),
  weapon(85, "Pico ligero", 30400, M, [P]),
  weapon(87, "Pico pesado", 30800, M, [P]),
  weapon(89, "Puñal", 30200, M, [P]),
  thrownRanged(91, "Red", 32000, F, []),
  weapon(93, "Ronca", 31000, F, [P]),
  thrownRanged(95, "Shuriken", 30100, M, [P]),
  thrown(97, "Tridente", 31500, M, [P]),
  double(100, "Urgrosh enano", 65000, M, [P, S]),
];

/** Table 7-13: armas a distancia comunes. */
export const RANGED_WEAPONS: readonly Node<Weapon>[] = [
  { upTo: 10, table: "Table 7-13, ammunition", rows: AMMUNITION },
  thrownRanged(15, "Hacha arrojadiza", 30800, F, [S]),
  ranged(25, "Ballesta pesada", 35000, F, [P]),
  ranged(35, "Ballesta ligera", 33500, F, [P]),
  thrownRanged(39, "Dardos (50)", 30050, M, [P]),
  thrownRanged(41, "Jabalina", 30100, F, [P]),
  ranged(46, "Arco corto", 33000, M, [P]),
  ranged(51, "Arco corto compuesto (bonificador Fue +0)", 37500, M, [P]),
  ranged(56, "Arco corto compuesto (bonificador Fue +1)", 45000, M, [P]),
  ranged(61, "Arco corto compuesto (bonificador Fue +2)", 52500, M, [P]),
  ranged(65, "Honda", 30000, F, [B]),
  ranged(75, "Arco largo", 37500, M, [P]),
  ranged(80, "Arco largo compuesto", 40000, M, [P]),
  ranged(85, "Arco largo compuesto (bonificador Fue +1)", 50000, M, [P]),
  ranged(90, "Arco largo compuesto (bonificador Fue +2)", 60000, M, [P]),
  ranged(95, "Arco largo compuesto (bonificador Fue +3)", 70000, M, [P]),
  ranged(100, "Arco largo compuesto (bonificador Fue +4)", 80000, M, [P]),
];

/**
 * Table 3-8 ("Objetos mundanos") of DMG 3.5 with the weapon tables it sends
 * to (7-11 to 7-13).
 *
 * NOTE: the book prints no quantity and no price for the antorcha
 * siempreardiente; it uses the SRD price of 110 po, as the author chose.
 */
const MUNDANE_TABLE: readonly Node[] = [
  {
    upTo: 17,
    table: "Table 3-8, alchemical",
    rows: [
      alchemical(12, "Fuego de alquimista", "1d4", 20),
      alchemical(24, "Ácido", "2d4", 10),
      alchemical(36, "Ahumadera", "1d4", 20),
      alchemical(48, "Agua bendita", "1d4", 25),
      alchemical(62, "Contraveneno", "1d4", 50),
      item(74, "Antorcha siempreardiente", 110),
      alchemical(88, "Bolsas de maraña", "1d4", 50),
      alchemical(100, "Piedras de trueno", "1d4", 30),
    ],
  },
  {
    upTo: 50,
    table: "Table 3-8, armor",
    rows: [
      armor(12, "Camisote de mallas", 100),
      armor(18, "Armadura de cuero tachonado de gran calidad", 175),
      armor(26, "Coraza", 200),
      armor(34, "Cota de bandas", 250),
      armor(54, "Armadura de placas y mallas", 600),
      armor(80, "Armadura completa", 1500),
      {
        upTo: 90,
        table: "Table 3-8, darkwood shield",
        rows: [
          item(50, "Broquel de maderaoscura", 205),
          item(100, "Escudo de maderaoscura", 257),
        ],
      },
      {
        upTo: 100,
        table: "Table 3-8, masterwork shield",
        rows: [
          item(17, "Broquel de gran calidad", 165),
          item(40, "Escudo ligero de madera de gran calidad", 153),
          item(60, "Escudo ligero de acero de gran calidad", 159),
          item(83, "Escudo pesado de madera de gran calidad", 157),
          item(100, "Escudo pesado de acero de gran calidad", 170),
        ],
      },
    ],
  },
  {
    upTo: 83,
    table: "Table 3-8, weapons",
    rows: [
      { upTo: 50, table: "Table 7-11", rows: masterwork(COMMON_MELEE) },
      { upTo: 70, table: "Table 7-12", rows: masterwork(UNCOMMON_WEAPONS) },
      { upTo: 100, table: "Table 7-13", rows: masterwork(RANGED_WEAPONS) },
    ],
  },
  {
    upTo: 100,
    table: "Table 3-8, tools",
    rows: [
      item(3, "Mochila, vacía", 2),
      item(6, "Palanqueta", 2),
      item(11, "Linterna de ojo de buey", 12),
      item(16, "Cerradura sencilla", 20),
      item(21, "Cerradura corriente", 40),
      item(28, "Cerradura de calidad", 80),
      item(35, "Cerradura superior", 150),
      item(40, "Grilletes de gran calidad", 50),
      item(43, "Espejito de acero pulido", 10),
      item(46, "Cuerda de seda (50')", 10),
      item(53, "Catalejo", 1000),
      item(58, "Herramientas de gran calidad para artesano", 55),
      item(63, "Material de escalada", 80),
      item(68, "Material de disfraz", 50),
      item(73, "Material de curandero", 50),
      item(77, "Símbolo sagrado de plata", 25),
      item(81, "Reloj de arena", 25),
      item(88, "Lupa", 100),
      item(95, "Instrumento musical de gran calidad", 100),
      item(100, "Herramientas de ladrón de gran calidad", 50),
    ],
  },
];

/** Follows the d% of each nested table down to a leaf, keeping every roll. */
export function pickLeaf<Leaf>(
  table: string,
  rows: readonly Node<Leaf>[],
  die: Die,
  rolls: Roll[],
): Leaf {
  const node = rollTable(table, rows, die, rolls);
  return "rows" in node ? pickLeaf(node.table, node.rows, die, rolls) : node.item;
}

/** Rolls table 3-8 (and the weapon tables it sends to) for one mundane object. */
export function rollMundaneItem(die: Die): TreasureItem {
  const rolls: Roll[] = [];
  const leaf = pickLeaf("Table 3-8", MUNDANE_TABLE, die, rolls);

  if (leaf.quantity) {
    const values = rollDice(die, leaf.quantity);
    rolls.push({ label: "Table 3-8, alchemical", dice: leaf.quantity, values });
    const amount = values.reduce((a, b) => a + b, 0);
    return {
      category: "mundane",
      name: `${leaf.name} ×${amount}`,
      valueCp: leaf.priceCp * amount,
      rolls,
    };
  }

  if (leaf.sized) {
    const percentile = rollPercentile(die);
    rolls.push({ label: ARMOR_SIZE_LABEL, dice: "d%", values: [percentile] });
    const size = percentile <= SMALL_ARMOR_UP_TO ? "Pequeña" : "Mediana";
    return {
      category: "mundane",
      name: `${leaf.name} (${size})`,
      valueCp: leaf.priceCp,
      rolls,
    };
  }

  return {
    category: "mundane",
    name: leaf.name,
    valueCp: leaf.priceCp,
    rolls,
  };
}
