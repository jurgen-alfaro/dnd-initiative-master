import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Die } from "./dice";
import { rollMagicItem, type MagicCategory } from "./magicTable";
import { BAG_OF_TRICKS_ANIMALS, WONDROUS_TABLES } from "./wondrousTable";

/** Replays `values` in order and fails on any roll the test did not plan. */
function fixedDie(...values: number[]): Die {
  let next = 0;
  return (sides) => {
    const value = values[next++];
    assert.ok(value !== undefined, `unexpected roll of d${sides}`);
    assert.ok(value >= 1 && value <= sides, `${value} is not a d${sides} roll`);
    return value;
  };
}

/** Table 7-1 sends 100 to wondrous objects in every category. */
const WONDROUS = 100;

/** Cells copied by hand from the DMG captures: [d%, name, price in po]. */
const BOOK: Record<MagicCategory, [number, string, number][]> = {
  minor: [
    [1, "Fetiche de plumas de Quaal (ancla)", 50],
    [2, "Disolvente universal", 50],
    [17, "Polvo de sequedad", 850],
    [58, "Figurita de poder maravilloso (cuervo de plata)", 3800],
    [73, "Collar de bolas de fuego (tipo III)", 4350],
    [99, "Bolsa de contención (tipo III)", 7400],
    [100, "Presea contra venenos", 7400],
  ],
  medium: [
    [1, "Botas de levitación", 7500],
    [59, "Vaina de bordes afilados", 15000],
    [77, "Azadón de los titanes", 23348],
    [87, "Mazo de los titanes", 25305],
    [100, "Tomo de entendimiento +1", 27500],
  ],
  major: [
    [1, "Grilletes dimensionales", 28000],
    [48, "Alfombra voladora (10 × 10')", 60000],
    [62, "Pozo de muchos mundos", 82000],
    [99, "Espejo de poder mental", 175000],
    [100, "Espejo atrapavidas", 200000],
  ],
};

describe("rollMagicItem, wondrous objects", () => {
  for (const [category, cells] of Object.entries(BOOK) as [
    MagicCategory,
    [number, string, number][],
  ][]) {
    for (const [roll, name, po] of cells) {
      it(`should give ${name} at ${roll} on the ${category} table`, () => {
        const item = rollMagicItem(category, fixedDie(WONDROUS, roll));
        assert.equal(item.name, name);
        assert.equal(item.valueCp, po * 100);
        assert.equal(item.category, category);
        assert.deepEqual(item.rolls.at(-1)?.values, [roll]);
      });
    }
  }

  it("should cover every roll from 1 to 100 on each table", () => {
    for (const rows of Object.values(WONDROUS_TABLES)) {
      assert.equal(rows.length, 100);
      assert.equal(rows.at(-1)?.upTo, 100);
    }
  });

  it("should roll the animal of a gray bag of tricks on its own subtable", () => {
    const item = rollMagicItem("minor", fixedDie(WONDROUS, 18, 61));
    assert.equal(item.name, "Bolsa de trucos (gris): Gato");
    assert.equal(item.valueCp, 900 * 100);
    assert.equal(item.rolls.length, 3);
  });

  it("should roll the animal of a rust bag of tricks on its own subtable", () => {
    const item = rollMagicItem("minor", fixedDie(WONDROUS, 50, 86));
    assert.equal(item.name, "Bolsa de trucos (óxido): Oso negro");
    assert.equal(item.valueCp, 3000 * 100);
  });

  it("should roll the animal of a tan bag of tricks on its own subtable", () => {
    const item = rollMagicItem("minor", fixedDie(WONDROUS, 92, 91));
    assert.equal(item.name, "Bolsa de trucos (canela): Rinoceronte");
    assert.equal(item.valueCp, 6300 * 100);
  });

  it("should give an animal for every roll of every bag subtable", () => {
    for (const rows of Object.values(BAG_OF_TRICKS_ANIMALS)) {
      assert.equal(rows.at(-1)?.upTo, 100);
    }
  });

  it("should not roll an animal for other objects", () => {
    const item = rollMagicItem("minor", fixedDie(WONDROUS, 19));
    assert.equal(item.name, "Mano del mago");
  });
});
