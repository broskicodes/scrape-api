CREATE TABLE IF NOT EXISTS "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle_id" bigint NOT NULL,
	"persona" text NOT NULL,
	"target_audience" text NOT NULL,
	"content_pillars" jsonb NOT NULL,
	"embedding" vector(384),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"deleted_at" timestamp
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "profiles" ADD CONSTRAINT "profiles_handle_id_twitter_handles_id_fk" FOREIGN KEY ("handle_id") REFERENCES "public"."twitter_handles"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
