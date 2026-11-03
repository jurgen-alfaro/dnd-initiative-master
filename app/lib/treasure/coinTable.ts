import type { DiceNotation } from "./dice";
import type { Denomination } from "./coins";

/** One d% range of the coins column. `dice` is null for a "—" (no coins). */
export type CoinRow = {
  upTo: number;
  dice: DiceNotation | null;
  times: number;
  coin: Denomination;
};

const none = (upTo: number): CoinRow => ({
  upTo,
  dice: null,
  times: 0,
  coin: "pc",
});

const coins = (
  upTo: number,
  dice: DiceNotation,
  times: number,
  coin: Denomination,
): CoinRow => ({ upTo, dice, times, coin });

/**
 * Coins column of DMG 3.5 table 3-5 ("Tesoro"), indexed by NE − 1.
 *
 * NOTE: NE 11, 15-75 uses the English SRD value (4d8×100 po). The Spanish
 * DMG prints 4d8×1.000 po, a misprint confirmed by the author.
 */
export const COIN_TABLE: readonly (readonly CoinRow[])[] = [
  // NE 1
  [
    none(14),
    coins(29, "1d6", 1000, "pc"),
    coins(52, "1d8", 100, "pp"),
    coins(95, "2d8", 10, "po"),
    coins(100, "1d4", 10, "ppt"),
  ],
  // NE 2
  [
    none(13),
    coins(23, "1d10", 1000, "pc"),
    coins(43, "2d10", 100, "pp"),
    coins(95, "4d10", 10, "po"),
    coins(100, "2d8", 10, "ppt"),
  ],
  // NE 3
  [
    none(11),
    coins(21, "2d10", 1000, "pc"),
    coins(41, "4d8", 100, "pp"),
    coins(95, "1d4", 100, "po"),
    coins(100, "1d10", 10, "ppt"),
  ],
  // NE 4
  [
    none(11),
    coins(21, "3d10", 1000, "pc"),
    coins(41, "4d12", 1000, "pp"),
    coins(95, "1d6", 100, "po"),
    coins(100, "1d8", 10, "ppt"),
  ],
  // NE 5
  [
    none(10),
    coins(19, "1d4", 10000, "pc"),
    coins(38, "1d6", 1000, "pp"),
    coins(95, "1d8", 100, "po"),
    coins(100, "1d10", 10, "ppt"),
  ],
  // NE 6
  [
    none(10),
    coins(18, "1d6", 10000, "pc"),
    coins(37, "1d8", 1000, "pp"),
    coins(95, "1d10", 100, "po"),
    coins(100, "1d12", 10, "ppt"),
  ],
  // NE 7
  [
    none(11),
    coins(18, "1d10", 10000, "pc"),
    coins(35, "1d12", 1000, "pp"),
    coins(93, "2d6", 100, "po"),
    coins(100, "3d4", 10, "ppt"),
  ],
  // NE 8
  [
    none(10),
    coins(15, "1d12", 10000, "pc"),
    coins(29, "2d6", 1000, "pp"),
    coins(87, "2d8", 100, "po"),
    coins(100, "3d6", 10, "ppt"),
  ],
  // NE 9
  [
    none(10),
    coins(15, "2d6", 10000, "pc"),
    coins(29, "2d8", 1000, "pp"),
    coins(85, "5d4", 100, "po"),
    coins(100, "2d12", 10, "ppt"),
  ],
  // NE 10
  [
    none(10),
    coins(24, "2d10", 1000, "pp"),
    coins(79, "6d4", 100, "po"),
    coins(100, "5d6", 10, "ppt"),
  ],
  // NE 11
  [
    none(8),
    coins(14, "3d10", 1000, "pp"),
    coins(75, "4d8", 100, "po"),
    coins(100, "4d10", 10, "ppt"),
  ],
  // NE 12
  [
    none(8),
    coins(14, "3d12", 1000, "pp"),
    coins(75, "1d4", 1000, "po"),
    coins(100, "1d4", 100, "ppt"),
  ],
  // NE 13
  [none(8), coins(75, "1d4", 1000, "po"), coins(100, "1d10", 100, "ppt")],
  // NE 14
  [none(8), coins(75, "1d6", 1000, "po"), coins(100, "1d12", 100, "ppt")],
  // NE 15
  [none(3), coins(74, "1d8", 1000, "po"), coins(100, "3d4", 100, "ppt")],
  // NE 16
  [none(3), coins(74, "1d12", 1000, "po"), coins(100, "3d4", 100, "ppt")],
  // NE 17
  [none(3), coins(68, "3d4", 1000, "po"), coins(100, "2d10", 100, "ppt")],
  // NE 18
  [none(2), coins(65, "3d6", 1000, "po"), coins(100, "5d4", 100, "ppt")],
  // NE 19
  [none(2), coins(65, "3d8", 1000, "po"), coins(100, "3d10", 100, "ppt")],
  // NE 20
  [none(2), coins(65, "4d8", 1000, "po"), coins(100, "4d10", 100, "ppt")],
];
