DROP INDEX "story_outputs_run_idx";--> statement-breakpoint
DROP INDEX "votes_run_unique";--> statement-breakpoint
ALTER TABLE "runs" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "runs" ADD COLUMN "completed_at" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "story_outputs_run_slot_unique" ON "story_outputs" USING btree ("run_id","slot_label");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_run_session_unique" ON "votes" USING btree ("run_id","session_id");--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_run_slot_fk" FOREIGN KEY ("run_id","chosen_slot") REFERENCES "public"."story_outputs"("run_id","slot_label") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runs" ADD CONSTRAINT "runs_prompt_text_len" CHECK (length(prompt_text) <= 4000);--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_reason_text_len" CHECK (reason_text IS NULL OR length(reason_text) <= 1000);