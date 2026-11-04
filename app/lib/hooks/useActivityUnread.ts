"use client";

import { useCallback, useEffect, useState } from "react";
import { z } from "zod";
import {
  subscribeConnected,
  subscribePartyEvent,
} from "@/app/lib/pusher-client";

const ResponseSchema = z.object({
  unread: z.array(z.object({ combatantId: z.number(), count: z.number() })),
});

export type ActivityUnread = {
  /** Unread avisos per PJ id; a PJ with none is missing. */
  byCombatant: Record<number, number>;
  total: number;
};

/**
 * DM-only: the unread avisos of every PJ's actividad, for the backpack badges.
 * With no `dmToken` (a player) it never fetches and stays at zero. Re-fetches
 * on the party's `"inventory"` signal, with a slow poll in case one is missed.
 */
export function useActivityUnread(
  partyCode: string,
  dmToken: string | null,
  fallbackIntervalMs = 30000,
): ActivityUnread {
  const [unread, setUnread] = useState<ActivityUnread>({
    byCombatant: {},
    total: 0,
  });

  const fetchUnread = useCallback(async () => {
    if (!dmToken) return;
    try {
      const res = await fetch(`/api/party/${partyCode}/activity`, {
        cache: "no-store",
        headers: { "x-dm-token": dmToken },
      });
      if (!res.ok) {
        console.error("Error fetching activity for party", partyCode, res.status);
        return;
      }
      const data = ResponseSchema.parse(await res.json());
      setUnread({
        byCombatant: Object.fromEntries(
          data.unread.map((u) => [u.combatantId, u.count]),
        ),
        total: data.unread.reduce((sum, u) => sum + u.count, 0),
      });
    } catch (fetchError) {
      console.error("Error fetching activity for party", partyCode, fetchError);
    }
  }, [partyCode, dmToken]);

  useEffect(() => {
    if (!dmToken) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => void fetchUnread(), 150);
    };
    scheduleFetch();
    const unsubscribeInventory = subscribePartyEvent(
      partyCode,
      "inventory",
      scheduleFetch,
    );
    const unsubscribeConnected = subscribeConnected(scheduleFetch);
    const interval = setInterval(scheduleFetch, fallbackIntervalMs);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      clearInterval(interval);
      unsubscribeInventory();
      unsubscribeConnected();
    };
  }, [dmToken, partyCode, fetchUnread, fallbackIntervalMs]);

  return unread;
}
