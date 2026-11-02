import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatIndividualAnnouncement,
  generateTreasure,
  totalValueCp,
  type Treasure,
} from "./treasure";
import type { Die } from "./dice";

/**
 * A die that replays `values` in order and fails loudly when the code asks
 * for a roll the test did not plan, or one that cannot come out of that die.
 */
function fixedDie(...values: number[]): Die {
  let next = 0;
  return (sides) => {
    const value = values[next++];
    assert.ok(value !== undefined, `unexpected roll of d${sides}`);
    assert.ok(value >= 1 && value <= sides, `${value} is not a d${sides} roll`);
    return value;
  };
}

/**
 * Coins column of table 3-5 copied cell by cell as the DMG prints it, kept
 * apart from the production data so a typo in either one fails a test.
 */
const BOOK_COINS: Record<number, string[]> = {
  1: ["01-14 —", "15-29 1d6×1.000 pc", "30-52 1d8×100 pp", "53-95 2d8×10 po", "96-100 1d4×10 ppt"],
  2: ["01-13 —", "14-23 1d10×1.000 pc", "24-43 2d10×100 pp", "44-95 4d10×10 po", "96-100 2d8×10 ppt"],
  3: ["01-11 —", "12-21 2d10×1.000 pc", "22-41 4d8×100 pp", "42-95 1d4×100 po", "96-100 1d10×10 ppt"],
  4: ["01-11 —", "12-21 3d10×1.000 pc", "22-41 4d12×1.000 pp", "42-95 1d6×100 po", "96-100 1d8×10 ppt"],
  5: ["01-10 —", "11-19 1d4×10.000 pc", "20-38 1d6×1.000 pp", "39-95 1d8×100 po", "96-100 1d10×10 ppt"],
  6: ["01-10 —", "11-18 1d6×10.000 pc", "19-37 1d8×1.000 pp", "38-95 1d10×100 po", "96-100 1d12×10 ppt"],
  7: ["01-11 —", "12-18 1d10×10.000 pc", "19-35 1d12×1.000 pp", "36-93 2d6×100 po", "94-100 3d4×10 ppt"],
  8: ["01-10 —", "11-15 1d12×10.000 pc", "16-29 2d6×1.000 pp", "30-87 2d8×100 po", "88-100 3d6×10 ppt"],
  9: ["01-10 —", "11-15 2d6×10.000 pc", "16-29 2d8×1.000 pp", "30-85 5d4×100 po", "86-100 2d12×10 ppt"],
  10: ["01-10 —", "11-24 2d10×1.000 pp", "25-79 6d4×100 po", "80-100 5d6×10 ppt"],
  11: ["01-08 —", "09-14 3d10×1.000 pp", "15-75 4d8×100 po", "76-100 4d10×10 ppt"],
  12: ["01-08 —", "09-14 3d12×1.000 pp", "15-75 1d4×1.000 po", "76-100 1d4×100 ppt"],
  13: ["01-08 —", "09-75 1d4×1.000 po", "76-100 1d10×100 ppt"],
  14: ["01-08 —", "09-75 1d6×1.000 po", "76-100 1d12×100 ppt"],
  15: ["01-03 —", "04-74 1d8×1.000 po", "75-100 3d4×100 ppt"],
  16: ["01-03 —", "04-74 1d12×1.000 po", "75-100 3d4×100 ppt"],
  17: ["01-03 —", "04-68 3d4×1.000 po", "69-100 2d10×100 ppt"],
  18: ["01-02 —", "03-65 3d6×1.000 po", "66-100 5d4×100 ppt"],
  19: ["01-02 —", "03-65 3d8×1.000 po", "66-100 3d10×100 ppt"],
  20: ["01-02 —", "03-65 4d8×1.000 po", "66-100 4d10×100 ppt"],
};

/** A die that answers d% with `percentile` and every other die with its top face. */
function maxDie(percentile: number, asked: number[]): Die {
  return (sides) => {
    asked.push(sides);
    return sides === 100 && asked.length === 1 ? percentile : sides;
  };
}

