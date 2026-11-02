import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  formatIndividualAnnouncement,
  generateTreasure,
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
    const treasure = generateTreasure(1, fixedDie(20, 4));

    assert.deepEqual(treasure.coins, { pc: 4000, pp: 0, po: 0, ppt: 0 });
  });

  it("should keep the d% and each die of the coins roll", () => {
    const treasure = generateTreasure(1, fixedDie(60, 3, 5));

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
    const treasure = generateTreasure(20, fixedDie(2));

    assert.deepEqual(
      treasure.coinRolls.map((r) => [r.dice, r.values]),
      [["d%", [2]]],
    );
    assert.deepEqual(treasure.items, []);
  });

  for (const [level, cells] of Object.entries(BOOK_COINS)) {
    for (const cell of cells) {
      const [range, result] = [cell.slice(0, cell.indexOf(" ")), cell.slice(cell.indexOf(" ") + 1)];
      const [low, high] = range.split("-").map(Number);
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
            assert.deepEqual(asked.slice(1), Array(Number(count)).fill(Number(sides)));
          } else {
            assert.equal(result, "—");
            assert.deepEqual(asked, [100]);
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
