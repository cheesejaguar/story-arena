import { NextResponse } from "next/server";
import { CreateRunSchema } from "@/lib/utils/validation";
import { getOrCreateSessionId } from "@/lib/security/session";
import { runLimiter } from "@/lib/security/rate-limit";
import { moderatePrompt } from "@/lib/moderation/moderate-prompt";
import { generateBenchmarkStories } from "@/lib/ai/benchmark-run";
import { hashPrompt } from "@/lib/utils/hash";
import { randomizeSlots } from "@/lib/utils/randomize-slots";
import {
  createPendingRun,
  insertStoryOutputs,
  markRunComplete,
  markRunFailed,
} from "@/lib/db/queries";
import { BENCHMARK_MODELS } from "@/lib/ai/models";
import { env } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 300; // Fluid Compute timeout for 3-way LLM fan-out

export async function POST(req: Request) {
  const sessionId = await getOrCreateSessionId();

  const { success } = await runLimiter.limit(sessionId);
  if (!success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateRunSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { prompt, length } = parsed.data;
  const moderation = await moderatePrompt(prompt);
  if (!moderation.allowed) {
    return NextResponse.json(
      { error: moderation.reason ?? "Prompt blocked" },
      { status: 422 },
    );
  }

  const run = await createPendingRun({
    sessionId,
    promptText: prompt,
    promptHash: hashPrompt(prompt),
    promptLengthBucket: length,
    normalizedPrompt: prompt.trim(),
    moderationStatus: "allowed",
    systemPromptVersion: env.SYSTEM_PROMPT_VERSION,
  });

  const benchmark = await generateBenchmarkStories({
    prompt: prompt.trim(),
    length,
    systemPromptVersion: env.SYSTEM_PROMPT_VERSION,
  });

  // Strict benchmark mode: ANY failure fails the entire run.
  if (benchmark.failed.length > 0 || benchmark.results.length !== 3) {
    await markRunFailed(run.id);
    return NextResponse.json(
      { error: "One or more models failed to generate", failed: benchmark.failed },
      { status: 502 },
    );
  }

  const slotted = randomizeSlots(benchmark.results);
  await insertStoryOutputs(
    slotted.map(({ slot, value }) => {
      const meta = BENCHMARK_MODELS.find((m) => m.slug === value.modelSlug);
      if (!meta) {
        // Should be impossible — generateBenchmarkStories only emits known slugs
        throw new Error(`Unknown model slug from generator: ${value.modelSlug}`);
      }
      return {
        runId: run.id,
        provider: meta.provider,
        modelSlug: value.modelSlug,
        internalModelName: meta.label,
        slotLabel: slot,
        outputText: value.outputText,
        tokenInput: value.tokenInput ?? null,
        tokenOutput: value.tokenOutput ?? null,
        latencyMs: value.latencyMs,
        finishReason: value.finishReason ?? null,
        generationStatus: "success",
        fallbackUsed: false,
      };
    }),
  );

  await markRunComplete(run.id);

  return NextResponse.json({
    runId: run.id,
    status: "complete",
    redirectTo: `/compare/${run.id}`,
  });
}
