import { NextResponse } from "next/server";
import { SubmitVoteSchema } from "@/lib/utils/validation";
import { getOrCreateSessionId } from "@/lib/security/session";
import { checkLimit, ipVoteLimiter, voteLimiter } from "@/lib/security/rate-limit";
import { getClientIp, isSameOrigin } from "@/lib/security/request";
import {
  findExistingVote,
  insertVote,
  getRunWithOutputs,
} from "@/lib/db/queries";
import { computeFraudScore } from "@/lib/utils/fraud";
import { invalidateStatsCache } from "@/lib/db/stats-cache";
import { logger } from "@/lib/utils/logger";

export const runtime = "nodejs";

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const candidate = err as { code?: string; cause?: { code?: string } };
  return candidate.code === "23505" || candidate.cause?.code === "23505";
}

export async function POST(req: Request) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
    }

    const sessionId = await getOrCreateSessionId();
    const ip = getClientIp(req);

    const [sessionLimit, ipLimit] = await Promise.all([
      checkLimit(voteLimiter, sessionId),
      checkLimit(ipVoteLimiter, ip),
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

    const parsed = SubmitVoteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const v = parsed.data;
    logger.info({ sessionId, runId: v.runId }, "vote.received");

    const data = await getRunWithOutputs(v.runId);
    if (!data || data.run.status !== "complete") {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    const existing = await findExistingVote(v.runId, sessionId);
    if (existing) {
      logger.info({ sessionId, runId: v.runId }, "vote.duplicate");
      return NextResponse.json({ error: "Already voted" }, { status: 409 });
    }

    const chosen = data.outputs.find((o) => o.slotLabel === v.chosenSlot);
    if (!chosen) {
      logger.warn(
        { sessionId, runId: v.runId, chosenSlot: v.chosenSlot },
        "vote.invalid_slot",
      );
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }

    const fraudScore = computeFraudScore({
      timeToVoteMs: v.timeToVoteMs,
      allStoriesViewed: v.allStoriesViewed,
      scrollDepths: [v.scrollDepthA, v.scrollDepthB, v.scrollDepthC],
    });

    try {
      await insertVote({
        runId: v.runId,
        sessionId,
        chosenSlot: v.chosenSlot,
        chosenModelSlug: chosen.modelSlug,
        reasonText: v.reason ?? null,
        timeToVoteMs: v.timeToVoteMs,
        allStoriesViewed: v.allStoriesViewed,
        scrollDepthA: v.scrollDepthA ?? null,
        scrollDepthB: v.scrollDepthB ?? null,
        scrollDepthC: v.scrollDepthC ?? null,
        fraudScore,
      });
    } catch (err) {
      // Two concurrent tabs can both pass the read check. The unique index is
      // the real guard; translate its violation into the same 409 as a
      // normal duplicate instead of a 500.
      if (isUniqueViolation(err)) {
        logger.info({ sessionId, runId: v.runId }, "vote.duplicate.race");
        return NextResponse.json({ error: "Already voted" }, { status: 409 });
      }
      throw err;
    }

    invalidateStatsCache();

    logger.info(
      {
        sessionId,
        runId: v.runId,
        chosenSlot: v.chosenSlot,
        chosenModelSlug: chosen.modelSlug,
        fraudScore,
      },
      "vote.recorded",
    );

    // Reveal mapping built from the SAME outputs we used for slot lookup.
    const reveal = Object.fromEntries(
      data.outputs.map((o) => [o.slotLabel, o.modelSlug]),
    ) as Record<"A" | "B" | "C", string>;

    return NextResponse.json({ ok: true, reveal });
  } catch (err) {
    logger.error({ err }, "vote.handler.error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
