import "server-only";
import { db } from "./client";
import { runs, storyOutputs, votes } from "./schema";
import { eq, and, sql, desc, asc, gte, lt } from "drizzle-orm";
import { randomInt } from "node:crypto";
import type { Slot } from "@/lib/utils/randomize-slots";
import type { LengthBucket } from "@/lib/utils/length";
import type { Arena } from "@/lib/arena";

export async function createPendingRun(
  input: Omit<typeof runs.$inferInsert, "status">,
) {
  const [row] = await db.insert(runs).values({ ...input, status: "pending" }).returning();
  return row;
}

export async function markRunComplete(runId: string, totalCostMicroUsd = 0) {
  const [row] = await db
    .update(runs)
    .set({
      status: "complete",
      completedAt: new Date(),
      totalCostMicroUsd: Math.max(0, Math.round(totalCostMicroUsd)),
      failureReason: null,
    })
    .where(eq(runs.id, runId))
    .returning();
  return row;
}

export async function markRunFailed(runId: string, failureReason?: string) {
  const [row] = await db
    .update(runs)
    .set({
      status: "failed",
      completedAt: new Date(),
      failureReason: failureReason?.slice(0, 500) ?? "generation failed",
    })
    .where(eq(runs.id, runId))
    .returning();
  return row;
}

/**
 * Fail pending runs that were abandoned by a crashed function or a client
 * that vanished before the stream closed. Without this, /judge's "waiting"
 * count and the admin dashboard slowly fill with ghost rows.
 */
export async function cleanupStalePendingRuns(olderThanMinutes = 10) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60 * 1000);
  const rows = await db
    .update(runs)
    .set({
      status: "failed",
      completedAt: new Date(),
      failureReason: "stale pending run",
    })
    .where(and(eq(runs.status, "pending"), lt(runs.createdAt, cutoff)))
    .returning({ id: runs.id });
  return rows.length;
}

export async function insertStoryOutputs(rows: (typeof storyOutputs.$inferInsert)[]) {
  return db.insert(storyOutputs).values(rows).returning();
}

/**
 * One round-trip instead of two: fetch the run and its outputs with a left
 * join, then group in memory. A run has at most three outputs.
 */
export async function getRunWithOutputs(runId: string) {
  const rows = await db
    .select()
    .from(runs)
    .leftJoin(storyOutputs, eq(storyOutputs.runId, runs.id))
    .where(eq(runs.id, runId));

  if (rows.length === 0) return null;

  const run = rows[0].runs;
  const outputs = rows
    .flatMap((row) => (row.story_outputs ? [row.story_outputs] : []))
    .sort((a, b) => a.slotLabel.localeCompare(b.slotLabel));

  return { run, outputs };
}

export async function findExistingVote(runId: string, sessionId: string) {
  return db.query.votes.findFirst({
    where: and(eq(votes.runId, runId), eq(votes.sessionId, sessionId)),
  });
}

export async function insertVote(input: typeof votes.$inferInsert) {
  const [row] = await db.insert(votes).values(input).returning();
  return row;
}

/** Arena filter, plus an optional roster filter, for vote aggregates. */
function statsWhere(arena: Arena, rosterId?: string) {
  return rosterId
    ? and(eq(runs.arena, arena), eq(runs.rosterId, rosterId))
    : eq(runs.arena, arena);
}

export async function getAggregateModelStats(
  rosterId?: string,
  arena: Arena = "story",
) {
  return db
    .select({
      modelSlug: votes.chosenModelSlug,
      wins: sql<number>`count(*)::int`,
    })
    .from(votes)
    .innerJoin(runs, eq(runs.id, votes.runId))
    .where(statsWhere(arena, rosterId))
    .groupBy(votes.chosenModelSlug);
}

export async function listRecentRuns(limit = 50) {
  return db.query.runs.findMany({ orderBy: desc(runs.createdAt), limit });
}

export async function getRunStatusCounts() {
  const rows = await db
    .select({
      status: runs.status,
      count: sql<number>`count(*)::int`,
    })
    .from(runs)
    .groupBy(runs.status);
  return rows;
}

/**
 * Pick one random completed run that the given session has NOT already voted
 * on. Used by /judge.
 *
 * Random offset over the filtered set instead of `ORDER BY random()`: the
 * latter sorts every candidate row, which gets expensive as the archive
 * grows. The count is over the same predicate, so the offset is always in
 * range.
 */
