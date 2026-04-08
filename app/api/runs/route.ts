import { NextResponse } from "next/server";
import { CreateRunSchema } from "@/lib/utils/validation";
import { getOrCreateSessionId } from "@/lib/security/session";
import { runLimiter } from "@/lib/security/rate-limit";
import { moderatePrompt } from "@/lib/moderation/moderate-prompt";
import { streamBenchmarkRun } from "@/lib/ai/benchmark-run";
import { hashPrompt } from "@/lib/utils/hash";
import {
  createPendingRun,
  insertStoryOutputs,
  markRunComplete,
  markRunFailed,
} from "@/lib/db/queries";
import { BENCHMARK_MODELS } from "@/lib/ai/models";
import type { Slot } from "@/lib/utils/randomize-slots";
import { env } from "@/lib/env";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";
export const maxDuration = 300; // Fluid Compute timeout for 3-way LLM fan-out

/**
 * POST /api/runs
 *
 * Kicks off a blinded 3-way benchmark and streams the result as
 * newline-delimited JSON. The client should read the response body
 * line-by-line and dispatch events to the UI.
 *
 * Event shapes (all JSON, one per line):
 *   { "type": "init", "runId": "..." }                    — run created, slot assignment frozen server-side
 *   { "type": "slot_delta", "slot": "A|B|C", "text": "…" } — text chunk for one slot
 *   { "type": "slot_done",  "slot": "A|B|C" }             — that slot finished generating
 *   { "type": "slot_error", "slot": "A|B|C" }             — that slot failed
 *   { "type": "done", "runId": "...", "redirectTo": "/compare/…" } — all persisted
 *   { "type": "error", "error": "..." }                   — terminal failure
 *
 * CRITICAL: the stream NEVER includes model identities per slot. The mapping
 * is only revealed post-vote via POST /api/votes.
 *
 * Non-200 responses (rate limit, validation, moderation) are returned as
 * plain JSON with the usual status codes, so the client can still handle
 * them cleanly before switching into stream mode.
 */
export async function POST(req: Request) {
  const t0 = Date.now();

  const sessionId = await getOrCreateSessionId();

  const { success } = await runLimiter.limit(sessionId);
  if (!success) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429 },
    );
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
  const promptHash = hashPrompt(prompt);
  logger.info({ sessionId, length, promptHash }, "run.created.pending");

  const moderation = await moderatePrompt(prompt);
  if (!moderation.allowed) {
    logger.warn(
      { sessionId, reason: moderation.reason },
      "run.moderation.blocked",
    );
    return NextResponse.json(
      { error: moderation.reason ?? "Prompt blocked" },
      { status: 422 },
    );
  }

  const run = await createPendingRun({
    sessionId,
    promptText: prompt,
    promptHash,
    promptLengthBucket: length,
    normalizedPrompt: prompt.trim(),
    moderationStatus: "allowed",
    systemPromptVersion: env.SYSTEM_PROMPT_VERSION,
  });

  // From here on we stream an NDJSON response back to the client.
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (evt: unknown) => {
        controller.enqueue(encoder.encode(JSON.stringify(evt) + "\n"));
      };

      try {
        send({ type: "init", runId: run.id });

        const generator = streamBenchmarkRun({
          prompt: prompt.trim(),
          length,
          systemPromptVersion: env.SYSTEM_PROMPT_VERSION,
        });

        let result = await generator.next();
        while (!result.done) {
          const evt = result.value;
          if (evt.type === "slot_delta") {
            // Stream raw text chunks straight to the client.
            send({ type: "slot_delta", slot: evt.slot, text: evt.text });
          } else if (evt.type === "slot_done") {
            // Don't leak modelSlug in the per-slot done event — blind until vote.
            send({ type: "slot_done", slot: evt.slot });
          } else if (evt.type === "slot_error") {
            send({ type: "slot_error", slot: evt.slot });
          }
          result = await generator.next();
        }

        const summary = result.value; // BenchmarkStreamResult

        const completedCount = Object.keys(summary.completed).length;
        if (summary.failed.length > 0 || completedCount !== 3) {
          await markRunFailed(run.id);
          logger.error(
            { runId: run.id, failed: summary.failed },
            "run.generation.failed",
          );
          send({
            type: "error",
            error: "One or more models failed to generate",
          });
          return;
        }

        // Persist all three outputs with the slot assignment.
        const rows = (Object.entries(summary.completed) as [
          Slot,
          NonNullable<typeof summary.completed[Slot]>,
        ][]).map(([slot, meta]) => {
          const modelMeta = BENCHMARK_MODELS.find(
            (m) => m.slug === meta.modelSlug,
          );
          if (!modelMeta) {
            throw new Error(
              `Unknown model slug from generator: ${meta.modelSlug}`,
            );
          }
          return {
            runId: run.id,
            provider: modelMeta.provider,
            modelSlug: meta.modelSlug,
            internalModelName: modelMeta.label,
            slotLabel: slot,
            outputText: meta.outputText,
            tokenInput: meta.tokenInput ?? null,
            tokenOutput: meta.tokenOutput ?? null,
            latencyMs: meta.latencyMs,
            finishReason: meta.finishReason ?? null,
            generationStatus: "success",
            fallbackUsed: false,
          };
        });

        await insertStoryOutputs(rows);
        await markRunComplete(run.id);

        logger.info(
          { runId: run.id, latencyMs: Date.now() - t0, results: 3 },
          "run.generation.complete",
        );

        send({
          type: "done",
          runId: run.id,
          redirectTo: `/compare/${run.id}`,
        });
      } catch (err) {
        logger.error({ err: String(err) }, "run.handler.error");
        try {
          await markRunFailed(run.id);
        } catch {
          // Best-effort; log was already emitted.
        }
        send({ type: "error", error: "Internal server error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      // Hint to any proxies (Vercel Functions doesn't need it but harmless)
      "X-Accel-Buffering": "no",
    },
  });
}
