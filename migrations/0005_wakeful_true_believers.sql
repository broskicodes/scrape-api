ALTER TABLE "users" DROP CONSTRAINT "users_twitter_handle_id_unique";--> statement-breakpoint
ALTER TABLE "tweets" ADD COLUMN "text" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tweets" ADD COLUMN "language" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tweets" ADD COLUMN "is_reply" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "tweets" ADD COLUMN "is_retweet" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "tweets" ADD COLUMN "is_quote" boolean NOT NULL;