describe("generateTreasure", () => {
  it("should give 1d6×1,000 pc at NE 1 with d% 20", () => {
    const treasure = generateTreasure(1, fixedDie(20, 4, 1));

    assert.deepEqual(treasure.coins, { pc: 4000, pp: 0, po: 0, ppt: 0 });
  });

  it("should keep the d% and each die of the coins roll", () => {
    const treasure = generateTreasure(1, fixedDie(60, 3, 5, 1));

    assert.deepEqual(treasure.coins, { pc: 0, pp: 0, po: 80, ppt: 0 });
    assert.deepEqual(
      treasure.coinRolls.map((r) => [r.dice, r.values]),
      [
        ["d%", [60]],
        ["2d8×10 po", [3, 5]],
      ],
    );
  });

  it("should keep only the d% when the coins column gives nothing", () => {
    const treasure = generateTreasure(20, fixedDie(2, 1));

    assert.deepEqual(
      treasure.coinRolls.map((r) => [r.dice, r.values]),
      [["d%", [2]]],
    );
    assert.deepEqual(treasure.items, []);
  });

  for (const [level, cells] of Object.entries(BOOK_COINS)) {
    for (const cell of cells) {
      const [range, result] = [cell.slice(0, cell.indexOf(" ")), cell.slice(cell.indexOf(" ") + 1)];
      const [low, high = low] = range.split("-").map(Number);
      const match = /^(\d+)d(\d+)×([\d.]+) (pc|pp|po|ppt)$/.exec(result);

      for (const percentile of new Set([low, high])) {
        it(`should give ${result} at NE ${level} with d% ${percentile}`, () => {
          const asked: number[] = [];
          const treasure = generateTreasure(
            Number(level),
            maxDie(percentile, asked),
          );

          const expected = { pc: 0, pp: 0, po: 0, ppt: 0 };
          if (match) {
            const [, count, sides, times, coin] = match;
            const amount =
              Number(count) * Number(sides) * Number(times.replace(".", ""));
            Object.assign(expected, { [coin]: amount });
            assert.deepEqual(
              asked.slice(1, 1 + Number(count)),
              Array(Number(count)).fill(Number(sides)),
            );
          } else {
            assert.equal(result, "—");
            assert.deepEqual(asked.slice(0, 1), [100]);
          }
          assert.deepEqual(treasure.coins, expected);
        });
      }
    }
  }
});

describe("formatIndividualAnnouncement", () => {
  const empty: Treasure = {
    level: 1,
    coins: { pc: 0, pp: 0, po: 0, ppt: 0 },
    coinRolls: [],
    items: [],
  };

  it("should list the coins from platinum down and the total in po", () => {
    const parts = formatIndividualAnnouncement(
      { ...empty, coins: { pc: 4005, pp: 0, po: 80, ppt: 3 } },
      "Aria",
    );

    assert.deepEqual(parts, [
      "Treasure for Aria\n- 3 ppt\n- 80 po\n- 4,005 pc\nTotal: 150.05 po",
    ]);
  });

  it("should say so when the treasure is empty", () => {
    assert.deepEqual(formatIndividualAnnouncement(empty, "Aria"), [
      "Treasure for Aria\n- Nothing\nTotal: 0 po",
    ]);
  });

  it("should split an announcement over 2,000 characters into numbered parts", () => {
    const items = Array.from({ length: 120 }, (_, i) => ({
      category: "gem" as const,
      name: `Gema de prueba ${i + 1}`,
      valueCp: 1250,
      rolls: [],
    }));

    const parts = formatIndividualAnnouncement({ ...empty, items }, "Aria");

    assert.ok(parts.length > 1);
    parts.forEach((part, i) => {
      assert.ok(part.length <= 2000, `part ${i + 1} has ${part.length} chars`);
      assert.ok(part.startsWith(`Treasure for Aria (${i + 1}/${parts.length})\n`));
    });
    const body = parts.flatMap((p) => p.split("\n").slice(1));
    assert.deepEqual(body, [
      ...items.map((item) => `- ${item.name} (12.5 po)`),
      "Total: 1,500 po",
    ]);
  });
});

