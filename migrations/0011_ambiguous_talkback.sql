CREATE TABLE IF NOT EXISTS "twitter_followers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle_id" bigint NOT NULL,
	"followers" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "twitter_handles" ADD COLUMN "description" text;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "twitter_followers" ADD CONSTRAINT "twitter_followers_handle_id_twitter_handles_id_fk" FOREIGN KEY ("handle_id") REFERENCES "public"."twitter_handles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "twitter_handles" DROP COLUMN IF EXISTS "followers";