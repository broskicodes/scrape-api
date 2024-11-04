CREATE TABLE IF NOT EXISTS "threads" (
	"tweet_id" bigint PRIMARY KEY NOT NULL,
	"parent_tweet_id" bigint NOT NULL,
	"url" text NOT NULL,
	"text" text NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "tweets" ADD COLUMN "is_thread" boolean DEFAULT false NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "threads" ADD CONSTRAINT "threads_parent_tweet_id_tweets_tweet_id_fk" FOREIGN KEY ("parent_tweet_id") REFERENCES "public"."tweets"("tweet_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
