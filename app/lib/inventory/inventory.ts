import { z } from "zod";
import type { AppError } from "../types";
import { DENOMINATIONS, formatCoinList, NO_COINS } from "../treasure/coins";
import {
  CoinsSchema,
  TreasureItemSchema,
  type Coins,
  type TreasureItem,
} from "../treasure/treasure";

/**
 * The inventario of each PJ. Pure logic: no framework, no database, and new
 * item ids come from the caller.
 *
 * Public interface: `applyInventoryAction`, the one entry point for every
 * change to an inventario, `isInventoryEmpty`, `itemUse` (which button an item
 * gets), and the `Inventory` shape and its schema.
 *
 * Adding an action: a variant of `InventoryAction` and its `case` in
 * `applyInventoryAction`, which returns `noticeFor(actor, ...)` as its avisos.
 */

/** An item of an inventario: a treasure item without its rolls, plus an id. */
export const InventoryItemSchema = TreasureItemSchema.pick({
  inventoryCategory: true,
  name: true,
  quantity: true,
  charges: true,
  usage: true,
  valueCp: true,
  description: true,
}).extend({
  /** Stable, so an item can be used, given or removed whatever its position. */
  id: z.string().min(1).max(100),
});
export type InventoryItem = z.infer<typeof InventoryItemSchema>;

export const InventorySchema = z.object({
  coins: CoinsSchema,
  items: z.array(InventoryItemSchema),
});
export type Inventory = z.infer<typeof InventorySchema>;

export const EMPTY_INVENTORY: Inventory = { coins: NO_COINS, items: [] };

/** No coins of any kind and no items: nothing is lost if the PJ goes. */
export function isInventoryEmpty({ coins, items }: Inventory): boolean {
  return items.length === 0 && DENOMINATIONS.every((d) => coins[d] === 0);
}

/** A PJ whose inventario an action reads or changes. */
export type Character = { id: number; name: string; inventory: Inventory };

/** Who acts: the DM, or the player who claimed the PJ `combatantId`. */
export type Actor = { role: "dm" } | { role: "player"; combatantId: number };

/**
 * What happens to the inventarios. `combatantId` is always the PJ who acts on
 * their inventario: a player may only name their own.
 */
export type InventoryAction =
  | {
      /** An entrega: the coins and items one PJ got from a treasure. */
      type: "receive";
      combatantId: number;
      coins: Coins;
      items: TreasureItem[];
    }
  | {
      /** A uso: one unit of a consumable, or one carga. */
      type: "use";
      combatantId: number;
      itemId: string;
    }
  | {
      /** Dar: `quantity` units of an item go to another PJ, who need not accept. */
      type: "giveItem";
      combatantId: number;
      toCombatantId: number;
      itemId: string;
      quantity: number;
    }
  | {
      /** Dar monedas: they go to another PJ, who need not accept. */
      type: "giveCoins";
      combatantId: number;
      toCombatantId: number;
      coins: Coins;
    };

/** An aviso for the actividad of a PJ. */
export type InventoryNotice = { combatantId: number; text: string };

export type InventoryChange = {
  /** Every character passed in, with its inventario after the action. */
  characters: Character[];
  notices: InventoryNotice[];
};

/**
 * Applies an action to the inventarios of the PJs involved. Returns all of
 * them, changed or not, and the avisos it produced, or why it was refused.
 */
