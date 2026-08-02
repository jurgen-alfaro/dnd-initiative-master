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

// Consumable ammunition (bolts, arrows, bullets...). Unlike buffs it is not
// tied to the round counter: it only changes when someone spends or restocks it.
export type Ammo = {
  id: string; // crypto.randomUUID() — key estable y borrado individual
  name: string;
  count: number;
  // Quiver capacity. Null when the DM doesn't care about a ceiling.
  max: number | null;
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
  ammo: Ammo[];
  // Prepared but not yet in the fight. Only ever true in the DM's session:
  // players never receive hidden combatants from the server.
  isHidden: boolean;
  // Claim state, derived server-side from the owning device id (which never
  // reaches a client). `claimedByMe` is always false during the server render,
  // which cannot know the device, and becomes accurate on the first fetch.
  isClaimed: boolean;
  claimedByMe: boolean;
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

export type MessageSender = "dm" | "player";

// One message of the private thread between a PC and the DM.
export type ChatMessage = {
  id: number;
  combatantId: number;
  sender: MessageSender;
  body: string;
  createdAt: string; // ISO 8601 timestamp
  readAt: string | null; // ISO 8601 timestamp
};

// One row of the DM's inbox. Bodies are truncated to a preview server-side so
// the full text only ever travels when the thread is actually opened.
export type MessageThreadSummary = {
  combatantId: number;
  combatantName: string;
  unreadCount: number;
  lastMessage: {
    sender: MessageSender;
    preview: string;
    createdAt: string; // ISO 8601 timestamp
  } | null;
};

// Who the server decided the caller is for messaging purposes. "unclaimed" is a
// player device that has not picked a character yet — a valid state, not an error.
export type MessageRole = "dm" | "player" | "unclaimed";
