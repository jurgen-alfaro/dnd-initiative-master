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

/** d% on table 7-1 that gives "Armas" in each category. */
const WEAPON_FAMILY: Record<MagicCategory, number> = {
  minor: 5,
  medium: 15,
  major: 15,
};

/** Rolls a magic weapon of `category`; `rolls` start at table 7-9. */
function rollWeapon(category: MagicCategory, ...rolls: number[]) {
  const die = fixedDie(WEAPON_FAMILY[category], ...rolls);
  const item = rollMagicItem(category, die);
  assert.equal(die.rest(), 0, "every planned roll must be used");
  return { name: item.name, po: item.valueCp / 100 };
}

describe("magic weapons (tables 7-9 to 7-16)", () => {
  it("should price a melee weapon with an ability as its type plus the total bonus", () => {
    // 7-9 medium 69-100 ability and roll again → 11-20 +2 → 7-10 01-70
    // → 7-11 28-40 Espada larga (+315) → 7-14 medium 13-19 Flamígera (+1).
    // Priced as +3: 315 + 18.000 = 18.315 po.
    assert.deepEqual(rollWeapon("medium", 70, 15, 1, 30, 15), {
      name: "Espada larga +2 flamígera",
      po: 18315,
    });
  });

  it("should price a weapon without abilities as its type plus its bonus", () => {
    // 7-9 minor 01-70 +1 → 7-10 01-70 → 7-11 09-12 Daga (+302): 2.302 po.
    assert.deepEqual(rollWeapon("minor", 1, 1, 10), { name: "Daga +1", po: 2302 });
  });

  it("should roll a ranged weapon's abilities on table 7-15", () => {
    // 7-9 minor 91-100 → 01-70 +1 → 7-10 81-100 → 7-13 66-75 Arco largo
    // (+375) → 7-15 minor 84-93 Buscadora (+1): 375 + 8.000 = 8.375 po.
    assert.deepEqual(rollWeapon("minor", 91, 1, 81, 70, 84), {
      name: "Arco largo +1 buscador",
      po: 8375,
    });
    // The ranged weapons of table 7-12 too: 7-10 71-80 → 7-12 06-09 Ballesta
    // de mano (+400) → 7-15 minor 01-12 Azote: 400 + 8.000 = 8.400 po.
    assert.deepEqual(rollWeapon("minor", 91, 1, 75, 7, 1), {
      name: "Ballesta de mano +1 azote",
      po: 8400,
    });
  });

  it("should price fifty pieces of ammunition with the bonus of table 7-9", () => {
    // 7-9 minor 71-85 +2 → 7-10 81-100 → 7-13 01-10 Munición → 01-50
    // Flechas (50) (+350): 350 + 8.000 = 8.350 po.
    assert.deepEqual(rollWeapon("minor", 80, 90, 5, 30), {
      name: "Flechas (50) +2",
      po: 8350,
    });
    // 7-9 medium 69-100 → 01-10 +1 → Munición → 81-100 Balas de honda (50)
    // (+350) → 7-15 medium 17-28 Flamígera: 350 + 8.000 = 8.350 po.
    assert.deepEqual(rollWeapon("medium", 70, 5, 90, 5, 90, 20), {
      name: "Balas de honda (50) +1 flamígera",
      po: 8350,
    });
  });

  describe("specific weapons (table 7-16)", () => {
    it("should give a specific weapon at its market price", () => {
      // 7-9 minor 86-90 → 7-16 minor 46-65.
      assert.deepEqual(rollWeapon("minor", 88, 46), {
        name: "Espada larga de hierro frío de gran calidad",
        po: 330,
      });
      // 7-9 medium 63-68 → 7-16 medium 99-100.
      assert.deepEqual(rollWeapon("medium", 63, 99), {
        name: "Arco juramentado",
        po: 25600,
      });
      // 7-9 major 50-63 → 7-16 major 100.
      assert.deepEqual(rollWeapon("major", 50, 100), {
        name: "Hoja de la suerte (3 deseos)",
        po: 142960,
      });
    });

    it("should roll table 7-9 again when an ability is followed by a specific weapon", () => {
      // 7-9 minor 91-100, then 86-90 (specific: can't take an ability), then
      // 01-70 +1 → Espada larga (+315) → 7-14 minor 18-27 Flamígera.
      // 315 + 8.000 = 8.315 po.
      assert.deepEqual(rollWeapon("minor", 95, 88, 1, 1, 30, 18), {
        name: "Espada larga +1 flamígera",
        po: 8315,
      });
    });
  });

  describe("grammatical gender", () => {
    it("should make the abilities agree with a masculine weapon", () => {
      // 7-10 71-80 → 7-12 61-64 Mangual ligero (+308) → 7-14 minor 18-27
      // Flamígera: 308 + 8.000 = 8.308 po.
      assert.deepEqual(rollWeapon("minor", 91, 1, 75, 62, 20), {
        name: "Mangual ligero +1 flamígero",
        po: 8308,
      });
    });

    it("should leave an invariable ability as the book prints it", () => {
      // 7-11 41-50 Espadón (+350) → 7-14 minor 76-82 Hendiente:
      // 350 + 8.000 = 8.350 po.
      assert.deepEqual(rollWeapon("minor", 91, 1, 1, 45, 80), {
        name: "Espadón +1 hendiente",
        po: 8350,
      });
    });
  });

  describe("abilities that don't fit the weapon", () => {
    it("should roll again a keen ability on a weapon that isn't slashing", () => {
      // 7-11 84-87 Maza ligera (+305) → 7-14 minor 57-67 Afilada (only for
      // slashing weapons: rolled again) → 01-10 Azote. 305 + 8.000 = 8.305 po.
      assert.deepEqual(rollWeapon("minor", 91, 1, 1, 85, 60, 1), {
        name: "Maza ligera +1 azote",
        po: 8305,
      });
    });

    it("should let a weapon that is piercing or slashing be keen", () => {
      // 7-11 09-12 Daga (piercing or slashing) → 7-14 minor 57-67 Afilada.
      assert.deepEqual(rollWeapon("minor", 91, 1, 1, 10, 60), {
        name: "Daga +1 afilada",
        po: 8302,
      });
    });

    it("should only let a bludgeoning weapon be disruptive", () => {
      // 7-11 28-40 Espada larga → 7-14 medium 76-78 Disruptora (rolled again)
      // → 13-19 Flamígera.
      assert.deepEqual(rollWeapon("medium", 70, 15, 1, 30, 77, 15), {
        name: "Espada larga +2 flamígera",
        po: 18315,
      });
      // 7-11 88-92 Maza pesada (+312) → 7-14 medium 76-78 Disruptora (+2).
      // Priced as +3: 312 + 18.000 = 18.312 po.
      assert.deepEqual(rollWeapon("medium", 70, 5, 1, 90, 77), {
        name: "Maza pesada +1 disruptora",
        po: 18312,
      });
    });
  });

  describe("roll again twice (tables 7-14 and 7-15)", () => {
    it("should roll again an ability the weapon already has", () => {
      // 7-14 medium 96-100, then 13-19 Flamígera twice (rolled again) and
      // 01-06 Azote. Priced as +3: 315 + 18.000 = 18.315 po.
      assert.deepEqual(rollWeapon("medium", 70, 5, 1, 30, 96, 15, 15, 1), {
        name: "Espada larga +1 flamígera y azote",
        po: 18315,
      });
    });

    it("should roll again the burst of an energy the weapon already has", () => {
      // Flamígera, then Explosiva ígnea (79-81, rolled again), then Azote.
      assert.deepEqual(rollWeapon("medium", 70, 5, 1, 30, 96, 15, 80, 1), {
        name: "Espada larga +1 flamígera y azote",
        po: 18315,
      });
    });

    it("should roll again an alignment opposed to one the weapon has", () => {
      // Anárquica (70-72, +2), then Axiomática (73-75, rolled again), then
      // Flamígera (+1). Priced as +4: 315 + 32.000 = 32.315 po.
      assert.deepEqual(rollWeapon("medium", 70, 5, 1, 30, 96, 70, 74, 15), {
        name: "Espada larga +1 anárquica y flamígera",
        po: 32315,
      });
    });
  });

  describe("the +10 limit", () => {
    it("should roll again an ability that takes the total bonus over +10", () => {
      // 7-9 major 64, 64, then 39-49 +5 → Espada larga → 7-14 major 84-86
      // Radiante (+4, total +9), 89-90 Vorpalina (+5, would be +14: rolled
      // again), 01-03 Azote (+1). Priced as +10: 315 + 200.000 = 200.315 po.
      assert.deepEqual(rollWeapon("major", 64, 64, 45, 1, 30, 84, 89, 1), {
        name: "Espada larga +5 radiante y azote",
        po: 200315,
      });
    });

    it("should stop rolling abilities once the weapon is at +10", () => {
      // 7-9 major 64, 64, then +5 → Espada larga → Vorpalina (+5, total +10):
      // no ability fits any more, so the second one is never rolled.
      assert.deepEqual(rollWeapon("major", 64, 64, 45, 1, 30, 89), {
        name: "Espada larga +5 vorpalina",
        po: 200315,
      });
    });
  });

  describe("double weapons", () => {
    it("should give the second head the same bonus on 01-50, doubling its price", () => {
      // 7-11 01-03 Bastón (+600) → second head d% 01-50: +1/+1.
      // 600 + 2.000 + 2.000 = 4.600 po.
      assert.deepEqual(rollWeapon("minor", 1, 1, 1, 50), {
        name: "Bastón +1/+1",
        po: 4600,
      });
      // With an ability, the second head has it too: Bastón +2 flamígero is
      // priced as +3 for each head. 600 + 18.000 + 18.000 = 36.600 po.
      assert.deepEqual(rollWeapon("medium", 70, 15, 1, 1, 15, 1), {
        name: "Bastón +2 flamígero/+2 flamígero",
        po: 36600,
      });
    });

    it("should give the second head one less and no abilities on 51-100", () => {
      // Bastón +2 flamígero (+3: 18.000) / +1 (2.000): 20.600 po.
      assert.deepEqual(rollWeapon("medium", 70, 15, 1, 1, 15, 51), {
        name: "Bastón +2 flamígero/+1",
        po: 20600,
      });
      // 7-12 73-75 Martillo ganchudo gnomo (+620), 7-9 minor 71-85 +2:
      // 620 + 8.000 + 2.000 = 10.620 po.
      assert.deepEqual(rollWeapon("minor", 80, 75, 74, 100), {
        name: "Martillo ganchudo gnomo +2/+1",
        po: 10620,
      });
      // A +1 weapon leaves a second head +0: 600 + 2.000 = 2.600 po.
      assert.deepEqual(rollWeapon("minor", 1, 1, 1, 100), {
        name: "Bastón +1/+0",
        po: 2600,
      });
    });
  });
});
