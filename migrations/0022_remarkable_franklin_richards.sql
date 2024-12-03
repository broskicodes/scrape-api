ALTER TABLE "users" RENAME COLUMN "twitter_access_token" TO "oauth_token";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "twitter_refresh_token" TO "oauth_token_secret";