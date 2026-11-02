import { streamText } from "ai";
import { getSystemPrompt } from "./prompts";
import {
  costMicroUsd,
  getModelBySlug,
  reasoningProviderOptions,
  type BenchmarkModel,
  type ModelSlug,
} from "./models";
import { targetTokensFor, type LengthBucket } from "@/lib/utils/length";
import type { Arena } from "@/lib/arena";
import { estimatePromptTokens } from "@/lib/utils/cost";

export type StoryMeta = {
  modelSlug: ModelSlug;
  outputText: string;
  latencyMs: number;
  tokenInput?: number;
  tokenOutput?: number;
  finishReason?: string;
  /** Actual (or estimated) cost in micro-USD. */
  costMicroUsd: number;
};

export type StoryStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; meta: StoryMeta };

export type GenerateInput = {
  prompt: string;
  modelSlug: ModelSlug;
  length: LengthBucket;
  /** Sizes the output budget; jokes get a much smaller one. Defaults to story. */
  arena?: Arena;
  systemPromptVersion: string;
  /** Cancels the upstream request when the client disconnects. */
  signal?: AbortSignal;
  /** Wall-clock ceiling for one story. */
  timeoutMs?: number;
};

function abortError(): Error {
  const err = new Error("Generation aborted");
  err.name = "AbortError";
  return err;
}

function estimateOutputTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

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
  if (input.signal?.aborted) throw abortError();

  const arena = input.arena ?? "story";

  if (process.env.MOCK_AI === "1") {
    const mockText = arena === "joke"
      ? `I asked *${input.modelSlug.split("/")[1]}* for a punchline. It said the timing was everything, then took forty seconds to answer.`
      : `# The Lighthouse at the Edge

It was a quiet evening when the lighthouse beam first **faltered**. The keeper — *${input.modelSlug.split("/")[1]}* — had spent forty years on the rock and could feel the change in the air before the bulb hissed.

What came next would take three nights to understand.

In the salt-dark between sweeps, she heard a second voice answer her own.`;

    // Simulate streaming in small chunks so the client animation looks real.
    const chunkSize = 18;
    for (let i = 0; i < mockText.length; i += chunkSize) {
      if (input.signal?.aborted) throw abortError();
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
        costMicroUsd: 0,
      },
    };
    return;
  }

  const model = getModelBySlug(input.modelSlug);
  if (!model) throw new Error(`Unknown model slug: ${input.modelSlug}`);

  const t0 = Date.now();
  // No explicit Authorization header — the AI SDK gateway provider auto-resolves
  // VERCEL_OIDC_TOKEN from process.env (auto-injected and auto-rotated by Vercel).
  const result = streamText({
    model: input.modelSlug, // routed via AI Gateway
    system: getSystemPrompt(input.systemPromptVersion),
    prompt: input.prompt,
    // Leave headroom above the prose target for titles and formatting, but
    // never enough to let a runaway reasoning model bill indefinitely.
    maxOutputTokens: Math.ceil(targetTokensFor(arena, input.length) * 1.2) + 200,
    // GPT-5-class reasoning models reject temperature when reasoning is on.
    temperature: model.provider === "openai" ? undefined : 0.9,
    providerOptions: reasoningProviderOptions(model),
    maxRetries: 1,
    abortSignal: input.signal,
    timeout: input.timeoutMs ?? 150_000,
  });

  let accumulated = "";
  for await (const delta of result.textStream) {
    if (input.signal?.aborted) throw abortError();
    accumulated += delta;
    yield { type: "delta", text: delta };
  }

  const [usage, finishReason] = await Promise.all([
    result.usage,
    result.finishReason,
  ]);

  if (input.signal?.aborted) throw abortError();

  // A one-liner can legitimately be short; a story cannot.
  if (accumulated.trim().length < (arena === "joke" ? 10 : 20)) {
    throw new Error("Model returned an empty or near-empty response");
  }
  if (finishReason === "length") {
    throw new Error("Model hit the output token limit before finishing");
  }

  const tokenInput = usage?.inputTokens ?? estimatePromptTokens(input.prompt);
  const tokenOutput = usage?.outputTokens ?? estimateOutputTokens(accumulated);

  yield {
    type: "done",
    meta: {
      modelSlug: input.modelSlug,
      outputText: accumulated,
      latencyMs: Date.now() - t0,
      tokenInput,
      tokenOutput,
      finishReason,
      costMicroUsd: costFor(model, tokenInput, tokenOutput),
    },
  };
}

function costFor(
  model: BenchmarkModel,
  inputTokens: number,
  outputTokens: number,
): number {
  return costMicroUsd(model, inputTokens, outputTokens);
}