export function applyInventoryAction(
  characters: Character[],
  actor: Actor,
  action: InventoryAction,
  newId: () => string,
): InventoryChange | { error: AppError } {
  const target = characters.find((c) => c.id === action.combatantId);
  if (!target) {
    return fail("CHARACTER_NOT_FOUND", "That character is not part of this action", {
      combatantId: action.combatantId,
    });
  }

  if (actor.role === "player" && actor.combatantId !== target.id) {
    return fail("FORBIDDEN", "A player can only change their own character");
  }

  switch (action.type) {
    case "use": {
      const item = target.inventory.items.find((i) => i.id === action.itemId);
      if (!item) {
        return fail("ITEM_NOT_FOUND", "That item is not in the inventory", {
          itemId: action.itemId,
        });
      }
      if (item.charges === 0) {
        return fail("NO_CHARGES", `${item.name} has no charges left`);
      }
      const use = itemUse(item);
      if (!use) return fail("NOT_USABLE", `${item.name} can't be used`);

      return {
        characters: withInventory(characters, target.id, {
          ...target.inventory,
          items: spendOne(target.inventory.items, item),
        }),
        notices: noticeFor(actor, target, usageNotice(target.name, item, use)),
      };
    }
    case "giveItem": {
      const recipient = recipientOf(characters, target, action.toCombatantId);
      if ("error" in recipient) return recipient;
      const item = target.inventory.items.find((i) => i.id === action.itemId);
      if (!item) {
        return fail("ITEM_NOT_FOUND", "That item is not in the inventory", {
          itemId: action.itemId,
        });
      }
      if (!Number.isInteger(action.quantity) || action.quantity < 1) {
        return fail("INVALID_QUANTITY", "Give at least one whole unit");
      }
      if (action.quantity > item.quantity) {
        return fail("NOT_ENOUGH", `There are only ${item.quantity} of ${item.name}`);
      }

      const { kept, given } = splitItem(item, action.quantity);
      const afterGiver = withInventory(characters, target.id, {
        ...target.inventory,
        items: kept
          ? target.inventory.items.map((i) => (i === item ? kept : i))
          : target.inventory.items.filter((i) => i !== item),
      });
      return {
        characters: withInventory(afterGiver, recipient.id, {
          ...recipient.inventory,
          items: addItem(recipient.inventory.items, given, newId),
        }),
        notices: noticeFor(
          actor,
          target,
          `${target.name} dio ${item.name}${action.quantity > 1 ? ` ×${action.quantity}` : ""} a ${recipient.name}`,
        ),
      };
    }
    case "giveCoins": {
      const recipient = recipientOf(characters, target, action.toCombatantId);
      if ("error" in recipient) return recipient;
      const given = formatCoinList(action.coins);
      if (
        given.length === 0 ||
        DENOMINATIONS.some((d) => !Number.isInteger(action.coins[d]) || action.coins[d] < 0)
      ) {
        return fail("INVALID_QUANTITY", "Give some whole coins");
      }
      if (DENOMINATIONS.some((d) => action.coins[d] > target.inventory.coins[d])) {
        return fail("NOT_ENOUGH", `${target.name} doesn't have those coins`);
      }

      const giverCoins = { ...target.inventory.coins };
      const recipientCoins = { ...recipient.inventory.coins };
      for (const d of DENOMINATIONS) {
        giverCoins[d] -= action.coins[d];
        recipientCoins[d] += action.coins[d];
      }
      const afterGiver = withInventory(characters, target.id, {
        ...target.inventory,
        coins: giverCoins,
      });
      return {
        characters: withInventory(afterGiver, recipient.id, {
          ...recipient.inventory,
          coins: recipientCoins,
        }),
        notices: noticeFor(
          actor,
          target,
          `${target.name} dio ${given.join(", ")} a ${recipient.name}`,
        ),
      };
    }
    case "receive": {
      // Only the DM delivers treasure, and an entrega never makes an aviso.
      if (actor.role !== "dm") {
        return fail("FORBIDDEN", "Only the DM can deliver treasure");
      }
      return {
        characters: withInventory(
          characters,
          target.id,
          receive(target.inventory, action, newId),
        ),
        notices: [],
      };
    }
  }
}

/**
 * The button an item gets: drink a potion, use a scroll, an alchemical or an
 * item with cargas left. Null for anything else, including an item at 0 cargas.
 */
export function itemUse(item: InventoryItem): "drink" | "use" | null {
  if (item.charges !== undefined) return item.charges > 0 ? "use" : null;
  return item.usage === "none" ? null : item.usage;
}

