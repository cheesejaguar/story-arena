import { describe, expect, it } from "vitest";
import type { LengthBucket } from "@/lib/utils/length";
import {
  REDDIT_SEED_COMPLETED_AT,
  REDDIT_SEED_SESSION_ID,
  REDDIT_SEED_SYSTEM_PROMPT_VERSION,
  buildStoryOutputInserts,
  buildRunInsert,
  getHomepageArchivePrompts,
  validateRedditSeedDataset,
  type RedditSeedRun,
} from "@/lib/seed/reddit-seed";
import { REDDIT_SEEDED_RUNS } from "@/data/reddit-seeded-runs";

const fixture: RedditSeedRun[] = [
  {
    redditId: "abc123",
    redditPermalink: "https://www.reddit.com/r/WritingPrompts/comments/abc123/example/",
    redditTitle: "[WP] The moon sends one voicemail to Earth every century.",
    redditScore: 98765,
    promptText: "The moon sends one voicemail to Earth every century.",
    featured: true,
    promptLengthBucket: "medium" satisfies LengthBucket,
    stories: [
      { slot: "A", modelSlug: "openai/gpt-5.4", text: "OpenAI story" },
      { slot: "B", modelSlug: "anthropic/claude-opus-4.6", text: "Anthropic story" },
      { slot: "C", modelSlug: "google/gemini-3.1-pro-preview", text: "Google story" },
    ],
  },
];

describe("validateRedditSeedDataset", () => {
  it("accepts a well-formed dataset and preserves the 3-slot shape", () => {
    const result = validateRedditSeedDataset(fixture);
    expect(result).toHaveLength(1);
    expect(result[0].stories.map((story) => story.slot)).toEqual(["A", "B", "C"]);
  });

  it("rejects duplicate prompt text", () => {
    expect(() => validateRedditSeedDataset([...fixture, fixture[0]])).toThrow(/duplicate prompt/i);
  });
});

describe("getHomepageArchivePrompts", () => {
  it("returns featured prompts ordered by Reddit score", () => {
    const extra: RedditSeedRun = {
      ...fixture[0],
      redditId: "def456",
      redditTitle: "[WP] Every museum exhibit whispers after closing.",
      promptText: "Every museum exhibit whispers after closing.",
      redditScore: 100,
      featured: false,
    };

    const prompts = getHomepageArchivePrompts([fixture[0], extra], 6);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toMatchObject({
      redditId: "abc123",
      promptText: "The moon sends one voicemail to Earth every century.",
    });
  });
});

describe("buildRunInsert / buildStoryOutputInserts", () => {
  it("creates a stable run insert and matching output rows", () => {
    const runInsert = buildRunInsert(fixture[0]);
    expect(runInsert.sessionId).toBe(REDDIT_SEED_SESSION_ID);
    expect(runInsert.systemPromptVersion).toBe(REDDIT_SEED_SYSTEM_PROMPT_VERSION);
    expect(runInsert.completedAt).toEqual(REDDIT_SEED_COMPLETED_AT);
    expect(runInsert.status).toBe("complete");
    expect(runInsert.moderationStatus).toBe("allowed");

    const outputs = buildStoryOutputInserts("run-1", fixture[0]);
    expect(outputs).toHaveLength(3);
    expect(outputs[0]).toMatchObject({
      runId: "run-1",
      slotLabel: "A",
      provider: "openai",
      modelSlug: "openai/gpt-5.4",
      internalModelName: "GPT-5.4",
      generationStatus: "success",
      finishReason: "seeded",
      fallbackUsed: false,
    });
  });
});

describe("REDDIT_SEEDED_RUNS", () => {
  it("contains 25 unique Reddit-derived runs with 3 stories each", () => {
    const dataset = validateRedditSeedDataset(REDDIT_SEEDED_RUNS);
    expect(dataset).toHaveLength(25);
    expect(dataset.filter((run) => run.featured)).toHaveLength(6);
    expect(new Set(dataset.map((run) => run.redditId)).size).toBe(25);
    expect(dataset.every((run) => run.stories.length === 3)).toBe(true);
  });
});
