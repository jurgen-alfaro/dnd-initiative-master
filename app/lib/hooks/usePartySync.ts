import { useEffect, useRef, useState, useCallback } from "react";
import type { Buff, BuffKind, Combatant, Condition } from "@/app/lib/types";
import {
  advanceTurn,
  previousTurn,
  nextRound,
  setRound,
  updatePartyName,
  applyDamageOrHealing,
  updateCombatantStat,
  updateCombatantInfo,
  deleteCombatant,
  updateCombatantConditions,
  addBuffToCombatants,
  removeBuffFromCombatant,
} from "@/app/server/actions";
import {
  calculateDamageResult,
  calculateHealingResult,
} from "@/app/lib/combat/damageCalculator";
import { recalculateTurnIndexAfterDeletion } from "@/app/lib/combat/turnCalculator";
import { getPusherClient } from "@/app/lib/pusher-client";

/**
 * Keeps party state in sync via realtime push: subscribes to the party's
 * Pusher channel and re-fetches `/api/party/[code]` (the source of truth) only
 * when the server signals a change. A low-frequency `fallbackIntervalMs` poll
 * is kept as a safety net (and as the sole sync path when Pusher is not
 * configured). Returns combatants, currentTurnIndex, currentRound, and
 * optimistic update functions for instant UI feedback.
 */
