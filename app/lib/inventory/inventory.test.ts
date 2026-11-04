import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyInventoryAction,
  EMPTY_INVENTORY,
  type Character,
  type InventoryChange,
} from "./inventory";
import type { TreasureItem } from "../treasure/treasure";

const DM = { role: "dm" } as const;

/** Ids "id-1", "id-2"… in the order they are asked for. */
function sequentialIds(): () => string {
  let next = 0;
  return () => `id-${++next}`;
}

const potion: TreasureItem = {
  category: "minor",
  inventoryCategory: "consumables",
  name: "Poción de curar heridas leves",
  quantity: 1,
  usage: "drink",
  valueCp: 5000,
  rolls: [],
  description: "Recuperas 2d4 + 2 puntos de golpe.",
};

const wand: TreasureItem = {
  category: "medium",
  inventoryCategory: "magicItems",
  name: "Varita: Luz",
  quantity: 1,
  charges: 37,
  usage: "none",
  valueCp: 37500,
  rolls: [],
};

const longsword: TreasureItem = {
  category: "mundane",
  inventoryCategory: "weapons",
  name: "Espada larga de gran calidad",
  quantity: 1,
  usage: "none",
  valueCp: 31500,
  rolls: [],
};

const aria = (inventory = EMPTY_INVENTORY): Character => ({
  id: 7,
  name: "Aria",
  inventory,
});

function expectChange(
  result: ReturnType<typeof applyInventoryAction>,
): InventoryChange {
  if ("error" in result) assert.fail(result.error.message);
  return result;
}

describe("applyInventoryAction: receive a delivery", () => {
  it("should fill an empty inventory with the coins and items delivered", () => {
    const change = expectChange(
      applyInventoryAction(
        [aria()],
        DM,
        {
          type: "receive",
          combatantId: 7,
          coins: { pc: 3, pp: 0, po: 120, ppt: 1 },
          items: [potion, wand],
        },
        sequentialIds(),
      ),
    );

    assert.deepEqual(change.characters, [
      {
        id: 7,
        name: "Aria",
        inventory: {
          coins: { pc: 3, pp: 0, po: 120, ppt: 1 },
          items: [
            {
              id: "id-1",
              inventoryCategory: "consumables",
              name: "Poción de curar heridas leves",
              quantity: 1,
              usage: "drink",
              valueCp: 5000,
              description: "Recuperas 2d4 + 2 puntos de golpe.",
            },
            {
              id: "id-2",
              inventoryCategory: "magicItems",
              name: "Varita: Luz",
              quantity: 1,
              charges: 37,
              usage: "none",
              valueCp: 37500,
            },
          ],
        },
      },
    ]);
  });

  it("should stack a consumable onto one with the same name, in the inventory or in the delivery", () => {
    const owned = {
      id: "potion",
      inventoryCategory: "consumables" as const,
      name: "Poción de curar heridas leves",
      quantity: 2,
      usage: "drink" as const,
      valueCp: 9000,
    };
    const acid: TreasureItem = {
      category: "mundane",
      inventoryCategory: "consumables",
      name: "Ácido",
      quantity: 3,
      usage: "use",
      valueCp: 3000,
      rolls: [],
    };

    const change = expectChange(
      applyInventoryAction(
        [aria({ coins: EMPTY_INVENTORY.coins, items: [owned] })],
        DM,
        {
          type: "receive",
          combatantId: 7,
          coins: EMPTY_INVENTORY.coins,
          items: [potion, acid, { ...acid, quantity: 2, valueCp: 2100 }],
        },
        sequentialIds(),
      ),
    );

    assert.deepEqual(change.characters[0].inventory.items, [
      { ...owned, quantity: 3, valueCp: 14000 },
      {
        id: "id-1",
        inventoryCategory: "consumables",
        name: "Ácido",
        quantity: 5,
        usage: "use",
        valueCp: 5100,
      },
    ]);
  });

  it("should add the coins to those already in the inventory", () => {
    const change = expectChange(
      applyInventoryAction(
        [aria({ coins: { pc: 5, pp: 2, po: 10, ppt: 0 }, items: [] })],
        DM,
        {
          type: "receive",
          combatantId: 7,
          coins: { pc: 1, pp: 0, po: 40, ppt: 2 },
          items: [],
        },
        sequentialIds(),
      ),
    );

    assert.deepEqual(change.characters[0].inventory.coins, {
      pc: 6,
      pp: 2,
      po: 50,
      ppt: 2,
    });
  });

  it("should put every non-consumable in its own row, even with the same name", () => {
    const change = expectChange(
      applyInventoryAction(
        [aria()],
        DM,
        {
          type: "receive",
          combatantId: 7,
          coins: EMPTY_INVENTORY.coins,
          items: [longsword, longsword, wand, wand],
        },
        sequentialIds(),
      ),
    );

    assert.deepEqual(
      change.characters[0].inventory.items.map((i) => [i.id, i.name]),
      [
        ["id-1", "Espada larga de gran calidad"],
        ["id-2", "Espada larga de gran calidad"],
        ["id-3", "Varita: Luz"],
        ["id-4", "Varita: Luz"],
      ],
    );
  });

  it("should leave the other characters as they were", () => {
    const borin: Character = { id: 9, name: "Borin", inventory: EMPTY_INVENTORY };

    const change = expectChange(
      applyInventoryAction(
        [aria(), borin],
        DM,
        { type: "receive", combatantId: 7, coins: EMPTY_INVENTORY.coins, items: [potion] },
        sequentialIds(),
      ),
    );

    assert.deepEqual(change.characters[1], borin);
  });

  it("should produce no aviso", () => {
    const change = expectChange(
      applyInventoryAction(
        [aria()],
        DM,
        { type: "receive", combatantId: 7, coins: { pc: 0, pp: 0, po: 9, ppt: 0 }, items: [potion] },
        sequentialIds(),
      ),
    );

    assert.deepEqual(change.notices, []);
  });

  it("should refuse a delivery made by a player", () => {
    const result = applyInventoryAction(
      [aria()],
      { role: "player", combatantId: 7 },
      { type: "receive", combatantId: 7, coins: EMPTY_INVENTORY.coins, items: [potion] },
      sequentialIds(),
    );

    assert.ok("error" in result);
    assert.equal(result.error.code, "FORBIDDEN");
  });

  it("should refuse a character that is not among those passed in", () => {
    const result = applyInventoryAction(
      [aria()],
      DM,
      { type: "receive", combatantId: 99, coins: EMPTY_INVENTORY.coins, items: [potion] },
      sequentialIds(),
    );

    assert.ok("error" in result);
    assert.equal(result.error.code, "CHARACTER_NOT_FOUND");
  });
});
