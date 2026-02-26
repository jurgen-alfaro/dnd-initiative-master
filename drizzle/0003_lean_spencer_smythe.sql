ALTER TABLE "parties" ADD COLUMN "current_turn_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "parties" ADD COLUMN "current_round" integer DEFAULT 1 NOT NULL;