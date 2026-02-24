import { useEffect, useRef, useState } from "react";
import type { Combatant } from "@/app/lib/types";

/**
 * Polls `/api/party/[code]` every `intervalMs` milliseconds and keeps
 * `combatants` state up-to-date.  Returns the latest combatant list so
 * the caller can pass it straight into <InitiativeList data={...} />.
 */
export function usePartyPolling(
  partyCode: string,
  initialCombatants: Combatant[],
  intervalMs = 3000,
): Combatant[] {
  const [combatants, setCombatants] = useState<Combatant[]>(initialCombatants);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/party/${partyCode}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data: { combatants: Combatant[] } = await res.json();

        if (!cancelled) {
          setCombatants(data.combatants);
        }
      } catch {
        // Network error — silently ignore and retry on next tick
        console.error("Network error polling party", partyCode);
      }
    };

    timerRef.current = setInterval(poll, intervalMs);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [partyCode, intervalMs]);

  return combatants;
}
