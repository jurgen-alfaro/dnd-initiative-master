export type Condition =
  | "Blinded"
  | "Charmed"
  | "Deafened"
  | "Frightened"
  | "Grappled"
  | "Incapacitated"
  | "Invisible"
  | "Paralyzed"
  | "Petrified"
  | "Poisoned"
  | "Prone"
  | "Restrained"
  | "Stunned"
  | "Unconscious";

export const ALL_CONDITIONS: readonly Condition[] = [
  "Blinded",
  "Charmed",
  "Deafened",
  "Frightened",
  "Grappled",
  "Incapacitated",
  "Invisible",
  "Paralyzed",
  "Petrified",
  "Poisoned",
  "Prone",
  "Restrained",
  "Stunned",
  "Unconscious",
] as const;

export type BuffKind = "buff" | "debuff";

export type Buff = {
  id: string; // crypto.randomUUID() — key estable y borrado individual
  name: string;
  kind: BuffKind;
  remainingRounds: number;
};

export type Combatant = {
  id: number;
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  tmpHp: number;
  ac: number;
  type: "player" | "enemy";
  conditions: Condition[];
  buffs: Buff[];
};

export type Party = {
  id: number;
  name: string;
  code: string;
  isActive: boolean | null;
  createdAt: Date;
  currentTurnIndex: number;
  currentRound: number;
  combatants: (Combatant & { partyId: number; createdAt: Date })[];
};

export type RecentPartyData = {
  code: string;
  name: string;
  lastAccessedAt: string; // ISO 8601 timestamp
};

// Summary of a party owned by the DM (includes the dmToken because it is only
// handed to whoever proves ownership via deviceId or recoveryCode).
export type DmParty = {
  code: string;
  name: string;
  dmToken: string;
  createdAt: string; // ISO 8601 timestamp
};

export type NoteVisibility = "public" | "private";

export type Note = {
  id: number;
  content: string;
  visibility: NoteVisibility;
  sessionDate: string; // ISO 8601 timestamp
  createdAt: string; // ISO 8601 timestamp
};
