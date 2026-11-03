import { poToCp } from "./coins";
import { rollTable, type Die } from "./dice";
import type { MagicCategory } from "./magicTable";
import type { Roll } from "./treasure";

/**
 * What magic armor, shields and weapons share: their special abilities
 * (tables 7-5, 7-6, 7-14 and 7-15) and their price by total bonus (tables 7-2
 * and 7-9).
 */

/** Enhancement plus the bonus of the abilities can't go over +10. */
export const MAX_TOTAL_BONUS = 10;

/** Grammatical gender of a base object, which its abilities agree with. */
export type Gender = "masculine" | "feminine";

/** A word in the form that agrees with a masculine and a feminine base. */
export type Gendered = Record<Gender, string>;

/**
 * An invariable word ("Fortificante leve"), or its masculine and feminine
 * forms ("Silencioso", "Silenciosa").
 */
export function gendered(
  name: string | readonly [masculine: string, feminine: string],
): Gendered {
  return typeof name === "string"
    ? { masculine: name, feminine: name }
    : { masculine: name[0], feminine: name[1] };
}

export type SpecialAbility = {
  name: Gendered;
  /** Bonus equivalent ("Bonif. +N"); 0 for an ability with a fixed price. */
  bonus: number;
  /** Fixed price ("+N po") in pc; 0 for an ability priced as a bonus. */
  priceCp: number;
  /** Shared by the versions of one ability ("Silenciosa", "…, mejorada"). */
  version?: string;
};

/** A row of an abilities table: an ability or "Tira de nuevo dos veces". */
export type AbilityRow = {
  upTo: number;
  ability: SpecialAbility | "rollTwice";
};

/** Enhancement plus the bonus equivalent of every ability. */
export function totalBonus(
  enhancement: number,
  abilities: readonly SpecialAbility[],
): number {
  return abilities.reduce((total, a) => total + a.bonus, enhancement);
}

/**
 * Rolls `count` abilities on a d% table. "Tira de nuevo dos veces" adds two
 * more rolls. A candidate that `accepts` turns down is rolled again (a weapon
 * rerolls duplicates, incompatible abilities and anything over +10).
 */
export function rollAbilities(
  label: string,
  rows: readonly AbilityRow[],
  count: number,
  die: Die,
  rolls: Roll[],
  accepts: (
    candidate: SpecialAbility,
    chosen: readonly SpecialAbility[],
  ) => boolean,
): SpecialAbility[] {
  const chosen: SpecialAbility[] = [];
  let pending = count;
  // Once no ability of the table could be accepted (a weapon already at +10),
  // the rolls still pending are lost instead of rerolled forever.
  const canAcceptMore = () =>
    rows.some(({ ability }) => ability !== "rollTwice" && accepts(ability, chosen));
  while (pending > 0 && canAcceptMore()) {
    const { ability } = rollTable(label, rows, die, rolls);
    if (ability === "rollTwice") {
      pending += 1;
    } else if (accepts(ability, chosen)) {
      chosen.push(ability);
      pending -= 1;
    }
  }
  return chosen;
}

/**
 * Name and price of a magic armor, shield or weapon: the base object, plus the
 * price of its total bonus in `bonusPricesPo` (+1 to +10, as table 7-2 or 7-9
 * prints it), plus the abilities with a fixed price. The abilities agree with
 * the gender of the base: "Coraza +2 silenciosa", "Cuero +2 silencioso".
 */
export function describeMagicGear(
  base: { name: string; priceCp: number; gender: Gender },
  enhancement: number,
  abilities: readonly SpecialAbility[],
  bonusPricesPo: readonly number[],
): { name: string; valueCp: number } {
  const total = totalBonus(enhancement, abilities);
  const bonusPrice = bonusPricesPo[total - 1];
  if (bonusPrice === undefined) {
    throw new RangeError(`No price for a total bonus of +${total}`);
  }
  const names = abilities.map((a) => a.name[base.gender].toLowerCase());
  const suffix = names.length ? ` ${new Intl.ListFormat("es").format(names)}` : "";

  return {
    name: `${base.name} +${enhancement}${suffix}`,
    valueCp:
      base.priceCp +
      poToCp(bonusPrice) +
      abilities.reduce((sum, a) => sum + a.priceCp, 0),
  };
}

/** Top of an ability's range in the minor, medium and major columns; "—" is null. */
export type Columns = [number | null, number | null, number | null];
export type AbilityEntry = { ability: SpecialAbility; columns: Columns };

/** An invariable name, or its masculine and feminine forms. */
type Name = Parameters<typeof gendered>[0];

export const bonus = (
  name: Name,
  value: number,
  columns: Columns,
  version?: string,
): AbilityEntry => ({
  ability: { name: gendered(name), bonus: value, priceCp: 0, version },
  columns,
});

export const fixed = (
  name: Name,
  po: number,
  columns: Columns,
  version?: string,
): AbilityEntry => ({
  ability: { name: gendered(name), bonus: 0, priceCp: poToCp(po), version },
  columns,
});

/** Splits a table printed with three columns into one row list per category. */
export function byCategory(
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
