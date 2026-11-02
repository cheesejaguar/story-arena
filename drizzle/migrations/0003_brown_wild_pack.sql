CREATE TYPE "public"."arena" AS ENUM('story', 'joke');--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "arena" "arena" DEFAULT 'story' NOT NULL;--> statement-breakpoint
CREATE INDEX "runs_arena_status_created_idx" ON "runs" USING btree ("arena","status","created_at");