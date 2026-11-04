"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Backpack, ChevronRight, Loader2, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useCharacterInventory } from "@/app/lib/hooks/useCharacterInventory";
import { applyInventory, markActivityRead } from "@/app/server/actions";
import { getOrCreateDeviceId } from "@/app/lib/device-id";
import { formatMessageTime } from "@/app/lib/date-format";
import type { ActivityNotice } from "@/app/lib/types";
import { formatCpAsPo, NO_COINS } from "@/app/lib/treasure/coins";
import {
  InventoryCategorySchema,
  type Coins,
  type InventoryCategory,
} from "@/app/lib/treasure/treasure";
import {
  itemUse,
  type Inventory,
  type InventoryItem,
} from "@/app/lib/inventory/inventory";

interface InventoryDrawerProps {
  partyCode: string;
  dmToken: string | null;
  /** The PJ to open; null for a player, whose claim decides it. */
  combatantId: number | null;
  /** The PJs of the party the caller sees, so something can be given to them. */
  characters: Recipient[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Recipient = { id: number; name: string };

/** A dar, minus the PJ who gives: the backpack's own. */
type Gift =
  | { type: "giveItem"; toCombatantId: number; itemId: string; quantity: number }
  | { type: "giveCoins"; toCombatantId: number; coins: Coins };

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  weapons: "Weapons",
  armor: "Armor & shields",
  consumables: "Consumables",
  magicItems: "Magic items",
  wondrous: "Wondrous items",
  valuables: "Gems & art",
  mundane: "Mundane items",
};

/** The coins in the order the backpack shows them. */
const COIN_ORDER = ["pc", "pp", "po", "ppt"] as const;

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

  const handleUse = async (itemId: string) => {
    if (!character) return;
    setPendingItemId(itemId);
    try {
      const result = await applyInventory(
        partyCode,
        dmToken,
        getOrCreateDeviceId(),
        { type: "use", combatantId: character.combatantId, itemId },
      );
      setActionError("error" in result ? result.error : null);
      await refresh();
    } finally {
      setPendingItemId(null);
    }
  };

  const [isGiving, setIsGiving] = useState(false);
  const recipients = characters.filter(
    (c) => c.id !== character?.combatantId,
  );

  /** Gives at once; true when it went through, so the form can reset. */
  const handleGive = async (gift: Gift): Promise<boolean> => {
    if (!character) return false;
    setIsGiving(true);
    try {
      const result = await applyInventory(
        partyCode,
        dmToken,
        getOrCreateDeviceId(),
        { ...gift, combatantId: character.combatantId },
      );
      setActionError("error" in result ? result.error : null);
      await refresh();
      return !("error" in result);
    } finally {
      setIsGiving(false);
    }
  };

  const handleActivityRead = async () => {
    if (!character || !dmToken) return;
    const result = await markActivityRead(
      partyCode,
      dmToken,
      character.combatantId,
    );
    if ("error" in result) setActionError(result.error);
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
            {recipients.length > 0 && (
              <GiveCoinsForm
                coins={character.inventory.coins}
                recipients={recipients}
                isPending={isGiving}
                onGive={(toCombatantId, coins) =>
                  handleGive({ type: "giveCoins", toCombatantId, coins })
                }
              />
            )}
            <ItemList
              items={character.inventory.items}
              pendingItemId={pendingItemId}
              onUse={handleUse}
              recipients={recipients}
              isGiving={isGiving}
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

function ItemList({
  items,
  pendingItemId,
  onUse,
  recipients,
  isGiving,
  onGive,
}: {
  items: InventoryItem[];
  pendingItemId: string | null;
  onUse: (itemId: string) => void;
  recipients: Recipient[];
  isGiving: boolean;
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
                isPending={pendingItemId !== null || isGiving}
                onUse={() => onUse(item.id)}
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
  recipients,
  onGive,
}: {
  item: InventoryItem;
  isPending: boolean;
  onUse: () => void;
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
