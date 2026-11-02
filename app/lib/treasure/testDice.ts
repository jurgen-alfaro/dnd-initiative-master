import assert from "node:assert/strict";
import type { Die } from "./dice";

/**
 * Test helper: a die that replays `values` in order. It fails when the code
 * asks for a roll the test did not plan, for one the die cannot give, and
 * (through `rest`) when planned rolls were never asked for.
 */
export function fixedDie(...values: number[]): Die & { rest: () => number } {
  let next = 0;
  const die: Die = (sides) => {
    const value = values[next++];
    assert.ok(value !== undefined, `unexpected roll of d${sides}`);
    assert.ok(value >= 1 && value <= sides, `${value} is not a d${sides} roll`);
    return value;
  };
  return Object.assign(die, { rest: () => values.length - next });
}
