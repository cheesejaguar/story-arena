import type { LengthBucket } from "@/lib/utils/length";

/**
 * Client-safe archive types and helpers. Kept separate from reddit-seed.ts
 * so importing the homepage prompt list does not pull in node:crypto (via
 * hashPrompt) or the server-only seed pipeline.
 */
export type RedditPromptRecord = {
  redditId: string;
  redditPermalink: string;
  redditTitle: string;
  redditScore: number;
  promptText: string;
  featured: boolean;
  promptLengthBucket: LengthBucket;
};

export function getHomepageArchivePrompts(
  dataset: RedditPromptRecord[],
  limit = 6,
) {
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
