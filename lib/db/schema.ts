import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  uniqueIndex,
  check,
  foreignKey,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const slotEnum = pgEnum("slot_label", ["A", "B", "C"]);
export const runStatusEnum = pgEnum("run_status", ["pending", "complete", "failed"]);
export const lengthEnum = pgEnum("length_bucket", ["short", "medium", "long"]);
export const moderationStatusEnum = pgEnum("moderation_status", ["allowed", "blocked"]);
export const arenaEnum = pgEnum("arena", ["story", "joke"]);

export const runs = pgTable("runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  sessionId: text("session_id").notNull(),
  /** Which contest this run belongs to. Stats and the Bench filter on it. */
  arena: arenaEnum("arena").notNull().default("story"),
  promptText: text("prompt_text").notNull(),
  promptHash: text("prompt_hash").notNull(),
  promptLengthBucket: lengthEnum("prompt_length_bucket").notNull(),
  promptGenre: text("prompt_genre"),
  normalizedPrompt: text("normalized_prompt").notNull(),
  moderationStatus: moderationStatusEnum("moderation_status").notNull(),
  systemPromptVersion: text("system_prompt_version").notNull(),
  /** Which frozen three-model roster generated this run. */
  rosterId: text("roster_id").notNull().default("legacy-2026-Q2"),
  status: runStatusEnum("status").notNull().default("pending"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  /** Why a failed run failed (provider error, abort, timeout, stale). */
  failureReason: text("failure_reason"),
  /** Hash of prompt + length + roster + prompt version, for safe replay. */
  dedupeKey: text("dedupe_key"),
  /** Original run this one replayed, if any. */
  sourceRunId: uuid("source_run_id"),
  /** Replays reuse existing stories and cost nothing. */
  isReplay: boolean("is_replay").default(false).notNull(),
  /** Actual cost of the three generations, in micro-USD. */
  totalCostMicroUsd: integer("total_cost_micro_usd").default(0).notNull(),
}, (t) => [
  index("runs_session_idx").on(t.sessionId),
  index("runs_created_idx").on(t.createdAt),
  index("runs_status_created_idx").on(t.status, t.createdAt),
  index("runs_roster_created_idx").on(t.rosterId, t.createdAt),
  index("runs_dedupe_idx").on(t.dedupeKey, t.createdAt),
  index("runs_arena_status_created_idx").on(t.arena, t.status, t.createdAt),
  check("runs_prompt_text_len", sql`length(prompt_text) <= 4000`),
  foreignKey({
    columns: [t.sourceRunId],
    foreignColumns: [t.id],
    name: "runs_source_run_fk",
  }).onDelete("set null"),
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
  /** Cost of this individual story, in micro-USD. */
  costMicroUsd: integer("cost_micro_usd").default(0).notNull(),
  rawResponseJson: jsonb("raw_response_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  uniqueIndex("story_outputs_run_slot_unique").on(t.runId, t.slotLabel),
  index("story_outputs_model_idx").on(t.modelSlug),
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
  uniqueIndex("votes_run_session_unique").on(t.runId, t.sessionId),
  index("votes_model_idx").on(t.chosenModelSlug),
  index("votes_session_created_idx").on(t.sessionId, t.createdAt),
  index("votes_created_idx").on(t.createdAt),
  check("votes_reason_text_len", sql`reason_text IS NULL OR length(reason_text) <= 1000`),
  foreignKey({
    columns: [t.runId, t.chosenSlot],
    foreignColumns: [storyOutputs.runId, storyOutputs.slotLabel],
    name: "votes_run_slot_fk",
  }).onDelete("cascade"),
]);
