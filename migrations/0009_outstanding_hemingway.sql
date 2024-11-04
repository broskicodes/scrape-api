ALTER TABLE "tweets" ADD COLUMN "entities" jsonb DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "twitter_handles" ADD COLUMN "followers" integer DEFAULT 0 NOT NULL;