import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatPartyAnnouncement, splitCoins } from "./party";
import { COPPER_PER_COIN, DENOMINATIONS } from "./coins";
import type { Coins, Treasure } from "./treasure";
import type { Die } from "./dice";

const noDie: Die = () => {
  throw new Error("the die must not be rolled");
};

const cp = (coins: Coins) =>
  DENOMINATIONS.reduce((sum, d) => sum + coins[d] * COPPER_PER_COIN[d], 0);

describe("splitCoins", () => {
  it("should divide evenly without rolling when there is no remainder", () => {
    const shares = splitCoins({ pc: 0, pp: 0, po: 80, ppt: 4 }, 4, noDie);

    assert.deepEqual(shares, Array(4).fill({ pc: 0, pp: 0, po: 20, ppt: 1 }));
  });

  it("should turn the remainder of each coin into the next lower one", () => {
    // 7 ppt / 3 = 2 each, 1 left = 10 po; 10 + 5 po = 15 / 3 = 5 each.
    const shares = splitCoins({ pc: 0, pp: 0, po: 5, ppt: 7 }, 3, noDie);

    assert.deepEqual(shares, Array(3).fill({ pc: 0, pp: 0, po: 5, ppt: 2 }));
  });

  it("should cascade a remainder down through every coin", () => {
    // 1 ppt / 2: 0 each, 10 po / 2: 5 each.
    const shares = splitCoins({ pc: 0, pp: 0, po: 0, ppt: 1 }, 2, noDie);

    assert.deepEqual(shares, Array(2).fill({ pc: 0, pp: 0, po: 5, ppt: 0 }));
  });

  it("should give the leftover copper whole to the recipient the die picks", () => {
    // 1 pp / 3 = 0 each, 10 pc / 3 = 3 each, 1 pc left → die(3) = 2 → recipient 1.
    const asked: number[] = [];
    const die: Die = (sides) => {
      asked.push(sides);
      return 2;
    };

    const shares = splitCoins({ pc: 0, pp: 1, po: 0, ppt: 0 }, 3, die);

    assert.deepEqual(asked, [3]);
    assert.deepEqual(
      shares.map((s) => s.pc),
      [3, 4, 3],
    );
  });

  it("should give everything to a single recipient", () => {
    const coins = { pc: 7, pp: 3, po: 2, ppt: 1 };

    assert.deepEqual(splitCoins(coins, 1, noDie), [coins]);
  });

  it("should never gain or lose value, whatever the die says", () => {
    const coins = { pc: 12_345, pp: 678, po: 91, ppt: 13 };
    for (let recipients = 1; recipients <= 9; recipients++) {
      for (let pick = 1; pick <= recipients; pick++) {
        const shares = splitCoins(coins, recipients, () => pick);

        assert.equal(shares.length, recipients);
        assert.equal(
          shares.reduce((sum, s) => sum + cp(s), 0),
          cp(coins),
          `${recipients} recipients, die ${pick}`,
        );
      }
    }
  });

  it("should reject a split with nobody to receive", () => {
    assert.throws(
      () => splitCoins({ pc: 1, pp: 0, po: 0, ppt: 0 }, 0, noDie),
      RangeError,
    );
  });
});

describe("formatPartyAnnouncement", () => {
  const empty: Treasure = {
    level: 1,
    coins: { pc: 0, pp: 0, po: 0, ppt: 0 },
    coinRolls: [],
    items: [],
  };
  const gem = (name: string, valueCp: number) => ({
    category: "gem" as const,
    name,
    valueCp,
    rolls: [],
  });
  const noCoins = { pc: 0, pp: 0, po: 0, ppt: 0 };

  it("should list what each PJ received and the total in po", () => {
    const treasure: Treasure = {
      ...empty,
      coins: { pc: 0, pp: 0, po: 100, ppt: 0 },
      items: [gem("Ágata", 1000), gem("Rubí", 125000)],
    };

    const parts = formatPartyAnnouncement(treasure, [
      { name: "Aria", coins: { ...noCoins, po: 50 }, itemIndexes: [1] },
      { name: "Borin", coins: { ...noCoins, po: 50 }, itemIndexes: [0] },
    ]);

    assert.deepEqual(parts, [
      [
        "Party treasure",
        "Aria",
        "- 50 po",
        "- Rubí (1,250 po)",
        "Borin",
        "- 50 po",
        "- Ágata (10 po)",
        "Total: 1,360 po",
      ].join("\n"),
    ]);
  });

  it("should say so when a PJ receives nothing", () => {
    const parts = formatPartyAnnouncement(empty, [
      { name: "Aria", coins: noCoins, itemIndexes: [] },
    ]);

    assert.deepEqual(parts, [
      "Party treasure\nAria\n- Nothing\nTotal: 0 po",
    ]);
  });

  it("should split an announcement over 5,000 characters into numbered parts", () => {
    const items = Array.from({ length: 300 }, (_, i) =>
      gem(`Gema de prueba ${i + 1}`, 1250),
    );
    const indexes = items.map((_, i) => i);

    const parts = formatPartyAnnouncement({ ...empty, items }, [
      { name: "Aria", coins: noCoins, itemIndexes: indexes.slice(0, 150) },
      { name: "Borin", coins: noCoins, itemIndexes: indexes.slice(150) },
    ]);

    assert.ok(parts.length > 1);
    parts.forEach((part, i) => {
      assert.ok(part.length <= 5000, `part ${i + 1} has ${part.length} chars`);
      assert.ok(part.startsWith(`Party treasure (${i + 1}/${parts.length})\n`));
    });
    const body = parts.flatMap((p) => p.split("\n").slice(1));
    assert.deepEqual(body, [
      "Aria",
      ...items.slice(0, 150).map((item) => `- ${item.name} (12.5 po)`),
      "Borin",
      ...items.slice(150).map((item) => `- ${item.name} (12.5 po)`),
      "Total: 3,750 po",
    ]);
  });
});
