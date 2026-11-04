"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Backpack, ChevronRight, Loader2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useCharacterInventory } from "@/app/lib/hooks/useCharacterInventory";
import { markActivityRead, runBackpackAction } from "@/app/server/actions";
import { getOrCreateDeviceId } from "@/app/lib/device-id";
import { formatMessageTime } from "@/app/lib/date-format";
import type { ActivityNotice } from "@/app/lib/types";
import { DENOMINATIONS, formatCpAsPo, NO_COINS } from "@/app/lib/treasure/coins";
import {
  InventoryCategorySchema,
  type Coins,
  type InventoryCategory,
} from "@/app/lib/treasure/treasure";
import {
  isConsumable,
  itemUse,
  type BackpackAction,
  type Inventory,
  type InventoryItem,
} from "@/app/lib/inventory/inventory";

type InventoryDrawerProps = {
  partyCode: string;
  dmToken: string | null;
  /** The PJ to open; null for a player, whose claim decides it. */
  combatantId: number | null;
  /** The PJs of the party the caller sees, so something can be given to them. */
  characters: Recipient[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Recipient = { id: number; name: string };

/** `Omit` that keeps a union a union. */
type Without<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** A dar, minus the PJ who gives: the backpack's own. */
type Gift = Without<
  Extract<BackpackAction, { type: "giveItem" | "giveCoins" }>,
  "combatantId"
>;

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  weapons: "Weapons",
  armor: "Armor & shields",
  consumables: "Consumables",
  magicItems: "Magic items",
  wondrous: "Wondrous items",
  valuables: "Gems & art",
  mundane: "Mundane items",
};

/** A correction to one item: a backpack action, short of whose and which. */
type ItemEdit = Without<
  Extract<
    BackpackAction,
    { type: "remove" | "setQuantity" | "setCharges" | "markConsumable" }
  >,
  "combatantId" | "itemId"
>;

/** The coins in the order the backpack shows them: lowest first. */
const COIN_ORDER = [...DENOMINATIONS].reverse();

/**
 * The backpack: the inventario of one PJ, with its coins top right and its
 * items in collapsible categories. Only the categories that hold something
 * are listed; an item opens to show its description, its value and its
 * buttons. The DM also sees the PJ's actividad at the bottom.
 */
export default function InventoryDrawer({
  partyCode,
  dmToken,
  combatantId,
  characters,
  open,
  onOpenChange,
}: InventoryDrawerProps) {
  const { character, error, refresh } = useCharacterInventory(
    partyCode,
    open,
    dmToken,
    combatantId,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  // Every backpack action: a refusal shows up above the items. True when it
  // went through, so a form can reset.
  const runAction = async (
    pendingKey: string,
    action: BackpackAction,
  ): Promise<boolean> => {
    setPendingItemId(pendingKey);
    try {
      const result = await runBackpackAction(
        partyCode,
        dmToken,
        getOrCreateDeviceId(),
        action,
      );
      setActionError("error" in result ? result.error : null);
      await refresh();
      return !("error" in result);
    } catch (actionFailure) {
      // The action never answered (network down, server crashed).
      console.error("Error running backpack action", actionFailure);
      setActionError("Couldn't update the backpack. Try again.");
      return false;
    } finally {
      setPendingItemId(null);
    }
  };

  const handleUse = (itemId: string) => {
    if (!character) return;
    void runAction(itemId, {
      type: "use",
      combatantId: character.combatantId,
      itemId,
    });
  };

  const handleEdit = (itemId: string, edit: ItemEdit) => {
    if (!character) return;
    void runAction(itemId, { ...edit, combatantId: character.combatantId, itemId });
  };

  const handleAdjustCoins = (coins: Coins) => {
    if (!character) return;
    void runAction("coins", {
      type: "adjustCoins",
      combatantId: character.combatantId,
      coins,
    });
  };

  const recipients = characters.filter(
    (c) => c.id !== character?.combatantId,
  );

  const handleGive = async (gift: Gift): Promise<boolean> => {
    if (!character) return false;
    return runAction("give", { ...gift, combatantId: character.combatantId });
  };

  const handleActivityRead = async () => {
    if (!character || !dmToken) return;
    try {
      const result = await markActivityRead(
        partyCode,
        dmToken,
        character.combatantId,
      );
      if ("error" in result) setActionError(result.error);
    } catch (readFailure) {
      console.error("Error marking activity as read", readFailure);
      setActionError("Couldn't mark the activity as read");
    }
    await refresh();
  };

  // Close on Escape and lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <aside className="flex h-full w-full max-w-md flex-col bg-card dnd-card-ornate dnd-parchment-texture shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-dnd-gold/20 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2">
            <Backpack className="shrink-0 text-dnd-gold" size={20} />
            <h2 className="truncate font-heading text-lg font-bold tracking-wide text-dnd-gold">
              {character?.combatantName ?? "Backpack"}
            </h2>
          </div>
          <div className="flex items-start gap-1">
            {character && <CoinPurse coins={character.inventory.coins} />}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="cursor-pointer text-muted-foreground hover:text-dnd-parchment"
            >
              <X size={20} />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </div>

        {/* Body */}
        {error ? (
          <p className="px-5 py-4 text-sm text-dnd-blood-bright">{error}</p>
        ) : !character ? (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            <Loader2 className="animate-spin" size={24} />
          </div>
        ) : (
          <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
            {actionError && (
              <p className="text-sm text-dnd-blood-bright">{actionError}</p>
            )}
            <CoinAdjuster
              isPending={pendingItemId !== null}
              onAdjust={handleAdjustCoins}
            />
            {recipients.length > 0 && (
              <GiveCoinsForm
                coins={character.inventory.coins}
                recipients={recipients}
                isPending={pendingItemId !== null}
                onGive={(toCombatantId, coins) =>
                  handleGive({ type: "giveCoins", toCombatantId, coins })
                }
              />
            )}
            <ItemList
              items={character.inventory.items}
              pendingItemId={pendingItemId}
              onUse={handleUse}
              isDm={dmToken !== null}
              onEdit={handleEdit}
              recipients={recipients}
              onGive={(itemId, toCombatantId, quantity) =>
                handleGive({ type: "giveItem", toCombatantId, itemId, quantity })
              }
            />
            {character.activity && (
              <ActivitySection
                notices={character.activity}
                onRead={handleActivityRead}
              />
            )}
          </div>
        )}
      </aside>
    </div>,
    document.body,
  );
}

function CoinPurse({ coins }: { coins: Inventory["coins"] }) {
  return (
    <dl className="grid grid-cols-4 gap-x-3 pt-1 text-right text-sm">
      {COIN_ORDER.map((coin) => (
        <div key={coin}>
          <dt className="text-xs uppercase text-muted-foreground">{coin}</dt>
          <dd className="font-semibold tabular-nums">
            {coins[coin].toLocaleString("en-US")}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Coins to add (positive) or take away (negative), one field per coin. */
function CoinAdjuster({
  isPending,
  onAdjust,
}: {
  isPending: boolean;
  onAdjust: (coins: Coins) => void;
}) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const coins = { ...NO_COINS };
    for (const coin of COIN_ORDER) coins[coin] = Number(data.get(coin));
    onAdjust(coins);
    e.currentTarget.reset();
  };

  return (
    <details className="group rounded-lg border border-dnd-gold/20">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-heading text-dnd-gold">
        <ChevronRight
          size={16}
          className="transition-transform group-open:rotate-90"
        />
        <span className="flex-1">Adjust coins</span>
      </summary>
      <form onSubmit={handleSubmit} className="space-y-2 px-3 pb-3">
        <div className="grid grid-cols-4 gap-2">
          {COIN_ORDER.map((coin) => (
            <label key={coin} className="text-xs uppercase text-muted-foreground">
              {coin}
              <Input
                name={coin}
                type="number"
                step={1}
                defaultValue={0}
                className="mt-1 h-8"
              />
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Positive adds, negative takes away.
        </p>
        <Button
          size="sm"
          variant="outline"
          type="submit"
          disabled={isPending}
          className="cursor-pointer border-dnd-gold/30"
        >
          Apply
        </Button>
      </form>
    </details>
  );
}

function ItemList({
  items,
  pendingItemId,
  onUse,
  isDm,
  onEdit,
  recipients,
  onGive,
}: {
  items: InventoryItem[];
  pendingItemId: string | null;
  onUse: (itemId: string) => void;
  isDm: boolean;
  onEdit: (itemId: string, edit: ItemEdit) => void;
  recipients: Recipient[];
  onGive: (
    itemId: string,
    toCombatantId: number,
    quantity: number,
  ) => Promise<boolean>;
}) {
  const categories = InventoryCategorySchema.options
    .map((category) => ({
      category,
      items: items.filter((item) => item.inventoryCategory === category),
    }))
    .filter(({ items: inCategory }) => inCategory.length > 0);

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">The backpack is empty.</p>
    );
  }

  return (
    <>
      {categories.map(({ category, items: inCategory }) => (
        <details
          key={category}
          className="group rounded-lg border border-dnd-gold/20"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-heading text-dnd-gold">
            <ChevronRight
              size={16}
              className="transition-transform group-open:rotate-90"
            />
            <span className="flex-1">{CATEGORY_LABELS[category]}</span>
            <span className="text-sm text-muted-foreground">
              {inCategory.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          </summary>
          <ul className="space-y-1 px-3 pb-3">
            {inCategory.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                isPending={pendingItemId !== null}
                onUse={() => onUse(item.id)}
                isDm={isDm}
                onEdit={(edit) => onEdit(item.id, edit)}
                recipients={recipients}
                onGive={(toCombatantId, quantity) =>
                  onGive(item.id, toCombatantId, quantity)
                }
              />
            ))}
          </ul>
        </details>
      ))}
    </>
  );
}

const USE_LABELS = { drink: "Drink", use: "Use" } as const;

function ItemRow({
  item,
  isPending,
  onUse,
  isDm,
  onEdit,
  recipients,
  onGive,
}: {
  item: InventoryItem;
  isPending: boolean;
  onUse: () => void;
  isDm: boolean;
  onEdit: (edit: ItemEdit) => void;
  recipients: Recipient[];
  onGive: (toCombatantId: number, quantity: number) => Promise<boolean>;
}) {
  const use = itemUse(item);
  const amount =
    item.charges === undefined
      ? `×${item.quantity}`
      : `${item.charges} ${item.charges === 1 ? "charge" : "charges"}`;

  return (
    <li>
      <details className="group/item rounded-md bg-black/10">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-1.5 text-sm">
          <ChevronRight
            size={14}
            className="shrink-0 text-muted-foreground transition-transform group-open/item:rotate-90"
          />
          <span className="flex-1">{item.name}</span>
          <span className="shrink-0 tabular-nums text-muted-foreground">
            {amount}
          </span>
        </summary>
        <div className="space-y-1 px-8 pb-2 text-sm">
          {item.description && (
            <p className="whitespace-pre-line text-muted-foreground">
              {item.description}
            </p>
          )}
          <p>
            <span className="text-muted-foreground">Value: </span>
            {formatCpAsPo(item.valueCp)}
          </p>
          {use && (
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={onUse}
              className="cursor-pointer border-dnd-gold/30"
            >
              {USE_LABELS[use]}
            </Button>
          )}
          <ItemEditor
            item={item}
            isDm={isDm}
            isPending={isPending}
            onEdit={onEdit}
          />
          {recipients.length > 0 && (
            <GiveItemForm
              item={item}
              recipients={recipients}
              isPending={isPending}
              onGive={onGive}
            />
          )}
        </div>
      </details>
    </li>
  );
}

/** Who to give to: the other PJs of the party. */
function RecipientSelect({
  recipients,
  value,
  onChange,
}: {
  recipients: Recipient[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  return (
    <select
      aria-label="Give to"
      value={value ?? ""}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
    >
      <option value="" disabled className="bg-card">
        Give to…
      </option>
      {recipients.map((r) => (
        <option key={r.id} value={r.id} className="bg-card">
          {r.name}
        </option>
      ))}
    </select>
  );
}

/** Gives an item, or part of a stack, to another PJ. */
function GiveItemForm({
  item,
  recipients,
  isPending,
  onGive,
}: {
  item: InventoryItem;
  recipients: Recipient[];
  isPending: boolean;
  onGive: (toCombatantId: number, quantity: number) => Promise<boolean>;
}) {
  const [to, setTo] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      {item.quantity > 1 && (
        <Input
          type="number"
          aria-label="How many"
          min={1}
          max={item.quantity}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="h-8 w-16"
        />
      )}
      <RecipientSelect recipients={recipients} value={to} onChange={setTo} />
      <Button
        size="sm"
        variant="outline"
        disabled={isPending || to === null}
        onClick={async () => {
          if (to !== null && (await onGive(to, quantity))) setTo(null);
        }}
        className="cursor-pointer border-dnd-gold/30"
      >
        Give
      </Button>
    </div>
  );
}

/** Gives coins to another PJ. */
function GiveCoinsForm({
  coins,
  recipients,
  isPending,
  onGive,
}: {
  coins: Coins;
  recipients: Recipient[];
  isPending: boolean;
  onGive: (toCombatantId: number, coins: Coins) => Promise<boolean>;
}) {
  const [to, setTo] = useState<number | null>(null);
  const [gift, setGift] = useState<Coins>(NO_COINS);

  return (
    <details className="group rounded-lg border border-dnd-gold/20">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-heading text-dnd-gold">
        <ChevronRight
          size={16}
          className="transition-transform group-open:rotate-90"
        />
        <span className="flex-1">Give coins</span>
      </summary>
      <div className="space-y-2 px-3 pb-3">
        <div className="grid grid-cols-4 gap-2">
          {COIN_ORDER.map((coin) => (
            <label
              key={coin}
              className="text-xs uppercase text-muted-foreground"
            >
              {coin}
              <Input
                type="number"
                min={0}
                max={coins[coin]}
                placeholder="0"
                value={gift[coin] || ""}
                onChange={(e) =>
                  setGift({ ...gift, [coin]: Number(e.target.value) })
                }
                className="h-8"
              />
            </label>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <RecipientSelect
            recipients={recipients}
            value={to}
            onChange={setTo}
          />
          <Button
            size="sm"
            variant="outline"
            disabled={isPending || to === null}
            onClick={async () => {
              if (to !== null && (await onGive(to, gift))) {
                setGift(NO_COINS);
                setTo(null);
              }
            }}
            className="cursor-pointer border-dnd-gold/30"
          >
            Give
          </Button>
        </div>
      </div>
    </details>
  );
}

/**
 * The corrections each role may make to an item: anyone removes it or lowers
 * a consumable's quantity; only the DM raises it, sets cargas or marks it a
 * consumable.
 */
function ItemEditor({
  item,
  isDm,
  isPending,
  onEdit,
}: {
  item: InventoryItem;
  isDm: boolean;
  isPending: boolean;
  onEdit: (edit: ItemEdit) => void;
}) {
  const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
  const consumable = isConsumable(item);

  const submitWith =
    (build: (data: FormData) => ItemEdit) => (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      onEdit(build(new FormData(e.currentTarget)));
    };
  const buttonClass = "cursor-pointer border-dnd-gold/30";
  const inputClass = "h-8 w-20";

  return (
    <div className="space-y-2 pt-1">
      {consumable && (
        <form
          className="flex items-center gap-2"
          onSubmit={submitWith((data) => ({
            type: "setQuantity",
            quantity: Number(data.get("quantity")),
          }))}
        >
          <Input
            name="quantity"
            type="number"
            min={1}
            max={isDm ? 1000 : item.quantity}
            step={1}
            required
            defaultValue={item.quantity}
            aria-label="Quantity"
            className={inputClass}
          />
          <Button size="sm" variant="outline" type="submit" disabled={isPending} className={buttonClass}>
            Set quantity
          </Button>
        </form>
      )}
      {isDm && (
        <form
          className="flex items-center gap-2"
          onSubmit={submitWith((data) => ({
            type: "setCharges",
            charges: Number(data.get("charges")),
          }))}
        >
          <Input
            name="charges"
            type="number"
            min={0}
            max={1000}
            step={1}
            required
            defaultValue={item.charges ?? 0}
            aria-label="Charges"
            className={inputClass}
          />
          <Button size="sm" variant="outline" type="submit" disabled={isPending} className={buttonClass}>
            {item.charges === undefined ? "Give charges" : "Set charges"}
          </Button>
        </form>
      )}
      {isDm && !consumable && (
        <form
          className="flex items-center gap-2"
          onSubmit={submitWith((data) => ({
            type: "markConsumable",
            quantity: Number(data.get("quantity")),
            usage: data.get("usage") === "drink" ? "drink" : "use",
          }))}
        >
          <Input
            name="quantity"
            type="number"
            min={1}
            max={1000}
            step={1}
            required
            defaultValue={item.quantity}
            aria-label="Quantity"
            className={inputClass}
          />
          <select
            name="usage"
            aria-label="How it is spent"
            className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="use">Use</option>
            <option value="drink">Drink</option>
          </select>
          <Button size="sm" variant="outline" type="submit" disabled={isPending} className={buttonClass}>
            Mark consumable
          </Button>
        </form>
      )}
      {isConfirmingRemove ? (
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Remove it?</span>
          <Button
            size="sm"
            variant="destructive"
            disabled={isPending}
            onClick={() => onEdit({ type: "remove" })}
            className="cursor-pointer"
          >
            Remove
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsConfirmingRemove(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => setIsConfirmingRemove(true)}
          className="cursor-pointer text-dnd-blood-bright"
        >
          Remove
        </Button>
      )}
    </div>
  );
}

/**
 * DM-only: the PJ's avisos, oldest first. Opening it marks them as read, and
 * so does any aviso that arrives while it is open.
 */
function ActivitySection({
  notices,
  onRead,
}: {
  notices: ActivityNotice[];
  onRead: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notices.filter((n) => n.readAt === null).length;

  useEffect(() => {
    if (isOpen && unreadCount > 0) onRead();
    // Only opening the section or a new aviso should mark them read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, unreadCount]);

  return (
    <details
      className="group rounded-lg border border-dnd-gold/20"
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 font-heading text-dnd-gold">
        <ChevronRight
          size={16}
          className="transition-transform group-open:rotate-90"
        />
        <span className="flex-1">Activity</span>
        {unreadCount > 0 && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-dnd-blood px-1 font-sans text-xs font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </summary>
      {notices.length === 0 ? (
        <p className="px-3 pb-3 text-sm text-muted-foreground">
          Nothing yet.
        </p>
      ) : (
        <ul className="space-y-1 px-3 pb-3 text-sm">
          {notices.map((notice) => (
            <li key={notice.id} className="flex gap-2">
              <span className="flex-1">{notice.text}</span>
              <time
                dateTime={notice.createdAt}
                className="shrink-0 tabular-nums text-muted-foreground"
              >
                {formatMessageTime(notice.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
