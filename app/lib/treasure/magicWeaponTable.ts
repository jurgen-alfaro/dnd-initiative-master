import { poToCp } from "./coins";
import {
  joinDescription,
  MUNDANE_DESCRIPTIONS,
  SPECIFIC_DESCRIPTIONS,
  WEAPON_ABILITY_DESCRIPTIONS,
  weaponBonus,
} from "./descriptions";
import { rollPercentile, rollTable, type Die } from "./dice";
import {
  bonus,
  byCategory,
  describeGearParts,
  describeMagicGear,
  MAX_TOTAL_BONUS,
  rollAbilities,
  totalBonus,
  type AbilityRow,
  type SpecialAbility,
} from "./magicGear";
import type { MagicCategory, MagicResolution } from "./magicTable";
import {
  COMMON_MELEE,
  pickLeaf,
  RANGED_WEAPONS,
  UNCOMMON_WEAPONS,
  type DamageType,
  type Node,
  type Weapon,
} from "./mundaneTable";
import type { Roll } from "./treasure";

/** A row of table 7-9. */
type WeaponRow = { upTo: number } & (
  | { enhancement: number }
  | { specific: true }
  | { abilityAndRollAgain: true }
);

/** Table 7-9 ("Armas"), one column per category. */
const WEAPON_TABLE: Record<MagicCategory, readonly WeaponRow[]> = {
  minor: [
    { upTo: 70, enhancement: 1 },
    { upTo: 85, enhancement: 2 },
    { upTo: 90, specific: true },
    { upTo: 100, abilityAndRollAgain: true },
  ],
  medium: [
    { upTo: 10, enhancement: 1 },
    { upTo: 20, enhancement: 2 },
    { upTo: 58, enhancement: 3 },
    { upTo: 62, enhancement: 4 },
    { upTo: 68, specific: true },
    { upTo: 100, abilityAndRollAgain: true },
  ],
  major: [
    { upTo: 20, enhancement: 3 },
    { upTo: 38, enhancement: 4 },
    { upTo: 49, enhancement: 5 },
    { upTo: 63, specific: true },
    { upTo: 100, abilityAndRollAgain: true },
  ],
};

/**
 * Price of each total bonus, +1 to +10, as table 7-9 prints it (po). For
 * ammunition it is the price of fifty pieces.
 */
const WEAPON_BONUS_PRICES_PO = [
  2000, 8000, 18000, 32000, 50000, 72000, 98000, 128000, 162000, 200000,
];

/** Table 7-10 ("Determinación del tipo de arma"). */
const WEAPON_TYPES: readonly Node<Weapon>[] = [
  { upTo: 70, table: "Table 7-11", rows: COMMON_MELEE },
  { upTo: 80, table: "Table 7-12", rows: UNCOMMON_WEAPONS },
  { upTo: 100, table: "Table 7-13", rows: RANGED_WEAPONS },
];

type Specific = { upTo: number; name: string; priceCp: number };
const specific = (upTo: number, name: string, po: number): Specific => ({
  upTo,
  name,
  priceCp: poToCp(po),
});

