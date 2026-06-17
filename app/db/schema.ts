import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { Buff } from "../lib/types";

// Definimos el tipo de combatiente
export const typeEnum = pgEnum("type", ["player", "enemy"]);

export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // Código de 6 caracteres
  isActive: boolean("is_active").default(true),
  currentTurnIndex: integer("current_turn_index").default(0).notNull(),
  currentRound: integer("current_round").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const combatants = pgTable("combatants", {
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
  partyId: integer("party_id")
    .references(() => parties.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relaciones para Drizzle Queries
export const partiesRelations = relations(parties, ({ many }) => ({
  combatants: many(combatants),
}));

export const combatantsRelations = relations(combatants, ({ one }) => ({
  party: one(parties, {
    fields: [combatants.partyId],
    references: [parties.id],
  }),
}));
