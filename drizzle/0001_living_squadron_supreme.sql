ALTER TABLE "combatants" ADD COLUMN "hp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "combatants" ADD COLUMN "tmp_hp" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "combatants" ADD COLUMN "ac" integer DEFAULT 0 NOT NULL;