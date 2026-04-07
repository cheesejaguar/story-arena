import { generateText } from "ai";
import { getSystemPrompt } from "./prompts";
import { lengthToTargetTokens, type LengthBucket } from "@/lib/utils/length";
import type { ModelSlug } from "./models";

export type GeneratedStory = {
  modelSlug: ModelSlug;
  outputText: string;
  latencyMs: number;
  tokenInput?: number;
  tokenOutput?: number;
  finishReason?: string;
};

export type GenerateInput = {
  prompt: string;
  modelSlug: ModelSlug;
  length: LengthBucket;
  systemPromptVersion: string;
};

export async function generateStory(
  input: GenerateInput,
): Promise<GeneratedStory> {
  const t0 = Date.now();
  // No explicit Authorization header — the AI SDK gateway provider auto-resolves
  // VERCEL_OIDC_TOKEN from process.env (auto-injected and auto-rotated by Vercel).
  const result = await generateText({
    model: input.modelSlug, // routed via AI Gateway
    system: getSystemPrompt(input.systemPromptVersion),
    prompt: input.prompt,
    maxOutputTokens: lengthToTargetTokens(input.length),
    temperature: 0.9,
  });
  return {
    modelSlug: input.modelSlug,
    outputText: result.text,
    latencyMs: Date.now() - t0,
    tokenInput: result.usage?.inputTokens,
    tokenOutput: result.usage?.outputTokens,
    finishReason: result.finishReason,
  };
}
