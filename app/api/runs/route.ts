import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { CreateRunSchema } from "@/lib/utils/validation";
import { getOrCreateSessionId } from "@/lib/security/session";
import {
  acquireRunSlot,
  checkLimit,
  ipRunLimiter,
  releaseRunSlot,
  runLimiter,
} from "@/lib/security/rate-limit";
import { getClientIp, isSameOrigin } from "@/lib/security/request";
import {
  claimRunId,
  clearClaim,
  getClaimedRunId,
} from "@/lib/security/idempotency";
import { moderatePrompt } from "@/lib/moderation/moderate-prompt";
import { streamBenchmarkRun } from "@/lib/ai/benchmark-run";
import { ACTIVE_ROSTER, getModelBySlug } from "@/lib/ai/models";
import {
  reconcileSpend,
  releaseSpend,
  reserveSpend,
} from "@/lib/ai/spend-cap";
import { buildDedupeKey, hashPrompt } from "@/lib/utils/hash";
import { estimateRunCostMicroUsdForPrompt } from "@/lib/utils/cost";
import { randomizeSlots, type Slot } from "@/lib/utils/randomize-slots";
import type { RunStreamEvent } from "@/lib/utils/stream-protocol";
import {
  cleanupStalePendingRuns,
  createPendingRun,
  findReplayableRun,
  getRunWithOutputs,
  insertStoryOutputs,
  markRunComplete,
  markRunFailed,
} from "@/lib/db/queries";
import { env } from "@/lib/env";
import { JOKE_LENGTH_BUCKET, JOKE_SYSTEM_PROMPT_VERSION } from "@/lib/arena";
import { logger } from "@/lib/utils/logger";
import { invalidateStatsCache } from "@/lib/db/stats-cache";

export const runtime = "nodejs";
export const maxDuration = 300; // Fluid Compute timeout for 3-way LLM fan-out

const IDEMPOTENCY_KEY_RE = /^[A-Za-z0-9_-]{1,128}$/;

const encoder = new TextEncoder();

function ndjsonResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}

function replayStream(
  data: NonNullable<Awaited<ReturnType<typeof getRunWithOutputs>>>,
): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (evt: RunStreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(evt) + "\n"));
      };
      send({ type: "init", runId: data.run.id, replay: true });
      for (const output of data.outputs) {
        send({ type: "slot_delta", slot: output.slotLabel, text: output.outputText });
        send({ type: "slot_done", slot: output.slotLabel });
      }
      send({
        type: "done",
        runId: data.run.id,
        redirectTo: `/compare/${data.run.id}`,
        replay: true,
      });
      controller.close();
    },
  });
}

/**
 * POST /api/runs
 *
 * Kicks off a blinded 3-way benchmark and streams the result as
 * newline-delimited JSON. The client reads the response body line-by-line and
 * dispatches events to the UI.
 *
 * Guards, in order:
 *   1. Same-origin check (browser CSRF)
 *   2. Session + IP rate limits
 *   3. Validation and moderation
 *   4. Idempotency key (optional, client-generated)
 *   5. Cross-session replay: identical prompt/length/roster/version reuses
 *      existing stories with a fresh slot shuffle instead of paying again
 *   6. Daily spend cap reservation
 *   7. Global concurrency slot
 *
 * CRITICAL: the stream NEVER includes model identities per slot. The mapping
 * is only revealed post-vote via POST /api/votes.
 */