export async function getRandomUnvotedRun(
  sessionId: string,
  arena: Arena = "story",
) {
  const where = and(
    eq(runs.status, "complete"),
    eq(runs.arena, arena),
    sql`NOT EXISTS (SELECT 1 FROM ${votes} WHERE ${votes.runId} = ${runs.id} AND ${votes.sessionId} = ${sessionId})`,
  );

  const [countRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(runs)
    .where(where);
  const count = countRow?.count ?? 0;
  if (count === 0) return null;

  const offset = randomInt(0, count);
  const [run] = await db
    .select()
    .from(runs)
    .where(where)
    .orderBy(asc(runs.createdAt))
    .offset(offset)
    .limit(1);

  if (!run) return null;

  const outputs = await db.query.storyOutputs.findMany({
    where: eq(storyOutputs.runId, run.id),
    orderBy: storyOutputs.slotLabel,
  });

  return { run, outputs };
}

/**
 * Find an existing complete run with the same dedupe key that this session
 * has not voted on. Replaying it creates a fresh permalink with a new slot
 * shuffle and costs nothing.
 */
export async function findReplayableRun(
  dedupeKey: string,
  sessionId: string,
) {
  const [candidate] = await db
    .select({ id: runs.id })
    .from(runs)
    .where(
      and(
        eq(runs.status, "complete"),
        eq(runs.dedupeKey, dedupeKey),
        sql`NOT EXISTS (SELECT 1 FROM ${votes} WHERE ${votes.runId} = ${runs.id} AND ${votes.sessionId} = ${sessionId})`,
      ),
    )
    // Prefer the original generation over a replay of a replay.
    .orderBy(asc(runs.isReplay), desc(runs.createdAt))
    .limit(1);

  if (!candidate) return null;
  return getRunWithOutputs(candidate.id);
}

/**
 * Aggregate wins grouped by both the prompt length bucket AND the chosen
 * model. One row per (length, model) combination that has any votes.
 */
export async function getWinsByLength(
  rosterId?: string,
  arena: Arena = "story",
): Promise<Array<{ length: LengthBucket; modelSlug: string; wins: number }>> {
  return db
    .select({
      length: runs.promptLengthBucket,
      modelSlug: votes.chosenModelSlug,
      wins: sql<number>`count(*)::int`,
    })
    .from(votes)
    .innerJoin(runs, eq(runs.id, votes.runId))
    .where(statsWhere(arena, rosterId))
    .groupBy(runs.promptLengthBucket, votes.chosenModelSlug);
}

/**
 * Slot-position distribution — how often each of A / B / C is chosen. Used
 * as a diagnostic on /results and /admin to verify that randomization
 * actually blinds the experiment. If slot A gets disproportionately many
 * votes, there's a position bias in the UI or the shuffler is broken.
 */
export async function getSlotDistribution(
  rosterId?: string,
  arena: Arena = "story",
): Promise<Array<{ slot: Slot; count: number }>> {
  return db
    .select({
      slot: votes.chosenSlot,
      count: sql<number>`count(*)::int`,
    })
    .from(votes)
    .innerJoin(runs, eq(runs.id, votes.runId))
    .where(statsWhere(arena, rosterId))
    .groupBy(votes.chosenSlot);
}

/**
 * Number of runs the given session has voted on (for "you've judged X stories"
 * stats on the /judge page).
 */
export async function countVotesBySession(
  sessionId: string,
  arena: Arena = "story",
): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votes)
    .innerJoin(runs, eq(runs.id, votes.runId))
    .where(and(eq(votes.sessionId, sessionId), eq(runs.arena, arena)));
  return rows[0]?.count ?? 0;
}

/**
 * Total number of completed runs minus the ones this session has voted on.
 * Used to render "12 stories waiting for you" on the judge landing card.
 */
export async function countUnvotedRuns(
  sessionId: string,
  arena: Arena = "story",
): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(runs)
    .where(
      and(
        eq(runs.status, "complete"),
        eq(runs.arena, arena),
        sql`NOT EXISTS (SELECT 1 FROM ${votes} WHERE ${votes.runId} = ${runs.id} AND ${votes.sessionId} = ${sessionId})`,
      ),
    );
  return rows[0]?.count ?? 0;
}

export type SeasonSummary = {
  rosterId: string;
  runs: number;
  votes: number;
  lastRunAt: Date | null;
};

/** Seasons that actually have data, newest first. */
export async function listSeasonSummaries(
  arena: Arena = "story",
): Promise<SeasonSummary[]> {
  return db
    .select({
      rosterId: runs.rosterId,
      runs: sql<number>`count(distinct ${runs.id})::int`,
      votes: sql<number>`count(${votes.id})::int`,
      lastRunAt: sql<Date | null>`max(${runs.createdAt})`,
    })
    .from(runs)
    .leftJoin(votes, eq(votes.runId, runs.id))
    .where(eq(runs.arena, arena))
    .groupBy(runs.rosterId)
    .orderBy(desc(sql`max(${runs.createdAt})`));
}

export type CostSummary = {
  todayMicroUsd: number;
  weekMicroUsd: number;
  monthMicroUsd: number;
  completedRuns: number;
};

/** Spend totals for the admin dashboard. */
export async function getCostSummary(): Promise<CostSummary> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({
      todayMicroUsd: sql<number>`coalesce(sum(case when ${runs.createdAt} >= now() - interval '1 day' then ${runs.totalCostMicroUsd} else 0 end), 0)::float8`,
      weekMicroUsd: sql<number>`coalesce(sum(case when ${runs.createdAt} >= now() - interval '7 days' then ${runs.totalCostMicroUsd} else 0 end), 0)::float8`,
      monthMicroUsd: sql<number>`coalesce(sum(${runs.totalCostMicroUsd}), 0)::float8`,
      completedRuns: sql<number>`count(*) filter (where ${runs.status} = 'complete')::int`,
    })
    .from(runs)
    .where(gte(runs.createdAt, cutoff));

  return (
    row ?? {
      todayMicroUsd: 0,
      weekMicroUsd: 0,
      monthMicroUsd: 0,
      completedRuns: 0,
    }
  );
}
