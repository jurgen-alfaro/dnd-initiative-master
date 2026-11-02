import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Die } from "./dice";
import { rollMagicItem, type MagicCategory } from "./magicTable";
import { TreasureItemSchema } from "./treasure";

/** Replays `values` in order and fails on any roll the test did not plan. */
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

/** A d% of table 7-1 that gives a scroll in each category. */
const SCROLL: Record<MagicCategory, number> = { minor: 50, medium: 60, major: 50 };

describe("rollMagicItem, scrolls", () => {
  it("should roll type, count, level and spell of a minor arcane scroll", () => {
    const die = fixedDie(SCROLL.minor, 1, 1, 1, 1);

    const item = rollMagicItem("minor", die);

    assert.deepEqual(
      [item.name, item.valueCp],
      ["Rollo de pergamino arcano: Abrir/cerrar (NL 1)", 1250],
    );
    assert.equal(die.rest(), 0);
  });

  it("should list every spell with its caster level and add up prices with pp", () => {
    const die = fixedDie(SCROLL.minor, 71, 3, 1, 1, 6, 1, 51, 7);

    const item = rollMagicItem("minor", die);

    assert.deepEqual(
      [item.name, item.valueCp],
      [
        "Rollo de pergamino divino: Conocer la dirección (NL 1), Alarma (NL 1), Augurio (NL 3)",
        1250 + 10000 + 17500,
      ],
    );
    assert.equal(die.rest(), 0);
  });

  it("should keep every roll on the item, after the family roll", () => {
    const item = rollMagicItem("major", fixedDie(SCROLL.major, 70, 2, 96, 22, 86, 6));

    assert.deepEqual(
      item.rolls.map((r) => [r.label, r.dice, r.values]),
      [
        ["Table 7-1, major", "d%", [SCROLL.major]],
        ["Table 7-21", "d%", [70]],
        ["Table 7-22", "1d6", [2]],
        ["Table 7-23, major", "d%", [96]],
        ["Table 7-24, level 9", "d%", [22]],
        ["Table 7-23, major", "d%", [86]],
        ["Table 7-24, level 8", "d%", [6]],
      ],
    );
    assert.deepEqual(
      [item.name, item.valueCp],
      ["Rollo de pergamino arcano: Deseo (NL 17), Atrapar el alma (NL 15)", 4_182_500],
    );
  });

  it("should roll as many spells as the die of table 7-22 shows", () => {
    for (const [category, sides] of [["minor", 3], ["medium", 4], ["major", 6]] as const) {
      const spells = Array.from({ length: sides }, () => [100, 100]).flat();
      const item = rollMagicItem(category, fixedDie(SCROLL[category], 1, sides, ...spells));

      assert.equal(item.name.split("(NL").length - 1, sides, category);
    }
  });

  it("should fit the item schema with six of the longest spell names", () => {
    // Major arcane level 5, d% 74: Sanctasanctórum privado de Mordenkainen.
    const spells = Array.from({ length: 6 }, () => [6, 74]).flat();
    const item = rollMagicItem("major", fixedDie(SCROLL.major, 1, 6, ...spells));

    assert.equal(TreasureItemSchema.safeParse(item).success, true, item.name);
  });
});

/** How to reach each spell level through table 7-23: [category, d%]. */
const LEVEL_PATH: readonly [MagicCategory, number][] = [
  ["minor", 1],
  ["minor", 6],
  ["minor", 51],
  ["minor", 96],
  ["medium", 66],
  ["medium", 96],
  ["major", 51],
  ["major", 71],
  ["major", 86],
  ["major", 96],
];

/** Table 7-23 as printed: [category, d% range, spell level, caster level]. */
const BOOK_LEVELS: readonly [MagicCategory, string, number, number][] = [
  ["minor", "01-05", 0, 1],
  ["minor", "06-50", 1, 1],
  ["minor", "51-95", 2, 3],
  ["minor", "96-100", 3, 5],
  ["medium", "01-05", 2, 3],
  ["medium", "06-65", 3, 5],
  ["medium", "66-95", 4, 7],
  ["medium", "96-100", 5, 9],
  ["major", "01-05", 4, 7],
  ["major", "06-50", 5, 9],
  ["major", "51-70", 6, 11],
  ["major", "71-85", 7, 13],
  ["major", "86-95", 8, 15],
  // Printed 95-100, a misprint: 95 is already level 8.
  ["major", "96-100", 9, 17],
];

/**
 * First and last row of every level of tables 7-24 and 7-25, copied by hand
 * from the DMG captures (plus the rows around the book's misprints):
 * "type level d% name|price".
 */
