import {
  LEGACY_ROSTER_ID,
  MODEL_BY_SLUG,
  type ModelSlug,
} from "@/lib/ai/models";
import { buildDedupeKey, hashPrompt } from "@/lib/utils/hash";
import type { LengthBucket } from "@/lib/utils/length";
import type { Slot } from "@/lib/utils/randomize-slots";
import {
  getHomepageArchivePrompts,
  type RedditPromptRecord,
} from "@/lib/seed/archive";

export type { RedditPromptRecord };
export { getHomepageArchivePrompts };

export type RedditSeedStory = {
  slot: Slot;
  modelSlug: ModelSlug;
  text: string;
};

export type RedditSeedRun = RedditPromptRecord & {
  stories: [RedditSeedStory, RedditSeedStory, RedditSeedStory];
};

export const REDDIT_SEED_SESSION_ID = "seed:reddit:2026-04-10";
export const REDDIT_SEED_SYSTEM_PROMPT_VERSION = "seed:reddit:2026-04-10";
export const REDDIT_SEED_COMPLETED_AT = new Date("2026-04-10T00:00:00.000Z");

export function validateRedditSeedDataset(dataset: RedditSeedRun[]): RedditSeedRun[] {
  const seenPrompts = new Set<string>();

  for (const run of dataset) {
    const normalizedPrompt = run.promptText.trim();
    if (!normalizedPrompt) {
      throw new Error(`Empty prompt in Reddit seed run ${run.redditId}`);
    }
    if (seenPrompts.has(normalizedPrompt)) {
      throw new Error(`Duplicate prompt detected: ${normalizedPrompt}`);
    }
    seenPrompts.add(normalizedPrompt);

    const slots = run.stories.map((story) => story.slot).sort().join("");
    if (slots !== "ABC") {
      throw new Error(`Seed run ${run.redditId} must include exactly slots A, B, and C`);
    }

    for (const story of run.stories) {
      // Validate against the full historical registry, not the active roster:
      // old seed data must keep resolving after a season rotates.
      if (!MODEL_BY_SLUG.has(story.modelSlug)) {
        throw new Error(`Unknown model slug in seed run ${run.redditId}: ${story.modelSlug}`);
      }
      if (!story.text.trim()) {
        throw new Error(`Empty story text in seed run ${run.redditId} slot ${story.slot}`);
      }
    }
  }

  return dataset;
}

export function getSeedLookupKey(promptText: string) {
  const normalizedPrompt = promptText.trim();
  return {
    sessionId: REDDIT_SEED_SESSION_ID,
    promptHash: hashPrompt(normalizedPrompt),
  };
}

export function buildRunInsert(run: RedditSeedRun) {
  const normalizedPrompt = run.promptText.trim();
  return {
    sessionId: REDDIT_SEED_SESSION_ID,
    promptText: run.promptText,
    promptHash: hashPrompt(normalizedPrompt),
    promptLengthBucket: run.promptLengthBucket,
    promptGenre: "reddit-writing-prompts",
    normalizedPrompt,
    moderationStatus: "allowed" as const,
    systemPromptVersion: REDDIT_SEED_SYSTEM_PROMPT_VERSION,
    rosterId: LEGACY_ROSTER_ID,
    status: "complete" as const,
    createdAt: REDDIT_SEED_COMPLETED_AT,
    completedAt: REDDIT_SEED_COMPLETED_AT,
    dedupeKey: buildDedupeKey({
      prompt: normalizedPrompt,
      length: run.promptLengthBucket as LengthBucket,
      rosterId: LEGACY_ROSTER_ID,
      systemPromptVersion: REDDIT_SEED_SYSTEM_PROMPT_VERSION,
    }),
    sourceRunId: null,
    isReplay: false,
    totalCostMicroUsd: 0,
  };
}

export function buildStoryOutputInserts(runId: string, run: RedditSeedRun) {
  return run.stories.map((story) => {
    const model = MODEL_BY_SLUG.get(story.modelSlug);
    if (!model) {
      throw new Error(`Unknown model slug: ${story.modelSlug}`);
    }
    return {
      runId,
      provider: model.provider,
      modelSlug: model.slug,
      internalModelName: model.label,
      slotLabel: story.slot,
      outputText: story.text,
      tokenInput: null,
      tokenOutput: null,
      latencyMs: 1,
      finishReason: "seeded",
      generationStatus: "success",
      fallbackUsed: false,
      costMicroUsd: 0,
      rawResponseJson: null,
      createdAt: REDDIT_SEED_COMPLETED_AT,
    };
  });
}
