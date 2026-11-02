import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { splitCoins } from "./party";
import { COPPER_PER_COIN, DENOMINATIONS, type Coins } from "./treasure";
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
