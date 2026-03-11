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