export function usePartySync(
  partyCode: string,
  initialCombatants: Combatant[],
  initialTurnIndex = 0,
  initialRound = 1,
  initialPartyName: string,
  fallbackIntervalMs = 30000,
): {
  combatants: Combatant[];
  currentTurnIndex: number;
  currentRound: number;
  partyName: string;
  optimisticAdvanceTurn: () => Promise<void>;
  optimisticPreviousTurn: () => Promise<void>;
  optimisticNextRound: () => Promise<void>;
  optimisticSetRound: (newRound: number) => Promise<void>;
  optimisticUpdatePartyName: (newName: string) => Promise<void>;
  optimisticApplyDamageHeal: (
    combatantId: number,
    amount: number,
    type: "damage" | "healing",
  ) => Promise<void>;
  optimisticUpdateAC: (combatantId: number, newAC: number) => Promise<void>;
  optimisticUpdateTmpHP: (
    combatantId: number,
    newTmpHP: number,
  ) => Promise<void>;
  optimisticUpdateInitiative: (
    combatantId: number,
    newInitiative: number,
  ) => Promise<void>;
  optimisticUpdateNameType: (
    combatantId: number,
    newName: string,
    newType: "player" | "enemy",
  ) => Promise<void>;
  optimisticDeleteCombatant: (combatantId: number) => Promise<void>;
  optimisticUpdateConditions: (
    combatantId: number,
    conditions: Condition[],
  ) => Promise<void>;
  optimisticAddBuff: (
    combatantIds: number[],
    name: string,
    kind: BuffKind,
    rounds: number,
  ) => Promise<void>;
  optimisticRemoveBuff: (
    combatantId: number,
    buffId: string,
  ) => Promise<void>;
} {
  const [combatants, setCombatants] = useState<Combatant[]>(initialCombatants);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(initialTurnIndex);
  const [currentRound, setCurrentRound] = useState(initialRound);
  const [partyName, setPartyName] = useState(initialPartyName);
  const [pendingOperations, setPendingOperations] = useState<Set<string>>(
    new Set(),
  );

  // Mirror pendingOperations in a ref so the realtime subscription effect can
  // read the latest value without re-subscribing on every optimistic op.
  const pendingOperationsRef = useRef(pendingOperations);
  useEffect(() => {
    pendingOperationsRef.current = pendingOperations;
  }, [pendingOperations]);

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
    // Decrement buff durations and drop expired ones
    setCombatants((prev) =>
      prev.map((c) => ({
        ...c,
        buffs: (c.buffs ?? [])
          .map((b) => ({ ...b, remainingRounds: b.remainingRounds - 1 }))
          .filter((b) => b.remainingRounds > 0),
      })),
    );

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

  // Optimistic update function for setting round manually
  const optimisticSetRound = useCallback(
    async (newRound: number) => {
      const opId = "set-round";
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      // Optimistically update UI (instant) - only round, keep turnIndex
      setCurrentRound(newRound);

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        const result = await setRound(partyCode, newRound);

        if (!result.success) {
          // Rollback on error
          if (previousStateRef.current) {
            setCurrentRound(previousStateRef.current.round);
          }
          console.error("Failed to set round:", result.error);
        }
      } catch (error) {
        // Rollback on exception
        if (previousStateRef.current) {
          setCurrentRound(previousStateRef.current.round);
        }
        console.error("Error setting round:", error);
      } finally {
        setTimeout(() => {
          setPendingOperations((prev) => {
            const next = new Set(prev);
            next.delete(opId);
            return next;
          });
        }, 500);
      }
    },
    [partyCode, currentTurnIndex, currentRound, combatants, pendingOperations],
  );

  // Optimistic update function for party name
  const optimisticUpdatePartyName = useCallback(
    async (newName: string) => {
      const opId = "update-party-name";
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      const previousName = partyName;
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      // Optimistically update UI (instant)
      setPartyName(newName);

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        const result = await updatePartyName(partyCode, newName);

        if (!result.success) {
          // Rollback on error
          setPartyName(previousName);
          console.error("Failed to update party name:", result.error);
        }
      } catch (error) {
        // Rollback on exception
        setPartyName(previousName);
        console.error("Error updating party name:", error);
      } finally {
        setTimeout(() => {
          setPendingOperations((prev) => {
            const next = new Set(prev);
            next.delete(opId);
            return next;
          });
        }, 500);
      }
    },
    [partyCode, partyName, currentTurnIndex, currentRound, combatants, pendingOperations],
  );

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

      // Calculate new HP/tmpHP optimistically using pure functions
      const updatedCombatants = combatants.map((c) => {
        if (c.id !== combatantId) return c;

        if (type === "damage") {
          // Use pure function for damage calculation
          const result = calculateDamageResult(c.hp, c.tmpHp, amount);
          return { ...c, hp: result.hp, tmpHp: result.tmpHp };
        } else if (type === "healing") {
          // Use pure function for healing calculation
          const newHp = calculateHealingResult(c.hp, c.maxHp, amount);
          return { ...c, hp: newHp };
        }

        return c;
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

  // Optimistic update function for AC
  const optimisticUpdateAC = useCallback(
    async (combatantId: number, newAC: number) => {
      const opId = `update-ac-${combatantId}`;
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      // Update optimistically
      const updatedCombatants = combatants.map((c) =>
        c.id === combatantId ? { ...c, ac: newAC } : c,
      );
      setCombatants(updatedCombatants);

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        // Call server action in background
        const result = await updateCombatantStat(
          combatantId,
          "ac",
          newAC,
          partyCode,
        );

        if (!result.success) {
          // Rollback on error
          if (previousStateRef.current) {
            setCombatants(previousStateRef.current.combatants);
          }
          console.error("Failed to update AC:", result.error);
        }
      } catch (error) {
        // Rollback on exception
        if (previousStateRef.current) {
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Error updating AC:", error);
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

  // Optimistic update function for Temporary HP
  const optimisticUpdateTmpHP = useCallback(
    async (combatantId: number, newTmpHP: number) => {
      const opId = `update-tmphp-${combatantId}`;
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      // Update optimistically
      const updatedCombatants = combatants.map((c) =>
        c.id === combatantId ? { ...c, tmpHp: newTmpHP } : c,
      );
      setCombatants(updatedCombatants);

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        // Call server action in background
        const result = await updateCombatantStat(
          combatantId,
          "tmpHp",
          newTmpHP,
          partyCode,
        );

        if (!result.success) {
          // Rollback on error
          if (previousStateRef.current) {
            setCombatants(previousStateRef.current.combatants);
          }
          console.error("Failed to update temporary HP:", result.error);
        }
      } catch (error) {
        // Rollback on exception
        if (previousStateRef.current) {
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Error updating temporary HP:", error);
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

  // Optimistic update function for Initiative
  const optimisticUpdateInitiative = useCallback(
    async (combatantId: number, newInitiative: number) => {
      const opId = `update-initiative-${combatantId}`;
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      // Update optimistically
      const updatedCombatants = combatants.map((c) =>
        c.id === combatantId ? { ...c, initiative: newInitiative } : c,
      );
      setCombatants(updatedCombatants);

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        // Call server action in background
        const result = await updateCombatantStat(
          combatantId,
          "initiative",
          newInitiative,
          partyCode,
        );

        if (!result.success) {
          // Rollback on error
          if (previousStateRef.current) {
            setCombatants(previousStateRef.current.combatants);
          }
          console.error("Failed to update initiative:", result.error);
        }
      } catch (error) {
        // Rollback on exception
        if (previousStateRef.current) {
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Error updating initiative:", error);
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

  // Optimistic update function for Name and Type
  const optimisticUpdateNameType = useCallback(
    async (
      combatantId: number,
      newName: string,
      newType: "player" | "enemy",
    ) => {
      const opId = `update-name-type-${combatantId}`;
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      // Update optimistically
      const updatedCombatants = combatants.map((c) =>
        c.id === combatantId ? { ...c, name: newName, type: newType } : c,
      );
      setCombatants(updatedCombatants);

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        // Call server action in background
        const result = await updateCombatantInfo(
          combatantId,
          { name: newName, type: newType },
          partyCode,
        );

        if (!result.success) {
          // Rollback on error
          if (previousStateRef.current) {
            setCombatants(previousStateRef.current.combatants);
          }
          console.error("Failed to update name/type:", result.error);
        }
      } catch (error) {
        // Rollback on exception
        if (previousStateRef.current) {
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Error updating name/type:", error);
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

  // Optimistic update function for deleting combatant
  const optimisticDeleteCombatant = useCallback(
    async (combatantId: number) => {
      const opId = `delete-combatant-${combatantId}`;
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      // Find the combatant being deleted to calculate new turn index
      const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
      const deletedIndex = sorted.findIndex((c) => c.id === combatantId);

      // Update optimistically - remove combatant
      const updatedCombatants = combatants.filter((c) => c.id !== combatantId);

      // Use pure function to recalculate turn index
      const newTurnIndex = recalculateTurnIndexAfterDeletion(
        currentTurnIndex,
        deletedIndex,
        updatedCombatants.length,
      );

      setCombatants(updatedCombatants);
      setCurrentTurnIndex(newTurnIndex);

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        // Call server action in background
        const result = await deleteCombatant(combatantId, partyCode);

        if (!result.success) {
          // Rollback on error
          if (previousStateRef.current) {
            setCombatants(previousStateRef.current.combatants);
            setCurrentTurnIndex(previousStateRef.current.turnIndex);
            setCurrentRound(previousStateRef.current.round);
          }
          console.error("Failed to delete combatant:", result.error);
        }
      } catch (error) {
        // Rollback on exception
        if (previousStateRef.current) {
          setCombatants(previousStateRef.current.combatants);
          setCurrentTurnIndex(previousStateRef.current.turnIndex);
          setCurrentRound(previousStateRef.current.round);
        }
        console.error("Error deleting combatant:", error);
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

  // Optimistic update function for Conditions
  const optimisticUpdateConditions = useCallback(
    async (combatantId: number, conditions: Condition[]) => {
      const opId = `update-conditions-${combatantId}`;
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      // Update optimistically
      const updatedCombatants = combatants.map((c) =>
        c.id === combatantId ? { ...c, conditions } : c,
      );
      setCombatants(updatedCombatants);

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        // Call server action in background
        const result = await updateCombatantConditions(
          combatantId,
          conditions,
          partyCode,
        );

        if (!result.success) {
          // Rollback on error
          if (previousStateRef.current) {
            setCombatants(previousStateRef.current.combatants);
          }
          console.error("Failed to update conditions:", result.error);
        }
      } catch (error) {
        // Rollback on exception
        if (previousStateRef.current) {
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Error updating conditions:", error);
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

  // Optimistic update function for adding a buff/debuff to combatants
  const optimisticAddBuff = useCallback(
    async (
      combatantIds: number[],
      name: string,
      kind: BuffKind,
      rounds: number,
    ) => {
      const opId = `add-buff-${combatantIds.join("-")}-${Date.now()}`;
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      const newBuff: Buff = {
        id: crypto.randomUUID(),
        name,
        kind,
        remainingRounds: rounds,
      };

      // Update optimistically
      const idSet = new Set(combatantIds);
      setCombatants((prev) =>
        prev.map((c) =>
          idSet.has(c.id) ? { ...c, buffs: [...(c.buffs ?? []), newBuff] } : c,
        ),
      );

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        const result = await addBuffToCombatants(
          partyCode,
          combatantIds,
          name,
          kind,
          rounds,
        );

        if (!result.success) {
          if (previousStateRef.current) {
            setCombatants(previousStateRef.current.combatants);
          }
          console.error("Failed to add buff:", result.error);
        }
      } catch (error) {
        if (previousStateRef.current) {
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Error adding buff:", error);
      } finally {
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

  // Optimistic update function for removing a buff/debuff from a combatant
  const optimisticRemoveBuff = useCallback(
    async (combatantId: number, buffId: string) => {
      const opId = `remove-buff-${combatantId}-${buffId}`;
      if (pendingOperations.has(opId)) return;

      // Save current state for rollback
      previousStateRef.current = {
        turnIndex: currentTurnIndex,
        round: currentRound,
        combatants: combatants,
      };

      // Update optimistically
      setCombatants((prev) =>
        prev.map((c) =>
          c.id === combatantId
            ? { ...c, buffs: (c.buffs ?? []).filter((b) => b.id !== buffId) }
            : c,
        ),
      );

      // Mark operation as pending
      setPendingOperations((prev) => new Set(prev).add(opId));

      try {
        const result = await removeBuffFromCombatant(
          partyCode,
          combatantId,
          buffId,
        );

        if (!result.success) {
          if (previousStateRef.current) {
            setCombatants(previousStateRef.current.combatants);
          }
          console.error("Failed to remove buff:", result.error);
        }
      } catch (error) {
        if (previousStateRef.current) {
          setCombatants(previousStateRef.current.combatants);
        }
        console.error("Error removing buff:", error);
      } finally {
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

  // Fetch the source-of-truth state and merge it into local state. Stable
  // across renders (reads pending ops through a ref) so the subscription effect
  // below never needs to re-subscribe. While an optimistic op is pending only
  // combatants are synced, so other users' stat changes still flow in without
  // clobbering the local turn/round the user just changed.
  const fetchState = useCallback(async () => {
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

      if (pendingOperationsRef.current.size === 0) {
        setCombatants(data.combatants);
        setCurrentTurnIndex(data.currentTurnIndex);
        setCurrentRound(data.currentRound);
      } else {
        setCombatants(data.combatants);
      }
    } catch {
      // Network error — ignore; the next signal or fallback tick will retry.
      console.error("Network error fetching party", partyCode);
    }
  }, [partyCode]);

  useEffect(() => {
    const channelName = `party-${partyCode.toUpperCase()}`;

    // Coalesce bursts of signals into a single fetch.
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleFetch = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void fetchState();
      }, 150);
    };

    // Realtime push: the server signals "updated" → fetch fresh state once.
    // Degrades gracefully to fallback-only sync when Pusher isn't configured.
    const pusher = getPusherClient();
    const channel = pusher?.subscribe(channelName);
    channel?.bind("updated", scheduleFetch);
    // Resiliency: re-sync whenever the socket (re)connects.
    pusher?.connection.bind("connected", scheduleFetch);

    // Low-frequency safety net for missed pushes / Pusher outages.
    timerRef.current = setInterval(() => {
      void fetchState();
    }, fallbackIntervalMs);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (timerRef.current) clearInterval(timerRef.current);
      channel?.unbind("updated", scheduleFetch);
      pusher?.connection.unbind("connected", scheduleFetch);
      pusher?.unsubscribe(channelName);
    };
  }, [partyCode, fallbackIntervalMs, fetchState]);

  return {
    combatants,
    currentTurnIndex,
    currentRound,
    partyName,
    optimisticAdvanceTurn,
    optimisticPreviousTurn,
    optimisticNextRound,
    optimisticSetRound,
    optimisticUpdatePartyName,
    optimisticApplyDamageHeal,
    optimisticUpdateAC,
    optimisticUpdateTmpHP,
    optimisticUpdateInitiative,
    optimisticUpdateNameType,
    optimisticDeleteCombatant,
    optimisticUpdateConditions,
    optimisticAddBuff,
    optimisticRemoveBuff,
  };
}
