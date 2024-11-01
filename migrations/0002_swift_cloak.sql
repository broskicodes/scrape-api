CREATE TABLE IF NOT EXISTS "tweets" (
	"tweet_id" bigint PRIMARY KEY NOT NULL,
	"handle_id" bigint NOT NULL,
	"url" text NOT NULL,
	"date" timestamp NOT NULL,
	"bookmark_count" integer NOT NULL,
	"retweet_count" integer NOT NULL,
	"reply_count" integer NOT NULL,
	"like_count" integer NOT NULL,
	"quote_count" integer NOT NULL,
	"view_count" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "twitter_handles" (
	"id" bigint PRIMARY KEY NOT NULL,
	"handle" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "twitter_handles_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"twitter_handle_id" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "tweets" ADD CONSTRAINT "tweets_handle_id_twitter_handles_id_fk" FOREIGN KEY ("handle_id") REFERENCES "public"."twitter_handles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "users" ADD CONSTRAINT "users_twitter_handle_id_twitter_handles_id_fk" FOREIGN KEY ("twitter_handle_id") REFERENCES "public"."twitter_handles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