/**
 * Gems and art column of table 3-5 as the DMG prints it ("—", "1 gema",
 * "1d3 arte", …), by NE. Kept apart from the production data.
 */
const BOOK_VALUABLES: Record<number, string[]> = {
  1: ["01-90 —", "91-95 1 gema", "96-100 1 arte"],
  2: ["01-81 —", "82-95 1d3 gemas", "96-100 1d3 arte"],
  3: ["01-77 —", "78-95 1d3 gemas", "96-100 1d3 arte"],
  4: ["01-70 —", "71-95 1d4 gemas", "96-100 1d3 arte"],
  5: ["01-60 —", "61-95 1d4 gemas", "96-100 1d4 arte"],
  6: ["01-56 —", "57-92 1d4 gemas", "93-100 1d4 arte"],
  7: ["01-48 —", "49-88 1d4 gemas", "89-100 1d4 arte"],
  8: ["01-45 —", "46-85 1d6 gemas", "86-100 1d4 arte"],
  9: ["01-40 —", "41-80 1d8 gemas", "81-100 1d4 arte"],
  10: ["01-35 —", "36-79 1d8 gemas", "80-100 1d6 arte"],
  11: ["01-24 —", "25-74 1d10 gemas", "75-100 1d6 arte"],
  12: ["01-17 —", "18-70 1d10 gemas", "71-100 1d8 arte"],
  13: ["01-11 —", "12-66 1d12 gemas", "67-100 1d10 arte"],
  14: ["01-11 —", "12-66 2d8 gemas", "67-100 2d6 arte"],
  15: ["01-09 —", "10-65 2d10 gemas", "66-100 2d8 arte"],
  16: ["01-07 —", "08-64 4d6 gemas", "65-100 2d10 arte"],
  17: ["01-04 —", "05-63 4d8 gemas", "64-100 3d8 arte"],
  18: ["01-04 —", "05-54 3d12 gemas", "55-100 3d10 arte"],
  19: ["01-03 —", "04-50 6d6 gemas", "51-100 6d6 arte"],
  20: ["01-02 —", "03-38 4d10 gemas", "39-100 7d6 arte"],
};

/** Table 3-6 (gems): d% range, value, examples exactly as printed. */
const BOOK_GEMS: [string, string, string][] = [
  ["01-25", "4d4 po", "Ágata listada, musgosa o aojada; azurita; cuarzo azul; hematites; lapislázuli; malaquita; obsidiana; rodocrosita; ojo de tigre; perla de agua dulce (con irregularidades)"],
  ["26-50", "2d4×10 po", "Heliotropo (piedra de sangre); cornalina; calcedonia; crisoprasa; iolita; jaspe; adularia (piedra de luna); ónice; peridoto; cristal de roca (cuarzo transparente); sarda; sardónice; cuarzo citrino, rosado estrella, ahumado, rosado; circón"],
  ["51-70", "4d4×10 po", "Ámbar; amatista; crisoberilo; coral; granate rojo o amarillo verdoso; jade; azabache; perla blanca, dorada, rosada o argéntea; espinela roja, verde intenso o rojo vinoso; turmalina"],
  ["71-90", "2d4×100 po", "Alejandrita; aguamarina; granate violáceo; perla negra; espinela azul intenso; topacio amarillo"],
  ["91-99", "4d4×100 po", "Esmeralda; ópalo de fuego, blanco o negro; zafiro azul; corindón amarillo intenso o violado; zafiro negro o azul estrella; rubí estrella"],
  ["100", "2d4×1.000 po", "Esmeralda diáfana y de color verde de gran brillo; diamante azulado, castaño, rosa, ambarino o hialino; jacinto"],
];

