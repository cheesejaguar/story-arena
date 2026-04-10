import { BENCHMARK_MODELS, type ModelSlug } from "@/lib/ai/models";
import { hashPrompt } from "@/lib/utils/hash";
import type { LengthBucket } from "@/lib/utils/length";
import type { Slot } from "@/lib/utils/randomize-slots";

export type RedditSeedStory = {
  slot: Slot;
  modelSlug: ModelSlug;
  text: string;
};

export type RedditSeedRun = {
  redditId: string;
  redditPermalink: string;
  redditTitle: string;
  redditScore: number;
  promptText: string;
  featured: boolean;
  promptLengthBucket: LengthBucket;
  stories: [RedditSeedStory, RedditSeedStory, RedditSeedStory];
};

export const REDDIT_SEED_SESSION_ID = "seed:reddit:2026-04-10";
export const REDDIT_SEED_SYSTEM_PROMPT_VERSION = "seed:reddit:2026-04-10";
export const REDDIT_SEED_COMPLETED_AT = new Date("2026-04-10T00:00:00.000Z");

const MODEL_INDEX = new Map(BENCHMARK_MODELS.map((model) => [model.slug, model]));

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
      if (!MODEL_INDEX.has(story.modelSlug)) {
        throw new Error(`Unknown model slug in seed run ${run.redditId}: ${story.modelSlug}`);
      }
      if (!story.text.trim()) {
        throw new Error(`Empty story text in seed run ${run.redditId} slot ${story.slot}`);
      }
    }
  }

  return dataset;
}

export function getHomepageArchivePrompts(dataset: RedditSeedRun[], limit = 6) {
  return dataset
    .filter((run) => run.featured)
    .sort((a, b) => b.redditScore - a.redditScore)
    .slice(0, limit)
    .map((run) => ({
      redditId: run.redditId,
      redditPermalink: run.redditPermalink,
      redditTitle: run.redditTitle,
      redditScore: run.redditScore,
      promptText: run.promptText,
    }));
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
    status: "complete" as const,
    completedAt: REDDIT_SEED_COMPLETED_AT,
  };
}

export function buildStoryOutputInserts(runId: string, run: RedditSeedRun) {
  return run.stories.map((story) => {
    const model = MODEL_INDEX.get(story.modelSlug);
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
      rawResponseJson: null,
      createdAt: REDDIT_SEED_COMPLETED_AT,
    };
  });
}
