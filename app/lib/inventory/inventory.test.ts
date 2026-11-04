import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  applyInventoryAction,
  EMPTY_INVENTORY,
  isInventoryEmpty,
  itemUse,
  type Actor,
  type Character,
  type InventoryChange,
  type InventoryItem,
} from "./inventory";
import type { Coins, TreasureItem } from "../treasure/treasure";

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

describe("isInventoryEmpty", () => {
  it("should be empty with no coins and no items", () => {
    assert.equal(isInventoryEmpty(EMPTY_INVENTORY), true);
  });

  it("should not be empty with a single copper piece", () => {
    const coins = { ...EMPTY_INVENTORY.coins, pc: 1 };
    assert.equal(isInventoryEmpty({ coins, items: [] }), false);
  });

  it("should not be empty with an item and no coins", () => {
    const { characters } = expectChange(
      applyInventoryAction(
        [aria()],
        DM,
        {
          type: "receive",
          combatantId: 7,
          coins: EMPTY_INVENTORY.coins,
          items: [longsword],
        },
        sequentialIds(),
      ),
    );
    assert.equal(isInventoryEmpty(characters[0].inventory), false);
  });
});

describe("applyInventoryAction: use an item", () => {
  const potions: InventoryItem = {
    id: "potions",
    inventoryCategory: "consumables",
    name: "Poción de curar heridas leves",
    quantity: 3,
    usage: "drink",
    valueCp: 15000,
  };
  const scroll: InventoryItem = {
    id: "scroll",
    inventoryCategory: "consumables",
    name: "Rollo de pergamino arcano: Proyectil mágico",
    quantity: 1,
    usage: "use",
    valueCp: 2500,
  };
  const lightWand: InventoryItem = {
    id: "wand",
    inventoryCategory: "magicItems",
    name: "Varita: Luz",
    quantity: 1,
    charges: 37,
    usage: "none",
    valueCp: 37500,
  };
  const sword: InventoryItem = {
    id: "sword",
    inventoryCategory: "weapons",
    name: "Espada larga de gran calidad",
    quantity: 1,
    usage: "none",
    valueCp: 31500,
  };
  const ARIA_PLAYER: Actor = { role: "player", combatantId: 7 };

  const withItems = (...items: InventoryItem[]) =>
    aria({ coins: EMPTY_INVENTORY.coins, items });

  const use = (
    character: Character,
    itemId: string,
    actor: Actor = ARIA_PLAYER,
    others: Character[] = [],
  ) =>
    applyInventoryAction(
      [character, ...others],
      actor,
      { type: "use", combatantId: 7, itemId },
      sequentialIds(),
    );

  it("should spend one unit of a consumable, and its share of the value", () => {
    const change = expectChange(use(withItems(potions, sword), "potions"));

    assert.deepEqual(change.characters[0].inventory.items, [
      { ...potions, quantity: 2, valueCp: 10000 },
      sword,
    ]);
  });

  it("should remove a consumable when its last unit is used", () => {
    const change = expectChange(use(withItems(scroll, sword), "scroll"));

    assert.deepEqual(change.characters[0].inventory.items, [sword]);
  });

  it("should spend one charge and keep the item", () => {
    const change = expectChange(use(withItems(lightWand), "wand"));

    assert.deepEqual(change.characters[0].inventory.items, [
      { ...lightWand, charges: 36 },
    ]);
  });

  it("should keep an item in the inventory when its last charge is spent", () => {
    const change = expectChange(
      use(withItems({ ...lightWand, charges: 1 }), "wand"),
    );

    assert.deepEqual(change.characters[0].inventory.items, [
      { ...lightWand, charges: 0 },
    ]);
  });

  it("should refuse to use an item with 0 charges", () => {
    const result = use(withItems({ ...lightWand, charges: 0 }), "wand");

    assert.ok("error" in result);
    assert.equal(result.error.code, "NO_CHARGES");
  });

  it("should refuse to use an item that has no use", () => {
    const result = use(withItems(sword), "sword");

    assert.ok("error" in result);
    assert.equal(result.error.code, "NOT_USABLE");
  });

  it("should refuse an item that is not in the inventory", () => {
    const result = use(withItems(potions), "missing");

    assert.ok("error" in result);
    assert.equal(result.error.code, "ITEM_NOT_FOUND");
  });

  it("should refuse a player using the items of another PJ", () => {
    const borin: Character = { id: 9, name: "Borin", inventory: EMPTY_INVENTORY };

    const result = use(
      withItems(potions),
      "potions",
      { role: "player", combatantId: 9 },
      [borin],
    );

    assert.ok("error" in result);
    assert.equal(result.error.code, "FORBIDDEN");
  });

  it("should leave one aviso when the player drinks a potion", () => {
    const change = expectChange(use(withItems(potions), "potions"));

    assert.deepEqual(change.notices, [
      { combatantId: 7, text: "Aria bebió Poción de curar heridas leves" },
    ]);
  });

  it("should leave one aviso when the player uses a scroll", () => {
    const change = expectChange(use(withItems(scroll), "scroll"));

    assert.deepEqual(change.notices, [
      {
        combatantId: 7,
        text: "Aria usó Rollo de pergamino arcano: Proyectil mágico",
      },
    ]);
  });

  it("should leave one aviso when the player spends a charge", () => {
    const change = expectChange(use(withItems(lightWand), "wand"));

    assert.deepEqual(change.notices, [
      { combatantId: 7, text: "Aria usó una carga de Varita: Luz" },
    ]);
  });

  it("should leave no aviso when the DM uses an item", () => {
    const change = expectChange(use(withItems(potions), "potions", DM));

    assert.deepEqual(change.characters[0].inventory.items, [
      { ...potions, quantity: 2, valueCp: 10000 },
    ]);
    assert.deepEqual(change.notices, []);
  });
});

