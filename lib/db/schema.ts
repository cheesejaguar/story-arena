import {
  pgTable, pgEnum, uuid, text, timestamp, integer, boolean, jsonb, index,
} from "drizzle-orm/pg-core";

export const slotEnum = pgEnum("slot_label", ["A", "B", "C"]);
export const runStatusEnum = pgEnum("run_status", ["pending", "complete", "failed"]);
export const lengthEnum = pgEnum("length_bucket", ["short", "medium", "long"]);
export const moderationStatusEnum = pgEnum("moderation_status", ["allowed", "blocked"]);

export const runs = pgTable("runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  sessionId: text("session_id").notNull(),
  promptText: text("prompt_text").notNull(),
  promptHash: text("prompt_hash").notNull(),
  promptLengthBucket: lengthEnum("prompt_length_bucket").notNull(),
  promptGenre: text("prompt_genre"),
  normalizedPrompt: text("normalized_prompt").notNull(),
  moderationStatus: moderationStatusEnum("moderation_status").notNull(),
  systemPromptVersion: text("system_prompt_version").notNull(),
  status: runStatusEnum("status").notNull(),
}, (t) => [
  index("runs_session_idx").on(t.sessionId),
  index("runs_created_idx").on(t.createdAt),
]);

export const storyOutputs = pgTable("story_outputs", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  modelSlug: text("model_slug").notNull(),
  internalModelName: text("internal_model_name").notNull(),
  slotLabel: slotEnum("slot_label").notNull(),
  outputText: text("output_text").notNull(),
  tokenInput: integer("token_input"),
  tokenOutput: integer("token_output"),
  latencyMs: integer("latency_ms").notNull(),
  finishReason: text("finish_reason"),
  generationStatus: text("generation_status").notNull(),
  fallbackUsed: boolean("fallback_used").default(false).notNull(),
  rawResponseJson: jsonb("raw_response_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("story_outputs_run_idx").on(t.runId),
]);

export const votes = pgTable("votes", {
  id: uuid("id").primaryKey().defaultRandom(),
  runId: uuid("run_id").notNull().references(() => runs.id, { onDelete: "cascade" }),
  sessionId: text("session_id").notNull(),
  chosenSlot: slotEnum("chosen_slot").notNull(),
  chosenModelSlug: text("chosen_model_slug").notNull(),
  reasonText: text("reason_text"),
  timeToVoteMs: integer("time_to_vote_ms"),
  allStoriesViewed: boolean("all_stories_viewed").notNull(),
  scrollDepthA: integer("scroll_depth_a"),
  scrollDepthB: integer("scroll_depth_b"),
  scrollDepthC: integer("scroll_depth_c"),
  fraudScore: integer("fraud_score").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("votes_run_unique").on(t.runId, t.sessionId),
  index("votes_model_idx").on(t.chosenModelSlug),
]);
