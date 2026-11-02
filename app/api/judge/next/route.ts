import { NextResponse } from "next/server";
import { getOrCreateSessionId } from "@/lib/security/session";
import {
  countUnvotedRuns,
  countVotesBySession,
  getRandomUnvotedRun,
} from "@/lib/db/queries";
import { logger } from "@/lib/utils/logger";
import { parseArena } from "@/lib/arena";

export const runtime = "nodejs";

/**
 * GET /api/judge/next[?arena=joke]
 *
 * Returns one random completed run that the current session has NOT already
 * voted on, plus lightweight stats for the judge UI. The payload is BLINDED:
 * no model identities, no provider, no internal names — just slot + text.
 *
 * Response shape:
 *   { run: { id, prompt, length, stories: [{slot, text}] }, stats: { votedByYou, remaining } }
 *   OR
 *   { run: null, stats: { votedByYou, remaining } } — if there's nothing to judge
 */
export async function GET(req: Request) {
  try {
    const sessionId = await getOrCreateSessionId();
    const arena = parseArena(new URL(req.url).searchParams.get("arena"));

    // Fetch in parallel: the next run AND the session's cumulative stats
    const [data, votedByYou, remaining] = await Promise.all([
      getRandomUnvotedRun(sessionId, arena),
      countVotesBySession(sessionId, arena),
      countUnvotedRuns(sessionId, arena),
    ]);

    if (!data) {
      return NextResponse.json({
        run: null,
        stats: { votedByYou, remaining: 0 },
      });
    }

    return NextResponse.json({
      run: {
        id: data.run.id,
        prompt: data.run.promptText,
        length: data.run.promptLengthBucket,
        stories: data.outputs
          .map((o) => ({ slot: o.slotLabel, text: o.outputText }))
          .sort((a, b) => a.slot.localeCompare(b.slot)),
      },
      stats: {
        votedByYou,
        // `remaining` already includes this run, so the count the UI shows
        // should decrement after the user votes — that's handled client-side.
        remaining,
      },
    });
  } catch (err) {
    logger.error({ err: String(err) }, "judge.next.error");
    return NextResponse.json(
      { error: "Failed to fetch next story" },
      { status: 500 },
    );
  }
}
