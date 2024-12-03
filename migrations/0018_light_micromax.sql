ALTER TABLE "tweet_drafts" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "tweet_drafts" ALTER COLUMN "status" SET DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "tweet_drafts" ADD COLUMN "posted_at" timestamp;--> statement-breakpoint
ALTER TABLE "tweet_drafts" ADD COLUMN "scheduled_for" timestamp;