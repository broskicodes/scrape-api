DO $$ BEGIN
 CREATE TYPE "public"."building_status" AS ENUM('yes', 'no', 'none');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "signups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"twitter" text NOT NULL,
	"email" text NOT NULL,
	"building_status" "building_status" NOT NULL,
	"project_link" text,
	"project_description" text,
	"idea" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
