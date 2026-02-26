import { useEffect, useRef, useState, useCallback } from "react";
import type { Combatant } from "@/app/lib/types";
import {
  advanceTurn,
  previousTurn,
  nextRound,
  applyDamageOrHealing,
} from "@/app/server/actions";

/**
 * Polls `/api/party/[code]` every `intervalMs` milliseconds and keeps
 * party state up-to-date. Returns combatants, currentTurnIndex, currentRound,
 * and optimistic update functions for instant UI feedback.
 */
export function usePartyPolling(
  partyCode: string,
  initialCombatants: Combatant[],
  initialTurnIndex = 0,
  initialRound = 1,
  intervalMs = 3000,
): {
  combatants: Combatant[];
  currentTurnIndex: number;
  currentRound: number;
  optimisticAdvanceTurn: () => Promise<void>;
  optimisticPreviousTurn: () => Promise<void>;
  optimisticNextRound: () => Promise<void>;
  optimisticApplyDamageHeal: (
    combatantId: number,
    amount: number,
    type: "damage" | "healing",
  ) => Promise<void>;
} {
  const [combatants, setCombatants] = useState<Combatant[]>(initialCombatants);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(initialTurnIndex);
  const [currentRound, setCurrentRound] = useState(initialRound);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(
    new Set(),
  );

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const previousStateRef = useRef<{
    turnIndex: number;
    round: number;
    combatants: Combatant[];
  } | null>(null);

  // Optimistic update function for advancing turn
  const optimisticAdvanceTurn = useCallback(async () => {
    const opId = "advance-turn";
    if (pendingOperations.has(opId)) return; // Prevent duplicate clicks

    // Save current state for rollback
    previousStateRef.current = {
      turnIndex: currentTurnIndex,
      round: currentRound,
      combatants: combatants,
    };

    // Optimistically update UI (instant)
    const maxIndex = Math.max(0, combatants.length - 1);
    const nextIndex = Math.min(currentTurnIndex + 1, maxIndex);
    setCurrentTurnIndex(nextIndex);

    // Mark operation as pending
    setPendingOperations((prev) => new Set(prev).add(opId));

    try {
      // Call server action (background)
      const result = await advanceTurn(partyCode);

      if (!result.success) {
        // Rollback on error
        if (previousStateRef.current) {
          setCurrentTurnIndex(previousStateRef.current.turnIndex);
          setCurrentRound(previousStateRef.current.round);
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Failed to advance turn:", result.error);
      }
    } catch (error) {
      // Rollback on exception
      if (previousStateRef.current) {
        setCurrentTurnIndex(previousStateRef.current.turnIndex);
        setCurrentRound(previousStateRef.current.round);
        setCombatants(previousStateRef.current.combatants);
      }
      console.error("Error advancing turn:", error);
    } finally {
      // Clear pending after delay to prevent rapid re-clicks
      setTimeout(() => {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(opId);
          return next;
        });
      }, 500);
    }
  }, [
    partyCode,
    currentTurnIndex,
    currentRound,
    combatants,
    pendingOperations,
  ]);

  // Optimistic update function for previous turn
  const optimisticPreviousTurn = useCallback(async () => {
    const opId = "previous-turn";
    if (pendingOperations.has(opId)) return;

    // Save current state for rollback
    previousStateRef.current = {
      turnIndex: currentTurnIndex,
      round: currentRound,
      combatants: combatants,
    };

    // Optimistically update UI (instant)
    const prevIndex = Math.max(0, currentTurnIndex - 1);
    setCurrentTurnIndex(prevIndex);

    // Mark operation as pending
    setPendingOperations((prev) => new Set(prev).add(opId));

    try {
      const result = await previousTurn(partyCode);

      if (!result.success) {
        // Rollback on error
        if (previousStateRef.current) {
          setCurrentTurnIndex(previousStateRef.current.turnIndex);
          setCurrentRound(previousStateRef.current.round);
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Failed to go to previous turn:", result.error);
      }
    } catch (error) {
      // Rollback on exception
      if (previousStateRef.current) {
        setCurrentTurnIndex(previousStateRef.current.turnIndex);
        setCurrentRound(previousStateRef.current.round);
        setCombatants(previousStateRef.current.combatants);
      }
      console.error("Error going to previous turn:", error);
    } finally {
      setTimeout(() => {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(opId);
          return next;
        });
      }, 500);
    }
  }, [
    partyCode,
    currentTurnIndex,
    currentRound,
    combatants,
    pendingOperations,
  ]);

  // Optimistic update function for next round
  const optimisticNextRound = useCallback(async () => {
    const opId = "next-round";
    if (pendingOperations.has(opId)) return;

    // Save current state for rollback
    previousStateRef.current = {
      turnIndex: currentTurnIndex,
      round: currentRound,
      combatants: combatants,
    };

    // Optimistically update UI (instant)
    setCurrentRound(currentRound + 1);
    setCurrentTurnIndex(0); // Reset to first combatant

    // Mark operation as pending
    setPendingOperations((prev) => new Set(prev).add(opId));

    try {
      const result = await nextRound(partyCode);

      if (!result.success) {
        // Rollback on error
        if (previousStateRef.current) {
          setCurrentTurnIndex(previousStateRef.current.turnIndex);
          setCurrentRound(previousStateRef.current.round);
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Failed to advance round:", result.error);
      }
    } catch (error) {
      // Rollback on exception
      if (previousStateRef.current) {
        setCurrentTurnIndex(previousStateRef.current.turnIndex);
        setCurrentRound(previousStateRef.current.round);
        setCombatants(previousStateRef.current.combatants);
      }
      console.error("Error advancing round:", error);
    } finally {
      setTimeout(() => {
        setPendingOperations((prev) => {
          const next = new Set(prev);
          next.delete(opId);
          return next;
        });
      }, 500);
    }
  }, [
    partyCode,
    currentTurnIndex,
    currentRound,
    combatants,
    pendingOperations,
  ]);

  // Optimistic update function for damage/healing
  const optimisticApplyDamageHeal = useCallback(
    async (combatantId: number, amount: number, type: "damage" | "healing") => {
      const opId = `damage-heal-${combatantId}`;
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      // Calculate new HP/tmpHP optimistically using D&D 5e rules
      const updatedCombatants = combatants.map((c) => {
        if (c.id !== combatantId) return c;

        let newHp = c.hp;
        let newTmpHp = c.tmpHp;

        if (type === "damage") {
          // Damage logic: Temp HP absorbs first, overflow goes to HP
          if (newTmpHp > 0) {
            if (amount >= newTmpHp) {
              const overflow = amount - newTmpHp;
              newTmpHp = 0;
              newHp = Math.max(0, newHp - overflow);
            } else {
              newTmpHp = newTmpHp - amount;
            }
          } else {
            newHp = Math.max(0, newHp - amount);
          }
        } else if (type === "healing") {
          // Healing logic: Add to HP, capped at maxHp
          newHp = Math.min(c.maxHp, newHp + amount);
        }

        return { ...c, hp: newHp, tmpHp: newTmpHp };
      });

      // Update UI immediately
      setCombatants(updatedCombatants);

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        // Call server action in background
        const result = await applyDamageOrHealing(
          combatantId,
          amount,
          type,
          partyCode,
        );

        if (!result.success) {
          // Rollback on error
          if (previousStateRef.current) {
            setCombatants(previousStateRef.current.combatants);
          }
          console.error("Failed to apply damage/healing:", result.error);
        }
      } catch (error) {
        // Rollback on exception
        if (previousStateRef.current) {
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Error applying damage/healing:", error);
      } finally {
        // Clear pending after brief delay to prevent spam
        setTimeout(() => {
          setPendingOperations((prev) => {
            const next = new Set(prev);
            next.delete(opId);
            return next;
          });
        }, 500);
      }
    },
    [partyCode, combatants, currentTurnIndex, currentRound, pendingOperations],
  );

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/party/${partyCode}`, {
          cache: "no-store",
        });
        if (!res.ok) return;

        const data: {
          combatants: Combatant[];
          currentTurnIndex: number;
          currentRound: number;
        } = await res.json();

        if (!cancelled) {
          // Only update state if no pending operations
          // This prevents polling from overwriting optimistic updates
          if (pendingOperations.size === 0) {
            setCombatants(data.combatants);
            setCurrentTurnIndex(data.currentTurnIndex);
            setCurrentRound(data.currentRound);
          } else {
            // If pending operations, only update combatants
            // This allows other users' stat changes to flow through
            // while preserving local optimistic turn changes
            setCombatants(data.combatants);
          }
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
  }, [partyCode, intervalMs, pendingOperations.size]);

  return {
    combatants,
    currentTurnIndex,
    currentRound,
    optimisticAdvanceTurn,
    optimisticPreviousTurn,
    optimisticNextRound,
    optimisticApplyDamageHeal,
  };
}
