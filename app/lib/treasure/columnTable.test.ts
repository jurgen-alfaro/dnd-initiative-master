import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rollMagicItem, type MagicCategory } from "./magicTable";
import { fixedDie } from "./testDice";
import { POTION_ROWS } from "./potionTable";
import { RING_ROWS } from "./ringTable";
import { ROD_ROWS } from "./rodTable";
import { STAFF_ROWS } from "./staffTable";
import { WAND_ROWS } from "./wandTable";
import type { ColumnRow } from "./columnTable";
import { formatItemName } from "./treasure";

/** A d% of table 7-1 that lands on each family, per category. */
const FAMILY_ROLL = {
  potion: { minor: 10, medium: 30, major: 25 },
  ring: { minor: 45, medium: 40, major: 35 },
  rod: { medium: 50, major: 45 },
  staff: { medium: 68, major: 75 },
  wand: { minor: 82, medium: 83, major: 80 },
} as const;

/** Rolls `family` in `category` with the given rolls after the family roll. */
function roll(
  family: keyof typeof FAMILY_ROLL,
  category: MagicCategory,
  ...rolls: number[]
) {
  const familyRoll: Partial<Record<MagicCategory, number>> = FAMILY_ROLL[family];
  const percentile = familyRoll[category];
  assert.ok(percentile !== undefined, `no ${family} in ${category}`);
  const die = fixedDie(percentile, ...rolls);
  const item = rollMagicItem(category, die);
  assert.equal(die.rest(), 0, "every planned roll was used");
  return item;
}

describe("potions and oils (table 7-20)", () => {
  it("should give the object and price at the edges of each range", () => {
    assert.equal(roll("potion", "minor", 1).name, "Curar heridas leves (poción)");
    assert.equal(roll("potion", "minor", 10).name, "Curar heridas leves (poción)");
    assert.equal(roll("potion", "minor", 11).name, "Soportar los elementos (poción)");
    assert.equal(roll("potion", "minor", 39).name, "Garrote (aceite)");
    const bless = roll("potion", "minor", 40);
    assert.equal(bless.name, "Bendecir arma (aceite)");
    assert.equal(bless.valueCp, 10_000);
    const last = roll("potion", "minor", 100);
    assert.equal(last.name, "Alineamiento indetectable (poción)");
    assert.equal(last.valueCp, 30_000);
    assert.equal(roll("potion", "medium", 1).name, "Bendecir arma (aceite)");
    assert.equal(roll("potion", "medium", 100).name, "Caminar sobre las aguas (poción)");
    assert.equal(roll("potion", "major", 1).name, "Contorno borroso (poción)");
    const top = roll("potion", "major", 100);
    assert.equal(top.name, "Vestidura mágica +5 (aceite)");
    assert.equal(top.valueCp, 300_000);
  });

  it("should record the family roll and the table roll", () => {
    const item = roll("potion", "minor", 40);
    assert.deepEqual(
      item.rolls.map((r) => [r.label, r.dice, r.values]),
      [
        ["Table 7-1, minor", "d%", [10]],
        ["Table 7-20, minor", "d%", [40]],
      ],
    );
  });

  it("should pick an energy type at random for (tipo)", () => {
    const names = [1, 2, 3, 4, 5].map((type) => roll("potion", "minor", 94, type).name);
    assert.deepEqual(names, [
      "Resistir energía (ácido) 10 (poción)",
      "Resistir energía (frío) 10 (poción)",
      "Resistir energía (electricidad) 10 (poción)",
      "Resistir energía (fuego) 10 (poción)",
      "Resistir energía (sonido) 10 (poción)",
    ]);
    assert.equal(
      roll("potion", "medium", 89, 4).name,
      "Protección contra la energía (fuego) (poción)",
    );
  });

  it("should pick an alignment at random for (alineamiento)", () => {
    const names = [1, 2, 3, 4].map((a) => roll("potion", "minor", 31, a).name);
    assert.deepEqual(names, [
      "Protección contra (caos) (poción)",
      "Protección contra (mal) (poción)",
      "Protección contra (bien) (poción)",
      "Protección contra (ley) (poción)",
    ]);
    assert.equal(
      roll("potion", "medium", 81, 4).name,
      "Círculo mágico contra (ley) (poción)",
    );
  });
});