const BOOK_SPELLS = [
  "arcano 0 1 Abrir/cerrar|12 po 5 pp",
  "arcano 0 100 Toque de fatiga|12 po 5 pp",
  "arcano 1 1 Agrandar persona|25 po",
  "arcano 1 7 Alineamiento indetectable|50 po",
  "arcano 1 100 Ventriloquia|25 po",
  "arcano 2 1 Apertura|150 po",
  "arcano 2 100 Visión en la oscuridad|150 po",
  "arcano 3 1 Acelerar|375 po",
  "arcano 3 100 Volar|375 po",
  "arcano 4 1 Agrandar persona en grupo|700 po",
  "arcano 4 25 Curar heridas críticas|1.000 po",
  "arcano 4 100 Zona de silencio|700 po",
  "arcano 5 1 Asolar|1.125 po",
  "arcano 5 65 Permanencia|10.125 po",
  "arcano 5 100 Vuelo de largo recorrido|1.125 po",
  "arcano 6 1 Analizar esencia mágica|1.650 po",
  "arcano 6 53 Geas/empeño|1.650 po",
  "arcano 6 54 Globo de invulnerabilidad|1.650 po",
  "arcano 6 100 Visión verdadera|1.900 po",
  "arcano 7 1 Bola de fuego de explosión retardada|2.275 po",
  "arcano 7 100 Vista arcana mayor|2.275 po",
  "arcano 8 1 Alarido mayor|3.000 po",
  "arcano 8 100 Simpatía|4.500 po",
  "arcano 9 1 Cambiar de forma|3.825 po",
  "arcano 9 44 Inmovilizar monstruo en grupo|3.825 po",
  "arcano 9 45 Lamento de la banshee|3.825 po",
  "arcano 9 80 Proyección astral|4.870 po",
  "arcano 9 100 Umbras|3.825 po",
  "divino 0 1 Conocer la dirección|12 po 5 pp",
  "divino 0 100 Virtud|12 po 5 pp",
  "divino 1 1 Alarma|100 po",
  "divino 1 100 Zancada prodigiosa|25 po",
  "divino 2 1 Ablandar tierra y piedra|150 po",
  "divino 2 100 Zona de verdad|150 po",
  "divino 3 1 Apagar|375 po",
  "divino 3 100 Visión en la oscuridad|375 po",
  "divino 4 1 Adivinación|725 po",
  "divino 4 100 Zancada arbórea|700 po",
  "divino 5 1 Arma disruptora|1.125 po",
  "divino 5 100 Visión verdadera|1.125 po",
  "divino 6 1 Aliado de los planos|2.400 po",
  "divino 6 100 Viajar mediante plantas|1.650 po",
  "divino 7 1 Animar plantas|2.275 po",
  "divino 7 51 Infligir heridas graves en grupo|2.275 po",
  "divino 7 52 Marabunta|2.275 po",
  "divino 7 92 Resurrección|12.275 po",
  "divino 7 100 Transmutar metal en madera|2.275 po",
  "divino 8 1 Aliado de los planos mayor|5.500 po",
  "divino 8 100 Torbellino|3.000 po",
  "divino 9 1 Antipatía|3.825 po",
  "divino 9 58 Milagro|28.825 po",
  "divino 9 100 Umbral|3.825 po",
];

/** "1.125 po" → 112500, "12 po 5 pp" → 1250, worked out digit by digit. */
const priceCp = (text: string): number => {
  const [po, , pp] = text.split(" ");
  return Number(po.split(".").join("")) * 100 + (pp ? Number(pp) * 10 : 0);
};

describe("rollMagicItem, scroll spell level (table 7-23)", () => {
  for (const [category, rangeText, level, casterLevel] of BOOK_LEVELS) {
    const [low, high] = rangeText.split("-").map(Number);
    for (const face of [low, high]) {
      it(`should give level ${level} (NL ${casterLevel}) on the ${category} d% ${face}`, () => {
        const item = rollMagicItem(category, fixedDie(SCROLL[category], 1, 1, face, 1));

        const first = BOOK_SPELLS.find((s) => s.startsWith(`arcano ${level} 1 `));
        assert.ok(first);
        const name = first.split(" ").slice(3).join(" ").split("|")[0];
        assert.equal(item.name, `Rollo de pergamino arcano: ${name} (NL ${casterLevel})`);
      });
    }
  }
});

describe("rollMagicItem, scroll spells (tables 7-24 and 7-25)", () => {
  for (const cell of BOOK_SPELLS) {
    const [typeWord, level, face, ...rest] = cell.split(" ");
    const [name, price] = rest.join(" ").split("|");
    it(`should give ${name} for a ${typeWord} level ${level} d% ${face}`, () => {
      const [category, levelFace] = LEVEL_PATH[Number(level)];
      const typeFace = typeWord === "arcano" ? 70 : 71;
      const die = fixedDie(SCROLL[category], typeFace, 1, levelFace, Number(face));

      const item = rollMagicItem(category, die);

      assert.match(item.name, new RegExp(`^Rollo de pergamino ${typeWord}: `));
      assert.equal(item.name.slice(item.name.indexOf(": ") + 2, item.name.lastIndexOf(" (NL")), name);
      assert.equal(item.valueCp, priceCp(price));
    });
  }
});