/** Table 7-16 ("Armas específicas"), one column per category, at market price. */
export const SPECIFIC_WEAPONS: Record<MagicCategory, readonly Specific[]> = {
  minor: [
    specific(15, "Flecha adormecedora", 132),
    specific(25, "Virote aullante", 267),
    specific(45, "Daga de plata de gran calidad", 322),
    specific(65, "Espada larga de hierro frío de gran calidad", 330),
    specific(75, "Jabalina del relámpago", 1500),
    specific(80, "Flecha asesina", 2282),
    specific(90, "Daga adamantina", 3002),
    specific(100, "Hacha de batalla adamantina", 3010),
  ],
  medium: [
    specific(9, "Jabalina del relámpago", 1500),
    specific(15, "Flecha asesina", 2282),
    specific(24, "Daga adamantina", 3002),
    specific(33, "Hacha de batalla adamantina", 3010),
    specific(37, "Flecha asesina (mayor)", 4057),
    specific(40, "Rompedora", 4315),
    specific(46, "Daga de ponzoña", 8302),
    specific(51, "Tridente avisador", 10115),
    specific(57, "Daga del asesino", 10302),
    specific(62, "Tormento de cambiantes", 12780),
    specific(66, "Tridente de comandar peces", 18650),
    specific(74, "Lengua flamígera", 20715),
    specific(79, "Hoja de la suerte (0 deseos)", 22060),
    specific(86, "Espada de sutileza", 22310),
    specific(91, "Espada de los Planos", 22315),
    specific(95, "Robadora de nueve vidas", 23057),
    specific(98, "Espada arrebatavidas", 25715),
    specific(100, "Arco juramentado", 25600),
  ],
  major: [
    specific(4, "Daga del asesino", 10302),
    specific(7, "Tormento de cambiantes", 12780),
    specific(9, "Tridente de comandar peces", 18650),
    specific(13, "Lengua flamígera", 20715),
    specific(17, "Hoja de la suerte (0 deseos)", 22060),
    specific(24, "Espada de sutileza", 22310),
    specific(31, "Espada de los Planos", 22315),
    specific(37, "Robadora de nueve vidas", 23057),
    specific(42, "Espada arrebatavidas", 25715),
    specific(46, "Arco juramentado", 25600),
    specific(51, "Maza del terror", 38552),
    specific(57, "Bebedora de vidas", 40320),
    specific(62, "Cimitarra de los bosques", 47315),
    specific(67, "Estoque punzante", 50320),
    specific(73, "Hoja solar", 50335),
    specific(79, "Hierro de escarcha", 54475),
    specific(84, "Martillo arrojadizo de los enanos", 60312),
    specific(91, "Hoja de la suerte (1 deseo)", 62360),
    specific(95, "Maza del castigo", 75312),
    specific(97, "Hoja de la suerte (2 deseos)", 102660),
    specific(99, "Vengadora sagrada", 120630),
    specific(100, "Hoja de la suerte (3 deseos)", 142960),
  ],
};

/**
 * Versions shared by abilities that can't go together on one weapon: opposed
 * alignments, and an energy ability with its burst, which already includes it.
 */
const LAW_AND_CHAOS = "ley y caos";
const GOOD_AND_EVIL = "bien y mal";
const FIRE = "fuego";
const COLD = "frío";
const ELECTRICITY = "electricidad";

/**
 * Table 7-14 ("Aptitudes especiales de las armas cuerpo a cuerpo"). The book
 * prints the feminine forms. Row 100 (minor) and 96-100 or 91-100 of the other
 * columns are "Tira de nuevo dos veces".
 */
export const MELEE_ABILITIES = byCategory([
  bonus("Azote", 1, [10, 6, 3]),
  bonus(["Defensor", "Defensora"], 1, [17, 12, null]),
  bonus(["Flamígero", "Flamígera"], 1, [27, 19, 6], FIRE),
  bonus(["Congelador", "Congeladora"], 1, [37, 26, 9], COLD),
  bonus("Electrizante", 1, [47, 33, 12], ELECTRICITY),
  bonus("Fantasmal", 1, [56, 38, 15]),
  bonus(["Afilado", "Afilada"], 1, [67, 44, null]),
  bonus(["Canalizador de ki", "Canalizadora de ki"], 1, [71, 48, 19]),
  bonus(["Compasivo", "Compasiva"], 1, [75, 50, null]),
  bonus("Hendiente", 1, [82, 54, 21]),
  bonus("Almacenaconjuros", 1, [87, 59, 24]),
  bonus(["Arrojadizo", "Arrojadiza"], 1, [91, 63, 28]),
  bonus("Tronante", 1, [95, 65, 32]),
  bonus(["Vicioso", "Viciosa"], 1, [99, 69, 36]),
  bonus(["Anárquico", "Anárquica"], 2, [null, 72, 41], LAW_AND_CHAOS),
  bonus(["Axiomático", "Axiomática"], 2, [null, 75, 46], LAW_AND_CHAOS),
  bonus(["Disruptor", "Disruptora"], 2, [null, 78, 49]),
  bonus(["Explosivo ígneo", "Explosiva ígnea"], 2, [null, 81, 54], FIRE),
  bonus(["Explosivo gélido", "Explosiva gélida"], 2, [null, 84, 59], COLD),
  bonus(["Sagrado", "Sagrada"], 2, [null, 87, 64], GOOD_AND_EVIL),
  bonus(["Explosivo eléctrico", "Explosiva eléctrica"], 2, [null, 90, 69], ELECTRICITY),
  bonus(["Sacrílego", "Sacrílega"], 2, [null, 93, 74], GOOD_AND_EVIL),
  bonus("Hiriente", 2, [null, 95, 78]),
  bonus("Veloz", 3, [null, null, 83]),
  bonus("Radiante", 4, [null, null, 86]),
  bonus("Danzante", 4, [null, null, 88]),
  bonus(["Vorpalino", "Vorpalina"], 5, [null, null, 90]),
]);

