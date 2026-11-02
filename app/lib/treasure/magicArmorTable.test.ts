import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rollMagicItem, type MagicCategory } from "./magicTable";
import type { Die } from "./dice";

/** A die that replays `values` in order and fails on any unplanned roll. */
function fixedDie(...values: number[]): Die & { rest: () => number } {
  let next = 0;
  const die: Die = (sides) => {
    const value = values[next++];
    assert.ok(value !== undefined, `unexpected roll of d${sides}`);
    assert.ok(value >= 1 && value <= sides, `${value} is not a d${sides} roll`);
    return value;
  };
  return Object.assign(die, { rest: () => values.length - next });
}

/** d% on table 7-1 that gives "Armadura y escudos" in every category. */
const ARMOR_FAMILY = 1;

/** Rolls a magic armor or shield of `category`; `rolls` start at table 7-2. */
function rollArmor(category: MagicCategory, ...rolls: number[]) {
  const die = fixedDie(ARMOR_FAMILY, ...rolls);
  const item = rollMagicItem(category, die);
  assert.equal(die.rest(), 0, "every planned roll must be used");
  return { name: item.name, po: item.valueCp / 100 };
}

describe("magic armor and shields (tables 7-2 to 7-8)", () => {
  it("should price an enchanted shield as its type plus the bonus of table 7-2", () => {
    // 7-2 minor 01-60 Escudo +1 (1.000 po); 7-4 01-10 Broquel o rodela (+165 po).
    assert.deepEqual(rollArmor("minor", 1, 1), {
      name: "Broquel o rodela +1",
      po: 1165,
    });
  });

  it("should give a specific armor or shield at its market price", () => {
    // 7-2 minor 88-89 → 7-7 minor 01-50.
    assert.deepEqual(rollArmor("minor", 88, 50), {
      name: "Camisote de mallas de mithril",
      po: 1100,
    });
    // 7-2 medium 61-63 → 7-8 medium 71-85.
    assert.deepEqual(rollArmor("medium", 63, 71), {
      name: "Escudo del lanzador de conjuros",
      po: 3153,
    });
    // 7-2 major 58-60 → 7-7 major: the book prints "01-10" for the banded
    // mail of luck, but the only gap left in the column is 21-32.
    assert.deepEqual(rollArmor("major", 60, 21), {
      name: "Cota de bandas de la suerte",
      po: 18900,
    });
    assert.deepEqual(rollArmor("major", 60, 32).name, "Cota de bandas de la suerte");
    // 7-2 major 61-63 → 7-8 major 91-100.
    assert.deepEqual(rollArmor("major", 61, 100), {
      name: "Escudo absorbente",
      po: 50170,
    });
  });

  describe("special ability and roll again", () => {
    it("should add a fixed-price ability to the price of the bonus", () => {
      // 7-2 medium 64-100 → 21-30 Armadura +2 → 7-3 45-57 Coraza (+350 po)
      // → 7-5 medium 15-17 Silenciosa (+3.750 po).
      // 350 + 4.000 (+2) + 3.750 = 8.100 po.
      assert.deepEqual(rollArmor("medium", 64, 25, 50, 15), {
        name: "Coraza +2 silenciosa",
        po: 8100,
      });
    });

    it("should price a bonus ability with the total bonus of table 7-2", () => {
      // 7-2 minor 92-100 → 61-80 Armadura +1 → 7-3 61-100 Completa (+1.650)
      // → 7-5 minor 26-32 Fortificante leve (Bonif. +1): priced as +2.
      // 1.650 + 4.000 = 5.650 po.
      assert.deepEqual(rollArmor("minor", 92, 70, 100, 30), {
        name: "Completa +1 fortificante leve",
        po: 5650,
      });
      // The book's own example: armor +5 with fortificante leve is priced as
      // +6. 7-2 major 50-57 Armadura +5 → Coraza → 7-5 major 04.
      // 350 + 36.000 = 36.350 po.
      assert.deepEqual(rollArmor("major", 64, 55, 45, 4), {
        name: "Coraza +5 fortificante leve",
        po: 36350,
      });
    });

    it("should roll a shield's ability on table 7-6", () => {
      // 7-2 minor 100 → 01-60 Escudo +1 → 7-4 31-95 Escudo pesado de acero
      // (+170) → 7-6 minor 41-50 Cegador (Bonif. +1): 170 + 4.000 = 4.170 po.
      assert.deepEqual(rollArmor("minor", 100, 1, 50, 41), {
        name: "Escudo pesado de acero +1 cegador",
        po: 4170,
      });
    });

    it("should add one ability for every time it comes up", () => {
      // 7-2 medium 64, 100, then 01-05 Escudo +1 → Broquel (+165)
      // → 7-6 medium 21-25 Cegador (+1) and 26-40 Fortificante leve (+1).
      // Priced as +3: 165 + 9.000 = 9.165 po.
      assert.deepEqual(rollArmor("medium", 64, 100, 5, 1, 21, 26), {
        name: "Broquel o rodela +1 cegador y fortificante leve",
        po: 9165,
      });
    });

    it("should roll table 7-2 again when the new roll is a specific object", () => {
      // 7-2 minor 92-100, then 88-89 (specific armor: can't take an ability),
      // then 01-60 Escudo +1 → Broquel → 7-6 minor 01-20 Atrapaflechas (+1).
      // 165 + 4.000 = 4.165 po.
      assert.deepEqual(rollArmor("minor", 95, 88, 1, 1, 1), {
        name: "Broquel o rodela +1 atrapaflechas",
        po: 4165,
      });
    });
  });

  describe("roll again twice (tables 7-5 and 7-6)", () => {
    it("should replace the roll with two abilities", () => {
      // 7-2 medium 64 → 21-30 Armadura +2 → Coraza (+350) → 7-5 medium 100,
      // then 15-17 Silenciosa (+3.750) and 01-05 Ilusoria (+2.700).
      // 350 + 4.000 + 3.750 + 2.700 = 10.800 po.
      assert.deepEqual(rollArmor("medium", 64, 25, 50, 100, 15, 1), {
        name: "Coraza +2 silenciosa e ilusoria",
        po: 10800,
      });
    });

    it("should count an ability that comes up twice only once", () => {
      // 7-2 minor 92 → 61-80 Armadura +1 → Coraza → 7-5 minor 100, then
      // 33-52 Resbaladiza twice. 350 + 1.000 + 3.750 = 5.100 po.
      assert.deepEqual(rollArmor("minor", 92, 70, 50, 100, 40, 33), {
        name: "Coraza +1 resbaladiza",
        po: 5100,
      });
    });

    it("should keep the best of two versions of one ability", () => {
      // 7-5 medium 100, then 20-29 Resbaladiza, mejorada (+15.000) and 09-11
      // Resbaladiza (+3.750): 350 + 4.000 (+2) + 15.000 = 19.350 po.
      assert.deepEqual(rollArmor("medium", 64, 25, 50, 100, 25, 10), {
        name: "Coraza +2 resbaladiza, mejorada",
        po: 19350,
      });
      // 7-2 major 01-08 Escudo +3 → Escudo pesado de acero (+170) → 7-6 major
      // 100, then 11-15 Fortificante leve (+1) and 47-56 Fortificante
      // moderado (+3): priced as +6, 170 + 36.000 = 36.170 po.
      assert.deepEqual(rollArmor("major", 64, 1, 50, 100, 12, 50), {
        name: "Escudo pesado de acero +3 fortificante moderado",
        po: 36170,
      });
    });
  });

  it("should roll again an ability that takes the total bonus over +10", () => {
    // 7-2 major 64, 64, then 50-57 Armadura +5 → Coraza (+350) → 7-5 major
    // 91-92 Fortificante intensa (+5, total +10), 93-94 Resistente a conjuros
    // (19) (+5, would be +15: rolled again), 95 Resistente al ácido, mayor
    // (+66.000 po). 350 + 100.000 (+10) + 66.000 = 166.350 po.
    assert.deepEqual(rollArmor("major", 64, 64, 55, 50, 91, 93, 95), {
      name: "Coraza +5 fortificante intensa y resistente al ácido, mayor",
      po: 166350,
    });
  });
});
