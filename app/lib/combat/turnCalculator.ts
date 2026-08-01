type OrderedCombatant = {
  id: number;
  initiative: number;
  isHidden: boolean;
};

/**
 * Pure function: the combatants that actually take part in the fight, in the
 * order they are displayed (initiative, descending).
 *
 * `currentTurnIndex` indexes into THIS list, so client and server must both
 * derive the order through this function or their indexes will drift.
 *
 * @param all - Every combatant of the party, hidden ones included
 * @returns A new array with hidden combatants removed, sorted by initiative
 */
export function visibleInInitiativeOrder<T extends OrderedCombatant>(
  all: T[],
): T[] {
  return all
    .filter((c) => !c.isHidden)
    .sort((a, b) => b.initiative - a.initiative);
}

/**
 * Pure function: Recalculates turn index after combatants were hidden or
 * revealed.
 *
 * Works by identity rather than arithmetic, so it handles hiding and revealing
 * several combatants at once:
 * - The combatant whose turn it was keeps its turn, wherever it ended up
 * - If that combatant was the one hidden, the turn passes to whoever now
 *   occupies its slot (same rule as deleting the active combatant)
 *
 * @param previousVisibleIds - Visible combatant ids, in order, before the change
 * @param nextVisibleIds - Visible combatant ids, in order, after the change
 * @param currentTurnIndex - Turn index before the change
 * @returns New turn index
 */
export function recalculateTurnIndexAfterVisibilityChange(
  previousVisibleIds: number[],
  nextVisibleIds: number[],
  currentTurnIndex: number,
): number {
  if (nextVisibleIds.length === 0) {
    return 0;
  }

  const activeId = previousVisibleIds[currentTurnIndex];
  const nextIndex = nextVisibleIds.indexOf(activeId);

  // The active combatant is still in the fight — follow it to its new slot.
  if (nextIndex !== -1) {
    return nextIndex;
  }

  // It was hidden: keep the slot, capped to the shorter list.
  return Math.max(0, Math.min(currentTurnIndex, nextVisibleIds.length - 1));
}

/**
 * Pure function: Recalculates turn index after deleting a combatant
 *
 * Rules:
 * - If no combatants remain, index is 0
 * - If deleted combatant is before current turn, shift index back
 * - If deleted combatant is the current turn, keep index (or cap at max)
 * - If deleted combatant is after current turn, index unchanged
 *
 * @param currentTurnIndex - Current turn index before deletion
 * @param deletedIndex - Index of the combatant being deleted
 * @param totalCombatantsAfterDeletion - Total combatants AFTER deletion
 * @returns New turn index
 */
export function recalculateTurnIndexAfterDeletion(
  currentTurnIndex: number,
  deletedIndex: number,
  totalCombatantsAfterDeletion: number,
): number {
  // No combatants left
  if (totalCombatantsAfterDeletion === 0) {
    return 0;
  }

  // Deleted combatant was before current turn - shift back
  if (deletedIndex < currentTurnIndex) {
    return currentTurnIndex - 1;
  }

  // Deleted combatant was the current turn - stay at same index (or cap)
  if (deletedIndex === currentTurnIndex) {
    return Math.min(currentTurnIndex, totalCombatantsAfterDeletion - 1);
  }

  // Deleted combatant was after current turn - no change
  return currentTurnIndex;
}
