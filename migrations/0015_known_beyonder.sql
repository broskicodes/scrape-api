CREATE TABLE IF NOT EXISTS "freeloaders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"handle" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "freeloaders_handle_unique" UNIQUE("handle")
);
