import { rollTable, type Die } from "./dice";
import { rollMagicArmor } from "./magicArmorTable";
import { rollMagicWeapon } from "./magicWeaponTable";
import { rollPotion } from "./potionTable";
import { rollRing } from "./ringTable";
import { rollRod } from "./rodTable";
import { rollScroll } from "./scrollTable";
import { rollStaff } from "./staffTable";
import { rollWand } from "./wandTable";
import { rollWondrous } from "./wondrousTable";
import type {
  InventoryCategory,
  ItemCategory,
  ItemUsage,
  Roll,
  TreasureItem,
} from "./treasure";

/** Categories of magic objects: menor, intermedio, mayor. */
export type MagicCategory = Extract<ItemCategory, "minor" | "medium" | "major">;

/**
 * Families of table 7-1: Armadura y escudos, Armas, Pociones, Anillos, Cetros,
 * Rollos de pergamino, Bastones, Varitas and Objetos maravillosos.
 */
export type MagicFamily =
  | "armor"
  | "weapon"
  | "potion"
  | "ring"
  | "rod"
  | "scroll"
  | "staff"
  | "wand"
  | "wondrous";

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

/**
 * What a family resolver gives back: the object it picked and its rolls, and
 * its use when it isn't the family's.
 */
export type MagicResolution = Pick<
  TreasureItem,
  "name" | "valueCp" | "rolls" | "description" | "charges"
> &
  Partial<Pick<TreasureItem, "usage">>;

/** Rolls the tables of one family until a concrete magic object is picked. */
export type MagicResolver = (
  category: MagicCategory,
  die: Die,
) => MagicResolution;

/** The resolver of each family of table 7-1. */
const MAGIC_RESOLVERS: Record<MagicFamily, MagicResolver> = {
  armor: rollMagicArmor,
  weapon: rollMagicWeapon,
  potion: rollPotion,
  ring: rollRing,
  rod: rollRod,
  scroll: rollScroll,
  staff: rollStaff,
  wand: rollWand,
  wondrous: rollWondrous,
};

/** Where each family goes in the inventario and how it is used up. */
const FAMILY_INVENTORY: Record<
  MagicFamily,
  { inventoryCategory: InventoryCategory; usage: ItemUsage }
> = {
  armor: { inventoryCategory: "armor", usage: "none" },
  weapon: { inventoryCategory: "weapons", usage: "none" },
  potion: { inventoryCategory: "consumables", usage: "drink" },
  ring: { inventoryCategory: "magicItems", usage: "none" },
  rod: { inventoryCategory: "magicItems", usage: "none" },
  scroll: { inventoryCategory: "consumables", usage: "use" },
  staff: { inventoryCategory: "magicItems", usage: "none" },
  wand: { inventoryCategory: "magicItems", usage: "none" },
  wondrous: { inventoryCategory: "wondrous", usage: "none" },
};

/** Rolls a magic object of `category`: table 7-1, then the family's resolver. */
export function rollMagicItem(
  category: MagicCategory,
  die: Die,
): TreasureItem {
  const familyRolls: Roll[] = [];
  const { family } = rollTable(
    `Table 7-1, ${category}`,
    MAGIC_TABLE[category],
    die,
    familyRolls,
  );
  const resolution = MAGIC_RESOLVERS[family](category, die);

  return {
    category,
    ...FAMILY_INVENTORY[family],
    quantity: 1,
    ...resolution,
    rolls: [...familyRolls, ...resolution.rolls],
  };
}
