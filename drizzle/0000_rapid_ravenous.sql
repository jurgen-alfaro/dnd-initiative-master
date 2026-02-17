CREATE TYPE "public"."type" AS ENUM('player', 'enemy');--> statement-breakpoint
CREATE TABLE "combatants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"initiative" integer DEFAULT 0 NOT NULL,
	"type" "type" DEFAULT 'enemy' NOT NULL,
	"party_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parties" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parties_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "combatants" ADD CONSTRAINT "combatants_party_id_parties_id_fk" FOREIGN KEY ("party_id") REFERENCES "public"."parties"("id") ON DELETE cascade ON UPDATE no action;