describe("itemUse", () => {
  const item: InventoryItem = {
    id: "x",
    inventoryCategory: "consumables",
    name: "X",
    quantity: 1,
    usage: "none",
    valueCp: 100,
  };

  it("should be drink for a potion", () => {
    assert.equal(itemUse({ ...item, usage: "drink" }), "drink");
  });

  it("should be use for a scroll or an alchemical", () => {
    assert.equal(itemUse({ ...item, usage: "use", quantity: 3 }), "use");
  });

  it("should be use for an item with charges left, such as a wand or a staff", () => {
    assert.equal(itemUse({ ...item, charges: 4 }), "use");
  });

  it("should be null for an item with 0 charges", () => {
    assert.equal(itemUse({ ...item, charges: 0 }), null);
  });

  it("should be null for any other item", () => {
    assert.equal(itemUse(item), null);
  });
});

describe("applyInventoryAction: give to another PJ", () => {
  const potions: InventoryItem = {
    id: "potions",
    inventoryCategory: "consumables",
    name: "Poción de curar heridas leves",
    quantity: 5,
    usage: "drink",
    valueCp: 25000,
  };
  const sword: InventoryItem = {
    id: "sword",
    inventoryCategory: "weapons",
    name: "Espada larga de gran calidad",
    quantity: 1,
    usage: "none",
    valueCp: 31500,
  };
  const ARIA_PLAYER: Actor = { role: "player", combatantId: 7 };

  const holding = (items: InventoryItem[], po = 0) => ({
    coins: { ...EMPTY_INVENTORY.coins, po },
    items,
  });
  const borin = (inventory = EMPTY_INVENTORY): Character => ({
    id: 9,
    name: "Borin",
    inventory,
  });

  const giveItem = (
    characters: Character[],
    itemId: string,
    quantity: number,
    { actor = ARIA_PLAYER, from = 7, to = 9 }: { actor?: Actor; from?: number; to?: number } = {},
  ) =>
    applyInventoryAction(
      characters,
      actor,
      { type: "giveItem", combatantId: from, toCombatantId: to, itemId, quantity },
      sequentialIds(),
    );

  it("should move a whole item from one inventory to the other", () => {
    const change = expectChange(
      giveItem([aria(holding([sword, potions])), borin()], "sword", 1),
    );

    assert.deepEqual(change.characters[0].inventory.items, [potions]);
    assert.deepEqual(change.characters[1].inventory.items, [
      { ...sword, id: "id-1" },
    ]);
  });

  it("should give part of a stack with its share of the value", () => {
    const change = expectChange(
      giveItem([aria(holding([potions])), borin()], "potions", 2),
    );

    assert.deepEqual(change.characters[0].inventory.items, [
      { ...potions, quantity: 3, valueCp: 15000 },
    ]);
    assert.deepEqual(change.characters[1].inventory.items, [
      { ...potions, id: "id-1", quantity: 2, valueCp: 10000 },
    ]);
  });

  it("should neither lose nor create copper when the value does not split evenly", () => {
    const odd = { ...potions, quantity: 3, valueCp: 100 };
    const change = expectChange(
      giveItem([aria(holding([odd])), borin()], "potions", 1),
    );

    const [kept] = change.characters[0].inventory.items;
    const [given] = change.characters[1].inventory.items;
    assert.equal(kept.quantity, 2);
    assert.equal(given.quantity, 1);
    assert.equal(kept.valueCp + given.valueCp, 100);
  });

  it("should stack a consumable onto the same one the recipient has", () => {
    const theirs = { ...potions, id: "theirs", quantity: 1, valueCp: 5000 };
    const change = expectChange(
      giveItem([aria(holding([potions])), borin(holding([sword, theirs]))], "potions", 2),
    );

    assert.deepEqual(change.characters[1].inventory.items, [
      sword,
      { ...theirs, quantity: 3, valueCp: 15000 },
    ]);
  });

  const errorCode = (result: ReturnType<typeof applyInventoryAction>) =>
    "error" in result ? result.error.code : "no error";

  it("should refuse to give more units than there are", () => {
    const result = giveItem([aria(holding([potions])), borin()], "potions", 6);

    assert.equal(errorCode(result), "NOT_ENOUGH");
  });

  it("should refuse to give no units, or part of one", () => {
    const characters = [aria(holding([potions])), borin()];

    assert.equal(errorCode(giveItem(characters, "potions", 0)), "INVALID_QUANTITY");
    assert.equal(errorCode(giveItem(characters, "potions", 1.5)), "INVALID_QUANTITY");
  });

  it("should refuse an item that is not in the inventory", () => {
    const result = giveItem([aria(holding([potions])), borin()], "missing", 1);

    assert.equal(errorCode(result), "ITEM_NOT_FOUND");
  });

  it("should refuse to give to oneself", () => {
    const result = giveItem([aria(holding([sword])), borin()], "sword", 1, { to: 7 });

    assert.equal(errorCode(result), "SAME_CHARACTER");
  });

  it("should refuse a recipient that is not among those passed in, such as a hidden PJ", () => {
    const result = giveItem([aria(holding([sword])), borin()], "sword", 1, { to: 12 });

    assert.equal(errorCode(result), "CHARACTER_NOT_FOUND");
  });

  it("should refuse a player giving from another PJ", () => {
    const result = giveItem(
      [aria(), borin(holding([sword]))],
      "sword",
      1,
      { from: 9, to: 7 },
    );

    assert.equal(errorCode(result), "FORBIDDEN");
  });

  it("should leave one aviso for the giver when a player gives an item", () => {
    const whole = expectChange(giveItem([aria(holding([sword])), borin()], "sword", 1));
    const part = expectChange(giveItem([aria(holding([potions])), borin()], "potions", 2));

    assert.deepEqual(whole.notices, [
      { combatantId: 7, text: "Aria dio Espada larga de gran calidad a Borin" },
    ]);
    assert.deepEqual(part.notices, [
      { combatantId: 7, text: "Aria dio Poción de curar heridas leves ×2 a Borin" },
    ]);
  });

  it("should let the DM give between any two PJs, with no aviso", () => {
    const change = expectChange(
      giveItem([aria(), borin(holding([sword]))], "sword", 1, { actor: DM, from: 9, to: 7 }),
    );

    assert.deepEqual(change.characters[0].inventory.items, [{ ...sword, id: "id-1" }]);
    assert.deepEqual(change.characters[1].inventory.items, []);
    assert.deepEqual(change.notices, []);
  });

  const giveCoins = (
    characters: Character[],
    coins: Partial<Coins>,
    actor: Actor = ARIA_PLAYER,
  ) =>
    applyInventoryAction(
      characters,
      actor,
      {
        type: "giveCoins",
        combatantId: 7,
        toCombatantId: 9,
        coins: { ...EMPTY_INVENTORY.coins, ...coins },
      },
      sequentialIds(),
    );

  it("should move coins from one inventory to the other", () => {
    const change = expectChange(
      giveCoins(
        [
          aria({ coins: { pc: 5, pp: 0, po: 50, ppt: 1 }, items: [] }),
          borin(holding([], 10)),
        ],
        { po: 30, pc: 5 },
      ),
    );

    assert.deepEqual(change.characters[0].inventory.coins, { pc: 0, pp: 0, po: 20, ppt: 1 });
    assert.deepEqual(change.characters[1].inventory.coins, { pc: 5, pp: 0, po: 40, ppt: 0 });
  });

  it("should refuse to give more coins than there are", () => {
    const result = giveCoins([aria(holding([], 50)), borin()], { po: 51 });

    assert.equal(errorCode(result), "NOT_ENOUGH");
  });

  it("should refuse to give no coins", () => {
    const result = giveCoins([aria(holding([], 50)), borin()], {});

    assert.equal(errorCode(result), "INVALID_QUANTITY");
  });

  it("should leave one aviso for the giver when a player gives coins, and none for the DM", () => {
    const characters = [aria({ coins: { pc: 0, pp: 0, po: 50, ppt: 2 }, items: [] }), borin()];

    assert.deepEqual(expectChange(giveCoins(characters, { po: 30, ppt: 1 })).notices, [
      { combatantId: 7, text: "Aria dio 1 ppt, 30 po a Borin" },
    ]);
    assert.deepEqual(expectChange(giveCoins(characters, { po: 30 }, DM)).notices, []);
  });
});