/**
 * Table 7-15 ("Aptitudes especiales de las armas a distancia"). The book
 * prints the feminine forms.
 */
export const RANGED_ABILITIES = byCategory([
  bonus("Azote", 1, [12, 8, 4]),
  bonus("Distante", 1, [25, 16, 8]),
  bonus(["Flamígero", "Flamígera"], 1, [40, 28, 12], FIRE),
  bonus(["Congelador", "Congeladora"], 1, [55, 40, 16], COLD),
  bonus(["Compasivo", "Compasiva"], 1, [60, 42, null]),
  bonus("Retornante", 1, [68, 47, 21]),
  bonus("Electrizante", 1, [83, 59, 25], ELECTRICITY),
  bonus(["Buscador", "Buscadora"], 1, [93, 64, 27]),
  bonus("Tronante", 1, [99, 68, 29]),
  bonus(["Anárquico", "Anárquica"], 2, [null, 71, 34], LAW_AND_CHAOS),
  bonus(["Axiomático", "Axiomática"], 2, [null, 74, 39], LAW_AND_CHAOS),
  bonus(["Explosivo ígneo", "Explosiva ígnea"], 2, [null, 79, 49], FIRE),
  bonus(["Sagrado", "Sagrada"], 2, [null, 82, 54], GOOD_AND_EVIL),
  bonus(["Explosivo gélido", "Explosiva gélida"], 2, [null, 87, 64], COLD),
  bonus(["Explosivo eléctrico", "Explosiva eléctrica"], 2, [null, 92, 74], ELECTRICITY),
  bonus(["Sacrílego", "Sacrílega"], 2, [null, 95, 79], GOOD_AND_EVIL),
  bonus("Veloz", 3, [null, null, 84]),
  bonus("Radiante", 4, [null, null, 90]),
]);

const ABILITIES: Record<
  "melee" | "ranged",
  { label: string; rows: Record<MagicCategory, readonly AbilityRow[]> }
> = {
  melee: { label: "Table 7-14", rows: MELEE_ABILITIES },
  ranged: { label: "Table 7-15", rows: RANGED_ABILITIES },
};

const deals = (weapon: Weapon, ...types: DamageType[]) =>
  types.some((type) => weapon.damage.includes(type));

/**
 * Abilities that only fit some weapons, keyed by their feminine name: the
 * footnotes of table 7-14 for damage, and the descriptions of the abilities
 * of table 7-15 (SRD: returning needs a thrown weapon, distance and seeking a
 * ranged one, ammunition included).
 *
 * NOTE: footnote 2 says "Sólo para armas cortantes" for Afilada, but its
 * description and the SRD also allow piercing weapons; the author chose to
 * follow the description and the SRD.
 */
const FITS_WEAPON: ReadonlyMap<string, (weapon: Weapon) => boolean> = new Map([
  ["Afilada", (w: Weapon) => deals(w, "slashing", "piercing")],
  ["Vorpalina", (w: Weapon) => deals(w, "slashing")],
  ["Disruptora", (w: Weapon) => deals(w, "bludgeoning")],
  ["Retornante", (w: Weapon) => w.isThrown === true],
  ["Distante", (w: Weapon) => w.isRanged === true],
  ["Buscadora", (w: Weapon) => w.isRanged === true],
]);

/**
 * Footnotes of tables 7-14 and 7-15: an ability is rolled again if the weapon
 * can't take it, if it is already there (or one it can't go with is), or if it
 * takes the total bonus over +10.
 */
