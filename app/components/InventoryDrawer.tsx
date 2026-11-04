"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Backpack, ChevronRight, Loader2, X } from "lucide-react";
import { Button } from "./ui/button";
import { useCharacterInventory } from "@/app/lib/hooks/useCharacterInventory";
import { applyInventory, markActivityRead } from "@/app/server/actions";
import { getOrCreateDeviceId } from "@/app/lib/device-id";
import { formatMessageTime } from "@/app/lib/date-format";
import type { ActivityNotice } from "@/app/lib/types";
import { formatCpAsPo } from "@/app/lib/treasure/coins";
import {
  InventoryCategorySchema,
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
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
            <ItemList
              items={character.inventory.items}
              pendingItemId={pendingItemId}
              onUse={handleUse}
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
}: {
  items: InventoryItem[];
  pendingItemId: string | null;
  onUse: (itemId: string) => void;
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
}: {
  item: InventoryItem;
  isPending: boolean;
  onUse: () => void;
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
        </div>
      </details>
    </li>
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
