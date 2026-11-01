ALTER TABLE "runs" ADD COLUMN "roster_id" text DEFAULT 'legacy-2026-Q2' NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "failure_reason" text;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "source_run_id" uuid;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "is_replay" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "total_cost_micro_usd" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "story_outputs" ADD COLUMN "cost_micro_usd" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_source_run_fk" FOREIGN KEY ("source_run_id") REFERENCES "public"."runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runs_status_created_idx" ON "runs" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "runs_roster_created_idx" ON "runs" USING btree ("roster_id","created_at");--> statement-breakpoint
CREATE INDEX "runs_dedupe_idx" ON "runs" USING btree ("dedupe_key","created_at");--> statement-breakpoint
CREATE INDEX "story_outputs_model_idx" ON "story_outputs" USING btree ("model_slug");--> statement-breakpoint
CREATE INDEX "votes_session_created_idx" ON "votes" USING btree ("session_id","created_at");--> statement-breakpoint
CREATE INDEX "votes_created_idx" ON "votes" USING btree ("created_at");