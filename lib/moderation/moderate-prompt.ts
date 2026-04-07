import { generateText, Output } from "ai";
import { z } from "zod";

export type ModerationResult = { allowed: boolean; reason?: string };

const Verdict = z.object({
  allowed: z.boolean(),
  reason: z.string().max(200).optional(),
});

const SYSTEM_PROMPT = [
  "You are a fiction-prompt safety reviewer.",
  "Allow most creative writing prompts, including dark, violent, romantic, or politically sensitive themes.",
  "Block only prompts that request: sexual content involving minors, instructions for real-world weapons of mass destruction, or targeted harassment of real people.",
  "Default to allowed=true for borderline cases.",
].join(" ");

/**
 * Moderate a user-submitted fiction prompt before fan-out to model providers.
 *
 * Behavior:
 * - Length pre-check (cheap, runs before any SDK call):
 *   - < 4 chars  -> rejected ("Prompt too short")
 *   - > 4000 chars -> rejected ("Prompt too long")
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

  try {
    const result = await generateText({
      model: "openai/gpt-5.4",
      output: Output.object({ schema: Verdict }),
      system: SYSTEM_PROMPT,
      prompt: `Review this fiction prompt:\n\n${trimmed}`,
    });
    return result.output;
  } catch {
    // Fail open: never block traffic on a moderation outage.
    return { allowed: true };
  }
}
