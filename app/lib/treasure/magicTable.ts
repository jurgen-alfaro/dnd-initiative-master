import { pickRow, type Die } from "./dice";
import { rollPotion } from "./potionTable";
import { rollRing } from "./ringTable";
import { rollRod } from "./rodTable";
import { rollStaff } from "./staffTable";
import { rollWand } from "./wandTable";
import { rollWondrous } from "./wondrousTable";
import type { ItemCategory, Roll, TreasureItem } from "./treasure";

/** Categories of magic objects: menor, intermedio, mayor. */
export type MagicCategory = Extract<ItemCategory, "minor" | "medium" | "major">;

/** Families of table 7-1, with the name the DMG prints for each. */
export const MAGIC_FAMILY_NAMES = {
  armor: "Armadura y escudos",
  weapon: "Armas",
  potion: "Pociones",
  ring: "Anillos",
  rod: "Cetros",
  scroll: "Rollos de pergamino",
  staff: "Bastones",
  wand: "Varitas",
  wondrous: "Objetos maravillosos",
} as const;
export type MagicFamily = keyof typeof MAGIC_FAMILY_NAMES;

const CATEGORY_NAMES: Record<MagicCategory, string> = {
  minor: "menor",
  medium: "intermedio",
  major: "mayor",
};

type MagicRow = { upTo: number; family: MagicFamily };

/**
 * Table 7-1 ("Generación aleatoria de objetos mágicos"), one column per
 * category. A "—" in the book is a family with no row in that column (there
 * are no minor rods or staffs), so the ranges of a column stay contiguous.
 */
export const MAGIC_TABLE: Record<MagicCategory, readonly MagicRow[]> = {
  minor: [
    { upTo: 4, family: "armor" },
    { upTo: 9, family: "weapon" },
    { upTo: 44, family: "potion" },
    { upTo: 46, family: "ring" },
    { upTo: 81, family: "scroll" },
    { upTo: 91, family: "wand" },
    { upTo: 100, family: "wondrous" },
  ],
  medium: [
    { upTo: 10, family: "armor" },
    { upTo: 20, family: "weapon" },
    { upTo: 30, family: "potion" },
    { upTo: 40, family: "ring" },
    { upTo: 50, family: "rod" },
    { upTo: 65, family: "scroll" },
    { upTo: 68, family: "staff" },
    { upTo: 83, family: "wand" },
    { upTo: 100, family: "wondrous" },
  ],
  major: [
    { upTo: 10, family: "armor" },
    { upTo: 20, family: "weapon" },
    { upTo: 25, family: "potion" },
    { upTo: 35, family: "ring" },
    { upTo: 45, family: "rod" },
    { upTo: 55, family: "scroll" },
    { upTo: 75, family: "staff" },
    { upTo: 80, family: "wand" },
    { upTo: 100, family: "wondrous" },
  ],
};

/** What a family resolver gives back: the object it picked and its rolls. */
export type MagicResolution = Pick<TreasureItem, "name" | "valueCp" | "rolls">;

/** Rolls the tables of one family until a concrete magic object is picked. */
export type MagicResolver = (
  category: MagicCategory,
  die: Die,
) => MagicResolution;

export type MagicResolvers = Partial<Record<MagicFamily, MagicResolver>>;

/**
 * Where the tickets of each family plug in: add `potion: rollPotion` (and so
 * on) to this object once that family's tables exist. Until then a family is
 * shown as "Objeto mágico <categoría>: <familia>", without a price.
 */
export const MAGIC_RESOLVERS: MagicResolvers = {
  potion: rollPotion,
  ring: rollRing,
  rod: rollRod,
  staff: rollStaff,
  wand: rollWand,
  wondrous: rollWondrous,
};

/** Rolls a magic object of `category`: table 7-1, then the family's resolver. */
export function rollMagicItem(
  category: MagicCategory,
  die: Die,
  resolvers: MagicResolvers = MAGIC_RESOLVERS,
): TreasureItem {
  const percentile = die(100);
  const familyRoll: Roll = {
    label: `Table 7-1, ${category}`,
    dice: "d%",
    values: [percentile],
  };
  const { family } = pickRow(MAGIC_TABLE[category], percentile);

  const resolver = resolvers[family];
  const resolution: MagicResolution = resolver
    ? resolver(category, die)
    : {
        name: `Objeto mágico ${CATEGORY_NAMES[category]}: ${MAGIC_FAMILY_NAMES[family]}`,
        valueCp: 0,
        rolls: [],
      };

  return {
    category,
    ...resolution,
    rolls: [familyRoll, ...resolution.rolls],
  };
}
