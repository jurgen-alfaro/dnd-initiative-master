import { z } from "zod";
import type { AppError } from "../types";
import { DENOMINATIONS, NO_COINS } from "../treasure/coins";
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
 * change to an inventario, and the `Inventory` shape and its schema.
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

/** A PJ whose inventario an action reads or changes. */
export type Character = { id: number; name: string; inventory: Inventory };

/** Who acts: the DM, or the player who claimed the PJ `combatantId`. */
export type Actor = { role: "dm" } | { role: "player"; combatantId: number };

/** What happens to the inventarios. */
export type InventoryAction = {
  /** An entrega: the coins and items one PJ got from a treasure. */
  type: "receive";
  combatantId: number;
  coins: Coins;
  items: TreasureItem[];
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

  switch (action.type) {
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
      (next, item) => addItem(next, item, newId),
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
  item: TreasureItem,
  newId: () => string,
): InventoryItem[] {
  const pile = isConsumable(item)
    ? items.find((i) => isConsumable(i) && i.name === item.name)
    : undefined;
  if (!pile) return [...items, toInventoryItem(item, newId())];

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

function toInventoryItem(
  { category: _category, rolls: _rolls, ...item }: TreasureItem,
  id: string,
): InventoryItem {
  return { id, ...item };
}