/** One aviso for the PJ's actividad, but only when its player acted. */
function noticeFor(
  actor: Actor,
  character: Character,
  text: string,
): InventoryNotice[] {
  return actor.role === "player" ? [{ combatantId: character.id, text }] : [];
}

function usageNotice(
  name: string,
  item: InventoryItem,
  use: "drink" | "use",
): string {
  if (item.charges !== undefined) return `${name} usó una carga de ${item.name}`;
  return `${name} ${use === "drink" ? "bebió" : "usó"} ${item.name}`;
}

/**
 * Spends one carga, or one unit of a consumable with its share of the value.
 * A consumable at 0 units leaves the inventario.
 */
function spendOne(items: InventoryItem[], item: InventoryItem): InventoryItem[] {
  const { charges } = item;
  if (charges !== undefined) {
    return items.map((i) => (i === item ? { ...i, charges: charges - 1 } : i));
  }
  if (item.quantity === 1) return items.filter((i) => i !== item);
  return items.map((i) =>
    i === item
      ? {
          ...i,
          quantity: i.quantity - 1,
          valueCp: Math.round((i.valueCp * (i.quantity - 1)) / i.quantity),
        }
      : i,
  );
}

/** The PJ who receives a dar: another one among those passed in. */
function recipientOf(
  characters: Character[],
  giver: Character,
  id: number,
): Character | { error: AppError } {
  if (id === giver.id) return fail("SAME_CHARACTER", "Give it to another character");
  return (
    characters.find((c) => c.id === id) ??
    fail("CHARACTER_NOT_FOUND", "That character is not part of this action", {
      combatantId: id,
    })
  );
}

/**
 * Takes `quantity` units off an item, with their share of the value: what is
 * given, and what stays (null when nothing does). No copper is lost or made.
 */
function splitItem(
  { id, ...item }: InventoryItem,
  quantity: number,
): { kept: InventoryItem | null; given: Omit<InventoryItem, "id"> } {
  if (quantity === item.quantity) return { kept: null, given: item };

  const givenCp = Math.round((item.valueCp * quantity) / item.quantity);
  return {
    kept: {
      id,
      ...item,
      quantity: item.quantity - quantity,
      valueCp: item.valueCp - givenCp,
    },
    given: { ...item, quantity, valueCp: givenCp },
  };
}

function fail(
  code: string,
  message: string,
  context?: unknown,
): { error: AppError } {
  return { error: { code, message, context } };
}

function withInventory(
  characters: Character[],
  id: number,
  inventory: Inventory,
): Character[] {
  return characters.map((c) => (c.id === id ? { ...c, inventory } : c));
}

function receive(
  { coins, items }: Inventory,
  delivery: { coins: Coins; items: TreasureItem[] },
  newId: () => string,
): Inventory {
  const nextCoins = { ...coins };
  for (const d of DENOMINATIONS) nextCoins[d] += delivery.coins[d];

  return {
    coins: nextCoins,
    items: delivery.items.reduce(
      (next, { category: _category, rolls: _rolls, ...item }) =>
        addItem(next, item, newId),
      items,
    ),
  };
}

/** A consumable is used up one unit at a time; charged items keep their own row. */
function isConsumable(item: { usage: string; charges?: number }): boolean {
  return item.usage !== "none" && item.charges === undefined;
}

/** Adds an item as a new row, or onto the pile of the same consumable. */
function addItem(
  items: InventoryItem[],
  item: Omit<InventoryItem, "id">,
  newId: () => string,
): InventoryItem[] {
  const pile = isConsumable(item)
    ? items.find((i) => isConsumable(i) && i.name === item.name)
    : undefined;
  if (!pile) return [...items, { id: newId(), ...item }];

  return items.map((i) =>
    i === pile
      ? {
          ...i,
          quantity: i.quantity + item.quantity,
          valueCp: i.valueCp + item.valueCp,
        }
      : i,
  );
}
