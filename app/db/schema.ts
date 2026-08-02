import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { Ammo, Buff } from "../lib/types";

// Combatant type
export const typeEnum = pgEnum("type", ["player", "enemy"]);

// Session note visibility: public (visible to all PCs) or
// private (DM only, validated by dmToken on the server)
export const visibilityEnum = pgEnum("visibility", ["public", "private"]);

// Who wrote a direct message: the party's DM or the player who claimed the PC.
// The side is decided server-side from the proof of identity, never from the
// client's payload.
export const messageSenderEnum = pgEnum("message_sender", ["dm", "player"]);

// Portable DM identity. Not real auth: the DM is identified by devices
// (dm_devices) and can be recovered on another device with recoveryCode.
export const dungeonMasters = pgTable("dungeon_masters", {
  id: serial("id").primaryKey(),
  // Human-readable secret to recover the identity on another device.
  recoveryCode: text("recovery_code")
    .notNull()
    .unique()
    .default(sql`gen_random_uuid()::text`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Devices linked to a DM (1 DM → N devices).
export const dmDevices = pgTable("dm_devices", {
  id: serial("id").primaryKey(),
  // Random UUID stored in the device's localStorage.
  deviceId: text("device_id").notNull().unique(),
  dmId: integer("dm_id")
    .references(() => dungeonMasters.id, { onDelete: "cascade" })
    .notNull(),
  // Cosmetic label derived from the userAgent (Android/iPhone/Mac/...).
  label: text("label"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // 6-character code
  isActive: boolean("is_active").default(true),
  currentTurnIndex: integer("current_turn_index").default(0).notNull(),
  currentRound: integer("current_round").default(1).notNull(),
  // DM secret. Never sent to clients; used to authorize note creation and
  // reading private notes. The default backfills existing parties when the
  // migration is applied.
  dmToken: text("dm_token")
    .notNull()
    .default(sql`gen_random_uuid()::text`),
  // Party owner. Nullable so parties created before this feature keep working
  // (they simply don't show up in any DM's list).
  dmId: integer("dm_id").references(() => dungeonMasters.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  visibility: visibilityEnum("visibility").notNull().default("public"),
  // Date of the session the note belongs to (editable by the DM)
  sessionDate: timestamp("session_date").defaultNow().notNull(),
  partyId: integer("party_id")
    .references(() => parties.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const combatants = pgTable(
  "combatants",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    initiative: integer("initiative").notNull().default(0),
    type: typeEnum("type").notNull().default("enemy"),
    hp: integer("hp").notNull().default(0),
    maxHp: integer("max_hp").notNull().default(0),
    tmpHp: integer("tmp_hp").notNull().default(0),
    ac: integer("ac").notNull().default(0),
    conditions: text("conditions").array().notNull().default([]),
    buffs: jsonb("buffs").$type<Buff[]>().notNull().default([]),
    // Consumable ammunition. Kept apart from buffs because it never expires with
    // the round counter — it only moves when spent or restocked.
    ammo: jsonb("ammo").$type<Ammo[]>().notNull().default([]),
    // Combatants the DM prepared in advance but has not brought into the fight
    // yet. Hidden combatants are never sent to players and are excluded from the
    // initiative order, so they don't consume a turn.
    isHidden: boolean("is_hidden").notNull().default(false),
    // The player device that owns this PC. It is the sole key to the PC's
    // private thread with the DM, so it must never leave the server: payloads
    // expose only the booleans derived from it. Null means "up for grabs".
    claimedByDeviceId: text("claimed_by_device_id"),
    claimedAt: timestamp("claimed_at"),
    partyId: integer("party_id")
      .references(() => parties.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    // A device owns at most one PC per party. Postgres treats NULLs as
    // distinct, so unclaimed combatants are unaffected by this constraint.
    uniqueIndex("combatants_party_claim_unique").on(
      t.partyId,
      t.claimedByDeviceId,
    ),
  ],
);

// Private 1:1 thread between the DM and the player who claimed a PC. The
// combatant is the thread key: history follows the character rather than the
// device, so a player who switches phones keeps the conversation.
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    // Denormalized from the combatant so retention sweeps and party-wide
    // aggregates never need a join.
    partyId: integer("party_id")
      .references(() => parties.id, { onDelete: "cascade" })
      .notNull(),
    combatantId: integer("combatant_id")
      .references(() => combatants.id, { onDelete: "cascade" })
      .notNull(),
    sender: messageSenderEnum("sender").notNull(),
    body: text("body").notNull(),
    // Device that wrote it. Kept for support/debugging only; never sent to any
    // client. Null when the sender was the DM on an unidentified browser.
    senderDeviceId: text("sender_device_id"),
    // Set when the *other* side reads the thread. A single column is enough
    // because the thread has exactly two participants.
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("messages_thread_created_idx").on(t.combatantId, t.createdAt),
    index("messages_party_created_idx").on(t.partyId, t.createdAt),
  ],
);

// Relations for Drizzle Queries
export const dungeonMastersRelations = relations(
  dungeonMasters,
  ({ many }) => ({
    devices: many(dmDevices),
    parties: many(parties),
  }),
);

export const dmDevicesRelations = relations(dmDevices, ({ one }) => ({
  dm: one(dungeonMasters, {
    fields: [dmDevices.dmId],
    references: [dungeonMasters.id],
  }),
}));

export const partiesRelations = relations(parties, ({ one, many }) => ({
  combatants: many(combatants),
  notes: many(notes),
  messages: many(messages),
  dm: one(dungeonMasters, {
    fields: [parties.dmId],
    references: [dungeonMasters.id],
  }),
}));

export const combatantsRelations = relations(combatants, ({ one, many }) => ({
  party: one(parties, {
    fields: [combatants.partyId],
    references: [parties.id],
  }),
  messages: many(messages),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  party: one(parties, {
    fields: [notes.partyId],
    references: [parties.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  party: one(parties, {
    fields: [messages.partyId],
    references: [parties.id],
  }),
  combatant: one(combatants, {
    fields: [messages.combatantId],
    references: [combatants.id],
  }),
}));
