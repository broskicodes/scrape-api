ALTER TABLE "twitter_handles" ADD COLUMN "name" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "twitter_handles" ADD COLUMN "verified" boolean DEFAULT false NOT NULL;