/** Table 3-7 (art objects), same layout as the gems. */
const BOOK_ART: [string, string, string][] = [
  ["01-10", "1d10×10 po", "Jarra de plata; estatua de marfil o hueso labrado; pequeño brazalete de oro finamente labrado"],
  ["11-25", "3d6×10 po", "Tela con hilo de oro; máscara de terciopelo negro con gran cantidad de cuarzos citrinos; cáliz de plata con gemas de lapislázuli"],
  ["26-40", "1d6×100 po", "Tapiz de grandes dimensiones hecho de lana finamente trabajada; taza de cobre con incrustaciones de jade"],
  ["41-50", "1d10×100 po", "Peine de plata con adularias; espada larga de acero con baño de plata y una joya de azabache en la empuñadura"],
  ["51-60", "2d6×100 po", "Arpa tallada en una madera exótica con incrustaciones de marfil y circones; ídolo de oro macizo (10 lb.)"],
  ["61-70", "3d6×100 po", "Peine en forma de dragón, con un ojo de granate rojo; tapón de botella de oro y topacio; daga ceremonial de electro con un rubí estrella en el pomo"],
  ["71-80", "4d6×100 po", "Parche para el ojo con ojo falso de zafiro y piedra de luna; colgante de ópalo de fuego con cadena de oro fino; cuadro antiguo (pintura) de gran calidad"],
  ["81-85", "5d6×100 po", "Manto bordado en seda y terciopelo y adornado con numerosas piedras de luna; colgante de zafiro en una cadena de oro"],
  ["86-90", "1d4×1.000 po", "Guante bordado y enjoyado; tobillera con joyas; caja de música de oro"],
  ["91-95", "1d6×1.000 po", "Ceño de oro con cuatro aguamarinas; collar de pequeñas perlas rosadas"],
  ["96-99", "2d4×1.000 po", "Corona de oro enjoyada; anillo de electro con joyas engastadas"],
  ["100", "2d6×1.000 po", "Anillo de oro y rubí; copa de oro decorada con esmeraldas"],
];

/** "4d4×10 po" → how many dice, how many faces, and the multiplier. */
function parseValue(value: string) {
  const match = /^(\d+)d(\d+)(?:×([\d.]+))? po$/.exec(value);
  assert.ok(match, `unreadable value ${value}`);
  const [, count, sides, times] = match;
  return {
    count: Number(count),
    sides: Number(sides),
    times: Number(times?.replace(".", "") ?? 1),
  };
}

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

/**
 * Gem examples name one gem per colour or variety: "perla blanca, dorada o
 * argéntea" → "Perla blanca", "Perla dorada", "Perla argéntea".
 */
const gemNames = (examples: string) =>
  examples.split("; ").flatMap((example) => {
    const [noun, ...rest] = example.split(" ");
    const varieties = rest.join(" ").split(/, | o /);
    return varieties.length > 1
      ? varieties.map((variety) => capitalize(`${noun} ${variety}`))
      : [capitalize(example)];
  });

