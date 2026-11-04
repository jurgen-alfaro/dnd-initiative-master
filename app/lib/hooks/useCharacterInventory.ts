"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { InventorySchema, type Inventory } from "@/app/lib/inventory/inventory";
import {
  subscribeConnected,
  subscribePartyEvent,
} from "@/app/lib/pusher-client";
import { getOrCreateDeviceId } from "@/app/lib/device-id";
import type { ActivityNotice } from "@/app/lib/types";

const ActivityNoticeSchema = z.object({
  id: z.number(),
  text: z.string(),
  createdAt: z.string(),
  readAt: z.string().nullable(),
});

const ResponseSchema = z.union([
  z.object({ role: z.literal("unclaimed") }),
  z.object({
    role: z.enum(["dm", "player"]),
    combatantId: z.number(),
    combatantName: z.string(),
    inventory: InventorySchema,
    activity: z.array(ActivityNoticeSchema).optional(),
  }),
]);

export type CharacterInventory = {
  combatantId: number;
  combatantName: string;
  inventory: Inventory;
  /** The PJ's actividad, oldest first. Only the DM gets it. */
  activity?: ActivityNotice[];
};

export type CharacterInventoryState = {
  /** Null until loaded, or when there is an `error`. */
  character: CharacterInventory | null;
  error: string | null;
  /** Re-reads now, e.g. after a change made from this backpack. */
  refresh: () => Promise<void>;
};

/**
 * The inventario of one PJ, read from the inventory endpoint while `isOpen`.
 * A player reads the PJ they claimed (`combatantId` null); the DM names one.
 * It re-fetches on the party's `"inventory"` signal, so it stays live without
 * making every client refetch the combatants.
 */
export function useCharacterInventory(
  partyCode: string,
  isOpen: boolean,
  dmToken: string | null,
  combatantId: number | null,
): CharacterInventoryState {
  const [character, setCharacter] = useState<CharacterInventory | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Each open starts empty: until its own read lands, the last open's result
  // could be stale (a dialog would otherwise act on it).
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setCharacter(null);
      setError(null);
    }
  }
  // Reads can overlap (opening, a signal, a reconnect): only the latest writes.
  const latestRequest = useRef(0);

  const fetchInventory = useCallback(async () => {
    const request = ++latestRequest.current;
    const isSuperseded = () => request !== latestRequest.current;
    const headers: Record<string, string> = {
      "x-device-id": getOrCreateDeviceId(),
    };
    if (dmToken) headers["x-dm-token"] = dmToken;
    const query = combatantId === null ? "" : `?combatantId=${combatantId}`;

    try {
      const res = await fetch(`/api/party/${partyCode}/inventory${query}`, {
        cache: "no-store",
        headers,
      });
      if (isSuperseded()) return;
      if (!res.ok) {
        setCharacter(null);
        setError("Couldn't load the backpack");
        return;
      }
      const data = ResponseSchema.parse(await res.json());
      if (isSuperseded()) return;
      if (data.role === "unclaimed") {
        setCharacter(null);
        setError("You haven't claimed a character");
        return;
      }
      setCharacter(data);
      setError(null);
    } catch (fetchError) {
      console.error("Error fetching inventory for party", partyCode, fetchError);
      if (isSuperseded()) return;
      setCharacter(null);
      setError("Couldn't load the backpack");
    }
  }, [partyCode, dmToken, combatantId]);

  useEffect(() => {
    if (!isOpen) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => void fetchInventory(), 150);
    };
    // Opening reads fresh: a backpack seen minutes ago may be stale.
    scheduleFetch();
    const unsubscribeInventory = subscribePartyEvent(
      partyCode,
      "inventory",
      scheduleFetch,
    );
    const unsubscribeConnected = subscribeConnected(scheduleFetch);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribeInventory();
      unsubscribeConnected();
    };
  }, [isOpen, partyCode, fetchInventory]);

  return { character, error, refresh: fetchInventory };
}
