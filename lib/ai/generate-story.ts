import { streamText } from "ai";
import { getSystemPrompt } from "./prompts";
import { lengthToTargetTokens, type LengthBucket } from "@/lib/utils/length";
import type { ModelSlug } from "./models";

export type StoryMeta = {
  modelSlug: ModelSlug;
  outputText: string;
  latencyMs: number;
  tokenInput?: number;
  tokenOutput?: number;
  finishReason?: string;
};

export type StoryStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; meta: StoryMeta };

export type GenerateInput = {
  prompt: string;
  modelSlug: ModelSlug;
  length: LengthBucket;
  systemPromptVersion: string;
};

/**
 * Stream a single story from one model via Vercel AI Gateway.
 *
 * Yields {type:"delta", text} for each token chunk the provider returns,
 * then a final {type:"done", meta} event once the stream completes.
 *
 * AI SDK v6 `textStream` is text-only — reasoning tokens travel on `fullStream`
 * as typed parts, so we never accidentally leak chain-of-thought here.
 *
 * `MOCK_AI=1` short-circuits this with deterministic canned text streamed in
 * small chunks, so the Playwright happy path doesn't hit real providers.
 */
export async function* generateStoryStream(
  input: GenerateInput,
): AsyncGenerator<StoryStreamEvent, void, void> {
  if (process.env.MOCK_AI === "1") {
    const mockText = `# The Lighthouse at the Edge

It was a quiet evening when the lighthouse beam first **faltered**. The keeper — *${input.modelSlug.split("/")[1]}* — had spent forty years on the rock and could feel the change in the air before the bulb hissed.

What came next would take three nights to understand.

In the salt-dark between sweeps, she heard a second voice answer her own.`;

    // Simulate streaming in small chunks so the client animation looks real.
    const chunkSize = 18;
    for (let i = 0; i < mockText.length; i += chunkSize) {
      yield { type: "delta", text: mockText.slice(i, i + chunkSize) };
      // Tiny delay so React can paint between chunks under Playwright
      await new Promise((r) => setTimeout(r, 3));
    }
    yield {
      type: "done",
      meta: {
        modelSlug: input.modelSlug,
        outputText: mockText,
        latencyMs: 5,
        tokenInput: 10,
        tokenOutput: 80,
        finishReason: "stop",
      },
    };
    return;
  }

  const t0 = Date.now();
  // No explicit Authorization header — the AI SDK gateway provider auto-resolves
  // VERCEL_OIDC_TOKEN from process.env (auto-injected and auto-rotated by Vercel).
  const result = streamText({
    model: input.modelSlug, // routed via AI Gateway
    system: getSystemPrompt(input.systemPromptVersion),
    prompt: input.prompt,
    maxOutputTokens: lengthToTargetTokens(input.length),
    temperature: 0.9,
  });

  let accumulated = "";
  for await (const delta of result.textStream) {
    accumulated += delta;
    yield { type: "delta", text: delta };
  }

  const [usage, finishReason] = await Promise.all([
    result.usage,
    result.finishReason,
  ]);

  yield {
    type: "done",
    meta: {
      modelSlug: input.modelSlug,
      outputText: accumulated,
      latencyMs: Date.now() - t0,
      tokenInput: usage?.inputTokens,
      tokenOutput: usage?.outputTokens,
      finishReason,
    },
  };
}
