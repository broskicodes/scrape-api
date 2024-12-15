ALTER TABLE "profiles" ADD COLUMN "writing_style" text DEFAULT '' NOT NULL;--> statement-breakpoint
DROP TYPE "public"."tweet_draft_status";--> statement-breakpoint
CREATE TYPE "public"."tweet_draft_status" AS ENUM('draft', 'scheduled', 'posted');