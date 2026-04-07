CREATE TYPE "public"."length_bucket" AS ENUM('short', 'medium', 'long');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('allowed', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."run_status" AS ENUM('pending', 'complete', 'failed');--> statement-breakpoint
CREATE TYPE "public"."slot_label" AS ENUM('A', 'B', 'C');--> statement-breakpoint
CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"session_id" text NOT NULL,
	"prompt_text" text NOT NULL,
	"prompt_hash" text NOT NULL,
	"prompt_length_bucket" "length_bucket" NOT NULL,
	"prompt_genre" text,
	"normalized_prompt" text NOT NULL,
	"moderation_status" "moderation_status" NOT NULL,
	"system_prompt_version" text NOT NULL,
	"status" "run_status" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_outputs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"model_slug" text NOT NULL,
	"internal_model_name" text NOT NULL,
	"slot_label" "slot_label" NOT NULL,
	"output_text" text NOT NULL,
	"token_input" integer,
	"token_output" integer,
	"latency_ms" integer NOT NULL,
	"finish_reason" text,
	"generation_status" text NOT NULL,
	"fallback_used" boolean DEFAULT false NOT NULL,
	"raw_response_json" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"session_id" text NOT NULL,
	"chosen_slot" "slot_label" NOT NULL,
	"chosen_model_slug" text NOT NULL,
	"reason_text" text,
	"time_to_vote_ms" integer,
	"all_stories_viewed" boolean NOT NULL,
	"scroll_depth_a" integer,
	"scroll_depth_b" integer,
	"scroll_depth_c" integer,
	"fraud_score" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "story_outputs" ADD CONSTRAINT "story_outputs_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runs_session_idx" ON "runs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "runs_created_idx" ON "runs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "story_outputs_run_idx" ON "story_outputs" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "votes_run_unique" ON "votes" USING btree ("run_id","session_id");--> statement-breakpoint
CREATE INDEX "votes_model_idx" ON "votes" USING btree ("chosen_model_slug");