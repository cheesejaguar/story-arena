import type { ModelRoster } from "@/lib/ai/models";
import { estimateRunCostMicroUsd } from "@/lib/ai/models";
import { targetTokensFor, type LengthBucket } from "./length";
import type { Arena } from "@/lib/arena";

/** Convert integer micro-USD to USD. */
export function microUsdToUsd(micro: number): number {
  return micro / 1_000_000;
}

/** Format micro-USD for the admin / results UI. */
export function formatUsdMicro(micro: number | null | undefined): string {
  if (micro == null) return "—";
  const usd = micro / 1_000_000;
  if (usd === 0) return "$0";
  if (usd < 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(2)}`;
}

/** Rough token estimate for a prompt. English prose averages ~4 chars/token. */
export function estimatePromptTokens(prompt: string): number {
  return Math.ceil(prompt.length / 4) + 300; // + system prompt overhead
}

/**
 * Upper-bound estimate for one three-model run, used to reserve daily spend
 * before generation begins. Deliberately conservative: it assumes the model
 * emits the full target length plus 20% reasoning/formatting headroom.
 */
export function estimateRunCostMicroUsdForPrompt(
  roster: ModelRoster,
  prompt: string,
  length: LengthBucket,
  arena: Arena = "story",
): number {
  const inputTokens = estimatePromptTokens(prompt);
  const outputTokens = Math.ceil(targetTokensFor(arena, length) * 1.2);
  return estimateRunCostMicroUsd(roster, inputTokens, outputTokens);
}
