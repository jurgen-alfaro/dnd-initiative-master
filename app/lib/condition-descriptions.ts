import type { Condition } from "./types";

export const CONDITION_DESCRIPTIONS: Record<Condition, string> = {
  Blinded: `While you have the Blinded condition, you experience the following effects:

Can't See: You can't see and automatically fail any ability check that requires sight.

Attacks Affected: Attack rolls against you have Advantage, and your attack rolls have Disadvantage.`,

  Charmed: `While you have the Charmed condition, you experience the following effects:

Can't Harm the Charmer: You can't attack the charmer or target the charmer with harmful abilities or magical effects.

Social Advantage: The charmer has Advantage on any ability check to interact with you socially.`,

  Deafened: `While you have the Deafened condition, you experience the following effects:

Can't Hear: You can't hear and automatically fail any ability check that requires hearing.`,

  Frightened: `While you have the Frightened condition, you experience the following effects:

Fear Source: You know the location of the source of your fear if it is within line of sight.

Ability Checks and Attacks Affected: You have Disadvantage on ability checks and attack rolls while the source of fear is within line of sight.

Can't Willingly Move Closer: You can't willingly move closer to the source of your fear.`,

  Grappled: `While you have the Grappled condition, you experience the following effects:

Speed 0: Your Speed is 0 and can't increase.

Attacks Affected: You have Disadvantage on attack rolls against any target other than the grappler.

Movable: The condition ends if the grappler is incapacitated or if an effect removes you from the grappler's reach.`,

  Incapacitated: `While you have the Incapacitated condition, you experience the following effects:

Inactive: You can't take any action, Bonus Action, or Reaction.`,

  Invisible: `While you have the Invisible condition, you experience the following effects:

Surprise: If you're hidden when you start your turn during combat, you have Advantage on your first attack roll that turn.

Concealed: You aren't affected by any effect that requires its target to be seen unless the effect's creator can somehow see you. Any equipment you are wearing or carrying is also concealed.

Attacks Affected: Attack rolls against you have Disadvantage, and your attack rolls have Advantage. If a creature can somehow see you, you don't gain this benefit against that creature.`,

  Paralyzed: `While you have the Paralyzed condition, you experience the following effects:

Incapacitated: You have the Incapacitated condition.

Speed 0: Your Speed is 0 and can't increase.

Saving Throws Affected: You automatically fail Strength and Dexterity saving throws.

Attacks Affected: Attack rolls against you have Advantage.

Automatic Critical Hits: Any attack roll that hits you is a Critical Hit if the attacker is within 5 feet of you.`,

  Petrified: `While you have the Petrified condition, you experience the following effects:

Transformed: You are transformed, along with any nonmagical objects you are wearing and carrying, into a solid inanimate substance (usually stone). Your weight increases by a factor of ten, and you cease aging.

Incapacitated: You have the Incapacitated condition.

Speed 0: Your Speed is 0 and can't increase.

Attacks Affected: Attack rolls against you have Advantage.

Saving Throws Affected: You automatically fail Strength and Dexterity saving throws.

Resistance to Damage: You have Resistance to all damage.

Poison Immunity: You are immune to the Poisoned condition.`,

  Poisoned: `While you have the Poisoned condition, you experience the following effects:

Ability Checks and Attacks Affected: You have Disadvantage on attack rolls and ability checks.`,

  Prone: `While you have the Prone condition, you experience the following effects:

Restricted Movement: Your only movement options are to crawl or to spend an amount of movement equal to half your Speed (round down) to right yourself and thereby end the condition. If your Speed is 0, you can't right yourself.

Attacks Affected: You have Disadvantage on attack rolls. An attack roll against you has Advantage if the attacker is within 5 feet of you. Otherwise, that attack roll has Disadvantage.`,

  Restrained: `While you have the Restrained condition, you experience the following effects:

Speed 0: Your Speed is 0 and can't increase.

Attacks Affected: Attack rolls against you have Advantage, and your attack rolls have Disadvantage.

Saving Throws Affected: You have Disadvantage on Dexterity saving throws.`,

  Stunned: `While you have the Stunned condition, you experience the following effects:

Incapacitated: You have the Incapacitated condition.

Saving Throws Affected: You automatically fail Strength and Dexterity saving throws.

Attacks Affected: Attack rolls against you have Advantage.`,

  Unconscious: `While you have the Unconscious condition, you experience the following effects:

Inert: You have the Incapacitated and Prone conditions, and you drop whatever you're holding. When this condition ends, you remain Prone.

Speed 0: Your Speed is 0 and can't increase.

Attacks Affected: Attack rolls against you have Advantage.

Saving Throws Affected: You automatically fail Strength and Dexterity saving throws.

Automatic Critical Hits: Any attack roll that hits you is a Critical Hit if the attacker is within 5 feet of you.

Unaware: You're unaware of your surroundings.`,
};
