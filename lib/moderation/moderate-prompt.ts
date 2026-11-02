import { generateText, Output } from "ai";
import { z } from "zod";
import { MODERATION_MODEL, reasoningProviderOptions } from "@/lib/ai/models";
import { redis } from "@/lib/security/redis";
import { hashPrompt } from "@/lib/utils/hash";
import { logger } from "@/lib/utils/logger";

export type ModerationResult = { allowed: boolean; reason?: string };

const Verdict = z.object({
  allowed: z.boolean(),
  reason: z.string().max(200).optional(),
});

const SYSTEM_PROMPT = [
  "You are a safety reviewer for fiction and comedy prompts.",
  "Allow most creative writing and joke prompts, including dark, violent, romantic, edgy, or politically sensitive themes.",
  "Block only prompts that request: sexual content involving minors, instructions for real-world weapons of mass destruction, or targeted harassment of real people.",
  "Default to allowed=true for borderline cases.",
].join(" ");

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

function cacheEnabled(): boolean {
  // Unit tests exercise the SDK path with a mock and must not touch Redis.
  return !process.env.VITEST && process.env.MOCK_AI !== "1";
}

function cacheKey(promptHash: string): string {
  return `sa:moderation:${promptHash}`;
}

async function readCache(promptHash: string): Promise<ModerationResult | null> {
  if (!cacheEnabled()) return null;
  try {
    const raw = await redis.get<string>(cacheKey(promptHash));
    if (!raw) return null;
    return JSON.parse(raw) as ModerationResult;
  } catch {
    return null;
  }
}

async function writeCache(
  promptHash: string,
  verdict: ModerationResult,
): Promise<void> {
  if (!cacheEnabled()) return;
  try {
    await redis.set(cacheKey(promptHash), JSON.stringify(verdict), {
      ex: CACHE_TTL_SECONDS,
    });
  } catch {
    // Cache is an optimization; never block on it.
  }
}

/**
 * Moderate a user-submitted fiction prompt before fan-out to model providers.
 *
 * Behavior:
 * - Length pre-check (cheap, runs before any SDK call):
 *   - < 4 chars  -> rejected ("Prompt too short")
 *   - > 4000 chars -> rejected ("Prompt too long")
 * - Cached verdicts (7 days) avoid re-billing identical prompts.
 * - Otherwise calls the AI Gateway via the AI SDK with structured output to
 *   classify the prompt against a small list of disallowed categories.
 * - Fails OPEN: any error from the SDK returns { allowed: true } so a
 *   moderation outage does not block all traffic.
 *
 * Auth: no static API key. The AI SDK gateway provider auto-resolves the
 * Vercel OIDC token from the environment.
 */
export async function moderatePrompt(
  promptText: string,
): Promise<ModerationResult> {
  const trimmed = promptText.trim();
  if (trimmed.length < 4) {
    return { allowed: false, reason: "Prompt too short" };
  }
  if (trimmed.length > 4000) {
    return { allowed: false, reason: "Prompt too long" };
  }
  if (process.env.MOCK_AI === "1") return { allowed: true };

  const promptHash = hashPrompt(trimmed);
  const cached = await readCache(promptHash);
  if (cached) return cached;

  try {
    const result = await generateText({
      model: MODERATION_MODEL.slug,
      output: Output.object({ schema: Verdict }),
      system: SYSTEM_PROMPT,
      prompt: `Review this creative prompt:\n\n${trimmed}`,
      maxOutputTokens: 200,
      maxRetries: 0,
      timeout: 15_000,
      providerOptions: reasoningProviderOptions(MODERATION_MODEL),
    });
    const verdict = result.output;
    await writeCache(promptHash, verdict);
    return verdict;
  } catch (err) {
    logger.warn({ err: String(err) }, "moderation.failed_open");
    // Fail open: never block traffic on a moderation outage.
    return { allowed: true };
  }
}
