import { createHash } from "node:crypto";
import type { LengthBucket } from "./length";

/**
 * Canonical prompt normalization used for hashing, dedupe, and moderation
 * caching. We deliberately keep this conservative: trim, collapse runs of
 * whitespace, lowercase. We do not strip punctuation or stopwords, so two
 * genuinely different prompts cannot collide.
 */
export function normalizePrompt(prompt: string): string {
  return prompt.trim().replace(/\s+/g, " ").toLowerCase();
}

export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(normalizePrompt(prompt)).digest("hex");
}

/**
 * Key for cross-session replay. A run is reusable only when the prompt,
 * length, roster, and system prompt version all match.
 */
export function buildDedupeKey(input: {
  prompt: string;
  length: LengthBucket;
  rosterId: string;
  systemPromptVersion: string;
}): string {
  return createHash("sha256")
    .update(
      [
        normalizePrompt(input.prompt),
        input.length,
        input.rosterId,
        input.systemPromptVersion,
      ].join("\u0000"),
    )
    .digest("hex");
}