export async function POST(req: Request) {
  const t0 = Date.now();

  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const sessionId = await getOrCreateSessionId();
  const ip = getClientIp(req);

  const [sessionLimit, ipLimit] = await Promise.all([
    checkLimit(runLimiter, sessionId),
    checkLimit(ipRunLimiter, ip),
  ]);
  if (!sessionLimit.success || !ipLimit.success) {
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

  const { prompt, arena } = parsed.data;
  // Jokes have no length picker and their own versioned system prompt. The
  // version is part of the dedupe key, so a joke never replays a story.
  const length = arena === "joke" ? JOKE_LENGTH_BUCKET : parsed.data.length;
  const systemPromptVersion =
    arena === "joke" ? JOKE_SYSTEM_PROMPT_VERSION : env.SYSTEM_PROMPT_VERSION;
  const promptHash = hashPrompt(prompt);
  const roster = ACTIVE_ROSTER;
  const dedupeKey = buildDedupeKey({
    prompt,
    length,
    rosterId: roster.id,
    systemPromptVersion,
  });

  const rawIdempotencyKey = req.headers.get("idempotency-key");
  const idempotencyKey =
    rawIdempotencyKey && IDEMPOTENCY_KEY_RE.test(rawIdempotencyKey)
      ? rawIdempotencyKey
      : null;

  // A retry of the same browser action returns the same run instead of
  // starting (and paying for) a second generation.
  if (idempotencyKey) {
    const claimed = await getClaimedRunId(sessionId, idempotencyKey);
    if (claimed) {
      const existing = await getRunWithOutputs(claimed);
      if (existing?.run.status === "complete") {
        return ndjsonResponse(replayStream(existing));
      }
      // A missing row means the winning request claimed the key but has not
      // inserted its run yet. Treat it as in-flight instead of clearing the
      // claim, otherwise two retries can both create a run.
      if (!existing || existing.run.status === "pending") {
        return NextResponse.json(
          { error: "This run is already being generated", code: "RUN_IN_PROGRESS" },
          { status: 409 },
        );
      }
      await clearClaim(sessionId, idempotencyKey);
    }
  }

  logger.info({ sessionId, arena, length, promptHash }, "run.created.pending");

  const moderation = await moderatePrompt(prompt);
  if (!moderation.allowed) {
    logger.warn({ sessionId, reason: moderation.reason }, "run.moderation.blocked");
    return NextResponse.json(
      { error: moderation.reason ?? "Prompt blocked" },
      { status: 422 },
    );
  }

  // ── Replay path: identical prompt already generated for another session ──
  const replaySource = await findReplayableRun(dedupeKey, sessionId);
  if (replaySource && replaySource.outputs.length === 3) {
    // Claim the idempotency key before inserting anything so a retry either
    // waits for this replay or returns it — it can never create a duplicate.
    const replayRunId = randomUUID();
    if (idempotencyKey) {
      const claimed = await claimRunId(sessionId, idempotencyKey, replayRunId);
      if (!claimed) {
        const winner = await getClaimedRunId(sessionId, idempotencyKey);
        const existing = winner ? await getRunWithOutputs(winner) : null;
        if (existing?.run.status === "complete") {
          return ndjsonResponse(replayStream(existing));
        }
        return NextResponse.json(
          { error: "This run is already being generated", code: "RUN_IN_PROGRESS" },
          { status: 409 },
        );
      }
    }

    let replayRunCreated = false;
    try {
      const slotted = randomizeSlots([...replaySource.outputs]);
      const run = await createPendingRun({
        id: replayRunId,
        sessionId,
        arena: replaySource.run.arena,
        promptText: prompt,
        promptHash,
        promptLengthBucket: length,
        promptGenre: replaySource.run.promptGenre,
        normalizedPrompt: prompt.trim(),
        moderationStatus: "allowed",
        systemPromptVersion: replaySource.run.systemPromptVersion,
        rosterId: replaySource.run.rosterId,
        dedupeKey,
        sourceRunId: replaySource.run.id,
        isReplay: true,
        totalCostMicroUsd: 0,
      });
      replayRunCreated = true;

      await insertStoryOutputs(
        slotted.map(({ slot, value: source }) => ({
          runId: run.id,
          provider: source.provider,
          modelSlug: source.modelSlug,
          internalModelName: source.internalModelName,
          slotLabel: slot,
          outputText: source.outputText,
          tokenInput: source.tokenInput,
          tokenOutput: source.tokenOutput,
          latencyMs: source.latencyMs,
          finishReason: source.finishReason,
          generationStatus: "replay",
          fallbackUsed: false,
          costMicroUsd: 0,
          rawResponseJson: null,
        })),
      );
      await markRunComplete(run.id, 0);
      const completed = await getRunWithOutputs(run.id);
      if (!completed) throw new Error("replay run disappeared after insert");
      invalidateStatsCache();

      logger.info(
        { runId: run.id, sourceRunId: replaySource.run.id, latencyMs: Date.now() - t0 },
        "run.replayed",
      );

      return ndjsonResponse(
        replayStream({
          run: completed.run,
          outputs: slotted.map(({ slot, value }) => ({ ...value, slotLabel: slot })),
        }),
      );
    } catch (err) {
      // Replay is an optimization. If copying fails, fall through and
      // generate normally rather than failing the request.
      if (replayRunCreated) {
        await markRunFailed(replayRunId, "replay copy failed").catch(() => {});
      }
      if (idempotencyKey) await clearClaim(sessionId, idempotencyKey);
      logger.warn({ err: String(err) }, "run.replay.failed");
    }
  }

  // ── Spend + concurrency gates ─────────────────────────────────────────
  const estimateMicroUsd = estimateRunCostMicroUsdForPrompt(
    roster,
    prompt,
    length,
    arena,
  );
  const spend = await reserveSpend(estimateMicroUsd);
  if (!spend.ok) {
    return NextResponse.json(
      {
        error: "The daily generation budget is exhausted. Try again tomorrow.",
        code: "DAILY_SPEND_CAP",
      },
      { status: 429 },
    );
  }

  const hasSlot = await acquireRunSlot();
  if (!hasSlot) {
    await releaseSpend(spend.reservation);
    return NextResponse.json(
      { error: "The press is at capacity. Try again in a moment.", code: "AT_CAPACITY" },
      { status: 503 },
    );
  }

  // Opportunistic cleanup; never block a user request on it.
  void cleanupStalePendingRuns().catch((err) =>
    logger.warn({ err: String(err) }, "run.cleanup.failed"),
  );

  let run: Awaited<ReturnType<typeof createPendingRun>>;
  try {
    run = await createPendingRun({
      sessionId,
      arena,
      promptText: prompt,
      promptHash,
      promptLengthBucket: length,
      normalizedPrompt: prompt.trim(),
      moderationStatus: "allowed",
      systemPromptVersion,
      rosterId: roster.id,
      dedupeKey,
      sourceRunId: null,
      isReplay: false,
      totalCostMicroUsd: 0,
    });
  } catch (err) {
    await releaseSpend(spend.reservation);
    await releaseRunSlot();
    logger.error({ err: String(err) }, "run.create.failed");
    return NextResponse.json({ error: "Could not create run" }, { status: 500 });
  }

  if (idempotencyKey) {
    const claimed = await claimRunId(sessionId, idempotencyKey, run.id);
    if (!claimed) {
      await markRunFailed(run.id, "idempotency race");
      await releaseSpend(spend.reservation);
      await releaseRunSlot();
      const winner = await getClaimedRunId(sessionId, idempotencyKey);
      const existing = winner ? await getRunWithOutputs(winner) : null;
      if (existing?.run.status === "complete") {
        return ndjsonResponse(replayStream(existing));
      }
      return NextResponse.json(
        { error: "This run is already being generated", code: "RUN_IN_PROGRESS" },
        { status: 409 },
      );
    }
  }

  // From here on we stream an NDJSON response back to the client.
  const abortController = new AbortController();
  const onRequestAbort = () => abortController.abort();
  req.signal.addEventListener("abort", onRequestAbort);

  let spendFinalized = false;
  const finalizeSpend = async (actualMicroUsd?: number) => {
    if (spendFinalized) return;
    spendFinalized = true;
    if (actualMicroUsd == null) await releaseSpend(spend.reservation);
    else await reconcileSpend(spend.reservation, actualMicroUsd);
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (evt: RunStreamEvent) => {
        if (closed || abortController.signal.aborted) return;
        try {
          controller.enqueue(encoder.encode(JSON.stringify(evt) + "\n"));
        } catch {
          // The client vanished and the runtime closed the stream. Stop
          // writing; the run itself may already be persisted.
          closed = true;
        }
      };
      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          // Already cancelled by the client.
        }
      };

      try {
        send({ type: "init", runId: run.id });

        const generator = streamBenchmarkRun({
          prompt: prompt.trim(),
          length,
          arena,
          systemPromptVersion,
          roster,
          signal: abortController.signal,
          timeoutMs: env.GENERATION_TIMEOUT_MS,
        });

        let result = await generator.next();
        while (!result.done) {
          const evt = result.value;
          if (evt.type === "slot_delta") {
            send({ type: "slot_delta", slot: evt.slot, text: evt.text });
          } else if (evt.type === "slot_done") {
            // Don't leak modelSlug in the per-slot done event — blind until vote.
            send({ type: "slot_done", slot: evt.slot });
          } else {
            send({ type: "slot_error", slot: evt.slot });
          }
          result = await generator.next();
        }

        const summary = result.value;

        if (summary.aborted || abortController.signal.aborted) {
          await markRunFailed(run.id, "client disconnected");
          await finalizeSpend();
          logger.info({ runId: run.id, latencyMs: Date.now() - t0 }, "run.aborted");
          return;
        }

        const completedCount = Object.keys(summary.completed).length;
        if (summary.failed.length > 0 || completedCount !== 3) {
          const reason = summary.failed
            .map((f) => `${f.modelSlug}: ${f.error}`)
            .join("; ")
            .slice(0, 500);
          await markRunFailed(run.id, reason || "incomplete generation");
          await finalizeSpend();
          logger.error({ runId: run.id, failed: summary.failed }, "run.generation.failed");
          send({ type: "error", error: "One or more models failed to generate" });
          return;
        }

        // Persist all three outputs with the slot assignment.
        const rows = (
          Object.entries(summary.completed) as [
            Slot,
            NonNullable<typeof summary.completed[Slot]>,
          ][]
        ).map(([slot, meta]) => {
          const modelMeta = getModelBySlug(meta.modelSlug);
          if (!modelMeta) {
            throw new Error(`Unknown model slug from generator: ${meta.modelSlug}`);
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
            costMicroUsd: meta.costMicroUsd ?? 0,
            rawResponseJson: null,
          };
        });

        const totalCostMicroUsd = rows.reduce(
          (sum, row) => sum + row.costMicroUsd,
          0,
        );

        await insertStoryOutputs(rows);
        await markRunComplete(run.id, totalCostMicroUsd);
        await finalizeSpend(totalCostMicroUsd);
        invalidateStatsCache();

        logger.info(
          {
            runId: run.id,
            latencyMs: Date.now() - t0,
            results: 3,
            costMicroUsd: totalCostMicroUsd,
          },
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
          await markRunFailed(run.id, String(err));
        } catch {
          // Best-effort; log was already emitted.
        }
        await finalizeSpend();
        send({ type: "error", error: "Internal server error" });
      } finally {
        req.signal.removeEventListener("abort", onRequestAbort);
        await releaseRunSlot();
        close();
      }
    },
    cancel() {
      abortController.abort();
    },
  });

  return ndjsonResponse(stream);
}