describe("generateTreasure gems and art", () => {
  it("should give one gem at NE 1 with d% 91", () => {
    // coins: none; column: 91; gem: d% 1 (4d4 po), its 4 dice, first example
    const treasure = generateTreasure(1, fixedDie(1, 91, 1, 1, 2, 3, 4, 1));

    assert.equal(treasure.items.length, 1);
    const [gem] = treasure.items;
    assert.equal(gem.category, "gem");
    assert.equal(gem.name, "Ágata listada");
    assert.equal(gem.valueCp, 10 * 100);
    assert.deepEqual(
      gem.rolls.map((r) => [r.dice, r.values]),
      [
        ["d%", [91]],
        ["d%", [1]],
        ["4d4 po", [1, 2, 3, 4]],
        ["d12", [1]],
      ],
    );
  });

  it("should roll each gem apart when the column gives 1d3 of them", () => {
    // NE 2, d% 82: 1d3 → 2 gems. Gem 1: d% 1, 1+1+1+1, example 1.
    // Gem 2: d% 26, 2+2 ×10, example 2.
    const treasure = generateTreasure(
      2,
      fixedDie(1, 82, 2, 1, 1, 1, 1, 1, 1, 26, 2, 2, 2),
    );

    assert.deepEqual(
      treasure.items.map((i) => [i.category, i.name, i.valueCp]),
      [
        ["gem", "Ágata listada", 400],
        ["gem", "Cornalina", 4000],
      ],
    );
  });

  it("should give an art object at NE 1 with d% 96", () => {
    // art: d% 100 (2d6×1.000 po), 2+6, example 2
    const treasure = generateTreasure(1, fixedDie(1, 96, 100, 2, 6, 2));

    assert.deepEqual(
      treasure.items.map((i) => [i.category, i.name, i.valueCp]),
      [["art", "Copa de oro decorada con esmeraldas", 800_000]],
    );
  });

  it("should include the gems and art in the total and the announcement", () => {
    const treasure = generateTreasure(1, fixedDie(1, 91, 1, 1, 2, 3, 4, 1));

    assert.equal(totalValueCp(treasure), 1000);
    assert.deepEqual(formatIndividualAnnouncement(treasure, "Aria"), [
      "Treasure for Aria\n- Ágata listada (10 po)\nTotal: 10 po",
    ]);
  });

  for (const [level, cells] of Object.entries(BOOK_VALUABLES)) {
    for (const cell of cells) {
      const range = cell.slice(0, cell.indexOf(" "));
      const result = cell.slice(cell.indexOf(" ") + 1);
      const [low, high = low] = range.split("-").map(Number);
      const match = /^(?:(\d+)d(\d+)|1) (gemas?|arte)$/.exec(result);

      for (const percentile of new Set([low, high])) {
        it(`should give ${result} at NE ${level} with d% ${percentile}`, () => {
          const asked: number[] = [];
          // 1st roll: coins (none); 2nd: the column; the count dice at their
          // top face; every roll after that (the items) at its bottom face.
          const dice = match?.[1] ? Number(match[1]) : 0;
          const die: Die = (sides) => {
            asked.push(sides);
            if (asked.length === 1) return 1;
            if (asked.length === 2) return percentile;
            return asked.length <= 2 + dice ? sides : 1;
          };

          const treasure = generateTreasure(Number(level), die);

          if (!match) {
            assert.equal(result, "—");
            assert.deepEqual(treasure.items, []);
            return;
          }
          const [, count, sides] = match;
          const expected = count ? Number(count) * Number(sides) : 1;
          assert.equal(treasure.items.length, expected);
          const category = match[3] === "arte" ? "art" : "gem";
          assert.ok(treasure.items.every((i) => i.category === category));
        });
      }
    }
  }

  for (const [category, label, book, column, toNames] of [
    ["gem", "gem", BOOK_GEMS, 91, gemNames],
    ["art", "art object", BOOK_ART, 96, (e: string) => e.split("; ").map(capitalize)],
  ] as const) {
    for (const [range, value, examples] of book) {
      const [low, high = low] = range.split("-").map(Number);
      const { count, sides, times } = parseValue(value);
      const names = toNames(examples);

      for (const percentile of new Set([low, high])) {
        it(`should give a ${label} worth ${value} for d% ${percentile}`, () => {
          for (const [face, faces] of [[1, 1], [sides, sides]] as const) {
            names.forEach((name, i) => {
              const treasure = generateTreasure(
                1,
                fixedDie(1, column, percentile, ...Array(count).fill(face), i + 1),
              );

              assert.deepEqual(treasure.items.map((x) => [x.category, x.name, x.valueCp]), [
                [category, name, count * faces * times * 100],
              ]);
            });
          }
        });
      }
    }
  }
});
