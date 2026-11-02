import {
  pickRow,
  rollDice,
  rollPercentile,
  type DiceNotation,
  type Die,
} from "./dice";
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
type Node = { upTo: number } & (
  | { item: Priced }
  | { table: string; rows: readonly Node[] }
);

const gp = (po: number) => Math.round(po * 100);

const item = (upTo: number, name: string, po: number): Node => ({
  upTo,
  item: { name, priceCp: gp(po) },
});

const alchemical = (
  upTo: number,
  name: string,
  quantity: DiceNotation,
  po: number,
): Node => ({ upTo, item: { name, priceCp: gp(po), quantity } });

const armor = (upTo: number, name: string, po: number): Node => ({
  upTo,
  item: { name, priceCp: gp(po), sized: true },
});

/** A weapon of table 7-11 to 7-13: the price printed is for the masterwork one. */
const weapon = (upTo: number, name: string, cp: number): Node =>
  item(upTo, `${name} de gran calidad`, cp / 100);

const ARMOR_SIZE_LABEL = "Table 3-8, armor size";
/** Armor size: d% 01-10 is Pequeña, 11-100 is Mediana. */
const SMALL_ARMOR_UP_TO = 10;

/** Ammunition of table 7-13, fifty pieces each. */
const AMMUNITION: readonly Node[] = [
  weapon(50, "Flechas (50)", 35000),
  weapon(80, "Virotes de ballesta (50)", 35000),
  weapon(100, "Balas de honda (50)", 35000),
];

/** Table 7-11: armas cuerpo a cuerpo comunes. */
const COMMON_MELEE: readonly Node[] = [
  weapon(3, "Bastón", 60000),
  weapon(8, "Cimitarra", 31500),
  weapon(12, "Daga", 30200),
  weapon(22, "Espada bastarda", 33500),
  weapon(27, "Espada corta", 31000),
  weapon(40, "Espada larga", 31500),
  weapon(50, "Espadón", 35000),
  weapon(54, "Estoque", 32000),
  weapon(64, "Gran hacha", 32000),
  weapon(75, "Hacha de guerra enana", 33000),
  weapon(79, "Kama", 30200),
  weapon(83, "Lanza corta", 30200),
  weapon(87, "Maza ligera", 30500),
  weapon(92, "Maza pesada", 31200),
  weapon(96, "Nunchaku", 30200),
  weapon(100, "Siangham", 30300),
];

/** Table 7-12: armas infrecuentes. */
const UNCOMMON_WEAPONS: readonly Node[] = [
  weapon(3, "Alabarda", 31000),
  weapon(5, "Alfanjón", 37500),
  weapon(9, "Ballesta de mano", 40000),
  weapon(12, "Ballesta de repetición", 55000),
  weapon(14, "Bisarma", 30900),
  weapon(16, "Cachiporra", 30100),
  weapon(19, "Cadena armada", 32500),
  weapon(21, "Clava", 30000),
  weapon(24, "Espada de dos hojas", 70000),
  weapon(26, "Gran clava", 30500),
  weapon(28, "Guadaña", 31800),
  weapon(30, "Guantelete", 30200),
  weapon(32, "Guantelete armado", 30500),
  weapon(34, "Guja", 30800),
  weapon(38, "Hacha de batalla", 31000),
  weapon(40, "Hacha de mano", 30600),
  weapon(43, "Hacha doble orca", 66000),
  weapon(45, "Hoz", 30600),
  weapon(48, "Kukri", 30800),
  weapon(50, "Lanza larga", 30500),
  weapon(52, "Lanza ligera de caballería", 30600),
  weapon(54, "Lanza pesada de caballería", 31000),
  weapon(57, "Látigo", 30100),
  weapon(60, "Mangual doble", 69000),
  weapon(64, "Mangual ligero", 30800),
  weapon(69, "Mangual pesado", 31500),
  weapon(72, "Martillo de guerra", 31200),
  weapon(75, "Martillo ganchudo gnomo", 62000),
  weapon(77, "Martillo ligero", 30100),
  weapon(80, "Maza de armas", 30800),
  weapon(83, "Media lanza", 30100),
  weapon(85, "Pico ligero", 30400),
  weapon(87, "Pico pesado", 30800),
  weapon(89, "Puñal", 30200),
  weapon(91, "Red", 32000),
  weapon(93, "Ronca", 31000),
  weapon(95, "Shuriken", 30100),
  weapon(97, "Tridente", 31500),
  weapon(100, "Urgrosh enano", 65000),
];

/** Table 7-13: armas a distancia comunes. */
const RANGED_WEAPONS: readonly Node[] = [
  { upTo: 10, table: "Table 7-13, ammunition", rows: AMMUNITION },
  weapon(15, "Hacha arrojadiza", 30800),
  weapon(25, "Ballesta pesada", 35000),
  weapon(35, "Ballesta ligera", 33500),
  weapon(39, "Dardos (50)", 30050),
  weapon(41, "Jabalina", 30100),
  weapon(46, "Arco corto", 33000),
  weapon(51, "Arco corto compuesto (bonificador Fue +0)", 37500),
  weapon(56, "Arco corto compuesto (bonificador Fue +1)", 45000),
  weapon(61, "Arco corto compuesto (bonificador Fue +2)", 52500),
  weapon(65, "Honda", 30000),
  weapon(75, "Arco largo", 37500),
  weapon(80, "Arco largo compuesto", 40000),
  weapon(85, "Arco largo compuesto (bonificador Fue +1)", 50000),
  weapon(90, "Arco largo compuesto (bonificador Fue +2)", 60000),
  weapon(95, "Arco largo compuesto (bonificador Fue +3)", 70000),
  weapon(100, "Arco largo compuesto (bonificador Fue +4)", 80000),
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
      { upTo: 50, table: "Table 7-11", rows: COMMON_MELEE },
      { upTo: 70, table: "Table 7-12", rows: UNCOMMON_WEAPONS },
      { upTo: 100, table: "Table 7-13", rows: RANGED_WEAPONS },
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
function pickLeaf(
  table: string,
  rows: readonly Node[],
  die: Die,
  rolls: Roll[],
): Priced {
  const percentile = rollPercentile(die);
  rolls.push({ label: table, dice: "d%", values: [percentile] });
  const node = pickRow(rows, percentile);
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
