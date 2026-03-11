/**
 * Pure function: Calculates damage result per D&D 5e rules
 *
 * Rule: Temporary HP absorbs damage first, overflow goes to real HP.
 * HP cannot go below 0.
 *
 * @param currentHp - Current hit points
 * @param currentTmpHp - Current temporary hit points
 * @param damageAmount - Amount of damage to apply (positive number)
 * @returns Updated HP and Tmp HP values
 */
export function calculateDamageResult(
  currentHp: number,
  currentTmpHp: number,
  damageAmount: number,
): { hp: number; tmpHp: number } {
  let newHp = currentHp;
  let newTmpHp = currentTmpHp;

  if (damageAmount > 0) {
    // D&D 5e Rule: Temporary HP absorbs damage first
    if (newTmpHp > 0) {
      if (damageAmount >= newTmpHp) {
        // Damage exceeds temp HP - overflow to real HP
        const overflow = damageAmount - newTmpHp;
        newTmpHp = 0;
        newHp = Math.max(0, newHp - overflow);
      } else {
        // Temp HP absorbs all damage
        newTmpHp -= damageAmount;
      }
    } else {
      // No temp HP - damage goes directly to real HP
      newHp = Math.max(0, newHp - damageAmount);
    }
  }

  return { hp: newHp, tmpHp: newTmpHp };
}

/**
 * Pure function: Calculates healing result per D&D 5e rules
 *
 * Rule: Healing cannot exceed maximum HP.
 * Healing does NOT affect temporary HP.
 *
 * @param currentHp - Current hit points
 * @param maxHp - Maximum hit points
 * @param healAmount - Amount of healing to apply (positive number)
 * @returns Updated HP value (capped at maxHp)
 */
export function calculateHealingResult(
  currentHp: number,
  maxHp: number,
  healAmount: number,
): number {
  return Math.min(maxHp, currentHp + healAmount);
}