describe("rings (table 7-17)", () => {
  it("should give the object and price in every category", () => {
    const first = roll("ring", "minor", 1);
    assert.equal(first.name, "Anillo: Protección +1");
    assert.equal(first.valueCp, 200_000);
    assert.equal(roll("ring", "minor", 99).name, "Anillo: Caminar sobre las aguas");
    assert.equal(roll("ring", "medium", 100).name, "Anillo: Resistir energía, mayor");
    const wishes = roll("ring", "major", 89);
    assert.equal(wishes.name, "Anillo: Tres deseos");
    assert.equal(wishes.valueCp, 9_795_000);
    assert.equal(roll("ring", "major", 100).valueCp, 20_000_000);
  });
});

describe("rods (table 7-19)", () => {
  it("should give the object and price in medium and major", () => {
    const first = roll("rod", "medium", 1);
    assert.equal(first.name, "Cetro: Metamágico, ampliación, menor");
    assert.equal(first.valueCp, 300_000);
    assert.equal(roll("rod", "medium", 100).name, "Cetro: Metamágico, apresuración, menor");
    const last = roll("rod", "major", 100);
    assert.equal(last.name, "Cetro: Metamágico, apresuración, mayor");
    assert.equal(last.valueCp, 17_000_000);
  });
});

describe("staffs (table 7-18)", () => {
  it("should give between 1 and 50 charges, announced next to the name", () => {
    const one = roll("staff", "medium", 96, 1);
    assert.deepEqual([one.name, one.charges], ["Bastón: Defensa", 1]);
    assert.equal(formatItemName(one), "Bastón: Defensa (1 carga)");
    assert.equal(one.valueCp, 5_825_000);
    const fifty = roll("staff", "major", 100, 50);
    assert.equal(formatItemName(fifty), "Bastón: Poder (50 cargas)");
    assert.deepEqual(fifty.rolls.at(-1), { label: "Charges", dice: "1d50", values: [50] });
  });
});

describe("wands (table 7-26)", () => {
  it("should give the object, price and charges in every category", () => {
    const first = roll("wand", "minor", 1, 20);
    assert.deepEqual([first.name, first.charges], ["Varita: Detectar magia", 20]);
    assert.equal(first.valueCp, 37_500);
    assert.equal(formatItemName(roll("wand", "minor", 37, 7)), "Varita: Proyectil mágico (5.°) (7 cargas)");
    assert.equal(formatItemName(roll("wand", "medium", 1, 7)), "Varita: Proyectil mágico (5.°) (7 cargas)");
    const top = roll("wand", "major", 100, 50);
    assert.equal(formatItemName(top), "Varita: Piel pétrea (50 cargas)");
    assert.equal(top.valueCp, 3_350_000);
  });
});

/** Every column a table prints must run from 1 to 100 with no gap or overlap. */
function assertColumnsContiguous(rows: readonly ColumnRow[], present: MagicCategory[]) {
  for (const category of ["minor", "medium", "major"] as const) {
    const ranges = rows.map((r) => r.ranges[category]).filter((r) => r !== undefined);
    if (!present.includes(category)) {
      assert.equal(ranges.length, 0, `${category} column is empty`);
      continue;
    }
    let expected = 1;
    for (const [low, high] of ranges) {
      assert.equal(low, expected, `${category}: range starts at ${low}, expected ${expected}`);
      assert.ok(high >= low);
      expected = high + 1;
    }
    assert.equal(expected, 101, `${category} column ends at ${expected - 1}`);
  }
}

describe("magic item tables", () => {
  it("should cover d% 1-100 exactly once in every column", () => {
    assertColumnsContiguous(POTION_ROWS, ["minor", "medium", "major"]);
    assertColumnsContiguous(RING_ROWS, ["minor", "medium", "major"]);
    assertColumnsContiguous(WAND_ROWS, ["minor", "medium", "major"]);
    assertColumnsContiguous(ROD_ROWS, ["medium", "major"]);
    assertColumnsContiguous(STAFF_ROWS, ["medium", "major"]);
  });
});
