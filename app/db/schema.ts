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
import { relations, sql } from "drizzle-orm";
import type { Buff } from "../lib/types";

// Definimos el tipo de combatiente
export const typeEnum = pgEnum("type", ["player", "enemy"]);

// Visibilidad de las notas de sesión: pública (la ven todos los PJ) o
// privada (solo el DM, validado por dmToken en el servidor)
export const visibilityEnum = pgEnum("visibility", ["public", "private"]);

export const parties = pgTable("parties", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // Código de 6 caracteres
  isActive: boolean("is_active").default(true),
  currentTurnIndex: integer("current_turn_index").default(0).notNull(),
  currentRound: integer("current_round").default(1).notNull(),
  // Secreto del DM. Nunca se envía a los clientes; se usa para autorizar la
  // creación de notas y la lectura de notas privadas. El default backfillea
  // las parties existentes al aplicar la migración.
  dmToken: text("dm_token")
    .notNull()
    .default(sql`gen_random_uuid()::text`),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  visibility: visibilityEnum("visibility").notNull().default("public"),
  // Fecha de la sesión a la que pertenece la nota (editable por el DM)
  sessionDate: timestamp("session_date").defaultNow().notNull(),
  partyId: integer("party_id")
    .references(() => parties.id, { onDelete: "cascade" })
    .notNull(),
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
  notes: many(notes),
}));

export const combatantsRelations = relations(combatants, ({ one }) => ({
  party: one(parties, {
    fields: [combatants.partyId],
    references: [parties.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  party: one(parties, {
    fields: [notes.partyId],
    references: [parties.id],
  }),
}));
