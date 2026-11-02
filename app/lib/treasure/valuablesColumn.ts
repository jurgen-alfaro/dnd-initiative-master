import type { DiceNotation } from "./dice";

/**
 * One d% range of the "Gemas y objetos de arte" column. `valuable` is null for
 * a "—"; `count` is null when the cell reads "1 gema" / "1 arte".
 */
export type ValuablesRow = {
  upTo: number;
  valuable: "gem" | "art" | null;
  count: DiceNotation | null;
};

const none = (upTo: number): ValuablesRow => ({
  upTo,
  valuable: null,
  count: null,
});

const gems = (upTo: number, count: DiceNotation | null): ValuablesRow => ({
  upTo,
  valuable: "gem",
  count,
});

const art = (upTo: number, count: DiceNotation | null): ValuablesRow => ({
  upTo,
  valuable: "art",
  count,
});

/** Gems and art column of DMG 3.5 table 3-5, indexed by NE − 1. */
export const VALUABLES_COLUMN: readonly (readonly ValuablesRow[])[] = [
  [none(90), gems(95, null), art(100, null)], // NE 1
  [none(81), gems(95, "1d3"), art(100, "1d3")], // NE 2
  [none(77), gems(95, "1d3"), art(100, "1d3")], // NE 3
  [none(70), gems(95, "1d4"), art(100, "1d3")], // NE 4
  [none(60), gems(95, "1d4"), art(100, "1d4")], // NE 5
  [none(56), gems(92, "1d4"), art(100, "1d4")], // NE 6
  [none(48), gems(88, "1d4"), art(100, "1d4")], // NE 7
  [none(45), gems(85, "1d6"), art(100, "1d4")], // NE 8
  [none(40), gems(80, "1d8"), art(100, "1d4")], // NE 9
  [none(35), gems(79, "1d8"), art(100, "1d6")], // NE 10
  [none(24), gems(74, "1d10"), art(100, "1d6")], // NE 11
  [none(17), gems(70, "1d10"), art(100, "1d8")], // NE 12
  [none(11), gems(66, "1d12"), art(100, "1d10")], // NE 13
  [none(11), gems(66, "2d8"), art(100, "2d6")], // NE 14
  [none(9), gems(65, "2d10"), art(100, "2d8")], // NE 15
  [none(7), gems(64, "4d6"), art(100, "2d10")], // NE 16
  [none(4), gems(63, "4d8"), art(100, "3d8")], // NE 17
  [none(4), gems(54, "3d12"), art(100, "3d10")], // NE 18
  [none(3), gems(50, "6d6"), art(100, "6d6")], // NE 19
  [none(2), gems(38, "4d10"), art(100, "7d6")], // NE 20
];