function accepts(
  weapon: Weapon,
  enhancement: number,
  candidate: SpecialAbility,
  chosen: readonly SpecialAbility[],
): boolean {
  const fits = FITS_WEAPON.get(candidate.name.feminine);
  const key = (a: SpecialAbility) => a.version ?? a.name.feminine;
  return (
    (fits === undefined || fits(weapon)) &&
    !chosen.some((a) => key(a) === key(candidate)) &&
    totalBonus(enhancement, [...chosen, candidate]) <= MAX_TOTAL_BONUS
  );
}

const SECOND_HEAD_LABEL = "Double weapon, second head";
/** d% 01-50: the second head is like the first one. */
const SAME_SECOND_HEAD_UP_TO = 50;

/**
 * Footnote 2 of tables 7-11 and 7-12: the second head of a double weapon has
 * the same enhancement as the first one (d% 01-50), which doubles the price
 * of the bonus, or one less and no abilities (51-100). Gives its name ("+2
 * flamígera", "+1", "+0") and the price it adds.
 *
 * NOTE: the footnote doesn't say whether a second head "like the first one"
 * also has its abilities; it is given them, so that the price of the whole
 * bonus doubles.
 */
function rollSecondHead(
  weapon: Weapon,
  enhancement: number,
  abilities: readonly SpecialAbility[],
  die: Die,
  rolls: Roll[],
): { name: string; valueCp: number } {
  const percentile = rollPercentile(die);
  rolls.push({ label: SECOND_HEAD_LABEL, dice: "d%", values: [percentile] });
  const head = { name: "", priceCp: 0, gender: weapon.gender };
  if (percentile <= SAME_SECOND_HEAD_UP_TO) {
    const second = describeMagicGear(head, enhancement, abilities, WEAPON_BONUS_PRICES_PO);
    return { name: second.name.trim(), valueCp: second.valueCp };
  }
  if (enhancement === 1) return { name: "+0", valueCp: 0 };
  const second = describeMagicGear(head, enhancement - 1, [], WEAPON_BONUS_PRICES_PO);
  return { name: second.name.trim(), valueCp: second.valueCp };
}

/** Resolver of the "Armas" family: tables 7-9 to 7-16. */
export function rollMagicWeapon(
  category: MagicCategory,
  die: Die,
): MagicResolution {
  const rolls: Roll[] = [];
  const label = `Table 7-9, ${category}`;
  let abilityCount = 0;
  let row = rollTable(label, WEAPON_TABLE[category], die, rolls);
  // A specific weapon can't take an ability, so after "tira otra vez" one is
  // rolled again.
  while (!("enhancement" in row) && (abilityCount > 0 || !("specific" in row))) {
    if ("abilityAndRollAgain" in row) abilityCount += 1;
    row = rollTable(label, WEAPON_TABLE[category], die, rolls);
  }
  if ("specific" in row) {
    const specificLabel = `Table 7-16, ${category}`;
    const { name, priceCp } = rollTable(specificLabel, SPECIFIC_WEAPONS[category], die, rolls);
    return { name, valueCp: priceCp, description: SPECIFIC_DESCRIPTIONS[name], rolls };
  }

  const { enhancement } = row;
  const weapon = pickLeaf("Table 7-10", WEAPON_TYPES, die, rolls);
  const table = ABILITIES[weapon.isRanged ? "ranged" : "melee"];
  const abilities = rollAbilities(
    `${table.label}, ${category}`,
    table.rows[category],
    abilityCount,
    die,
    rolls,
    (candidate, chosen) => accepts(weapon, enhancement, candidate, chosen),
  );
  const first = describeMagicGear(weapon, enhancement, abilities, WEAPON_BONUS_PRICES_PO);
  const description = describeGearParts(
    MUNDANE_DESCRIPTIONS[weapon.name],
    weaponBonus(enhancement),
    weapon.gender,
    abilities,
    WEAPON_ABILITY_DESCRIPTIONS,
  );
  if (!weapon.isDouble) return { ...first, description, rolls };

  const second = rollSecondHead(weapon, enhancement, abilities, die, rolls);
  return {
    name: `${first.name}/${second.name}`,
    valueCp: first.valueCp + second.valueCp,
    description: joinDescription([description, `Segundo extremo: ${second.name}.`]),
    rolls,
  };
}
