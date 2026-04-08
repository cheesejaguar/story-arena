import "server-only";
import { db } from "./client";
import { runs, storyOutputs, votes } from "./schema";
import { eq, and, sql, desc } from "drizzle-orm";
import type { Slot } from "@/lib/utils/randomize-slots";
import type { LengthBucket } from "@/lib/utils/length";

export async function createPendingRun(
  input: Omit<typeof runs.$inferInsert, "status">,
) {
  const [row] = await db.insert(runs).values({ ...input, status: "pending" }).returning();
  return row;
}

export async function markRunComplete(runId: string) {
  const [row] = await db
    .update(runs)
    .set({ status: "complete", completedAt: new Date() })
    .where(eq(runs.id, runId))
    .returning();
  return row;
}

export async function markRunFailed(runId: string) {
  const [row] = await db
    .update(runs)
    .set({ status: "failed", completedAt: new Date() })
    .where(eq(runs.id, runId))
    .returning();
  return row;
}

export async function insertStoryOutputs(rows: (typeof storyOutputs.$inferInsert)[]) {
  return db.insert(storyOutputs).values(rows).returning();
}

export async function getRunWithOutputs(runId: string) {
  const run = await db.query.runs.findFirst({ where: eq(runs.id, runId) });
  if (!run) return null;
  const outputs = await db.query.storyOutputs.findMany({
    where: eq(storyOutputs.runId, runId),
    orderBy: storyOutputs.slotLabel,
  });
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

export async function getAggregateModelStats() {
  return db
    .select({
      modelSlug: votes.chosenModelSlug,
      wins: sql<number>`count(*)::int`,
    })
    .from(votes)
    .groupBy(votes.chosenModelSlug);
}

export async function listRecentRuns(limit = 50) {
  return db.query.runs.findMany({ orderBy: desc(runs.createdAt), limit });
}

/**
 * Pick one random completed run that the given session has NOT already voted
 * on. Used by /judge. Returns the run + its three story_outputs, or null if
 * the judge has seen everything.
 *
 * `random()` on Postgres is fine at our scale. If the votes table ever grows
 * into millions of rows this should become a `tablesample` approach.
 */
export async function getRandomUnvotedRun(sessionId: string) {
  const row = await db
    .select()
    .from(runs)
    .where(
      and(
        eq(runs.status, "complete"),
        sql`NOT EXISTS (SELECT 1 FROM ${votes} WHERE ${votes.runId} = ${runs.id} AND ${votes.sessionId} = ${sessionId})`,
      ),
    )
    .orderBy(sql`random()`)
    .limit(1);

  if (row.length === 0) return null;

  const outputs = await db.query.storyOutputs.findMany({
    where: eq(storyOutputs.runId, row[0].id),
    orderBy: storyOutputs.slotLabel,
  });

  return { run: row[0], outputs };
}

/**
 * Aggregate wins grouped by both the prompt length bucket AND the chosen
 * model. One row per (length, model) combination that has any votes.
 */
export async function getWinsByLength(): Promise<
  Array<{ length: LengthBucket; modelSlug: string; wins: number }>
> {
  return db
    .select({
      length: runs.promptLengthBucket,
      modelSlug: votes.chosenModelSlug,
      wins: sql<number>`count(*)::int`,
    })
    .from(votes)
    .innerJoin(runs, eq(runs.id, votes.runId))
    .groupBy(runs.promptLengthBucket, votes.chosenModelSlug);
}

/**
 * Slot-position distribution — how often each of A / B / C is chosen. Used
 * as a diagnostic on /results and /admin to verify that randomization
 * actually blinds the experiment. If slot A gets disproportionately many
 * votes, there's a position bias in the UI or the shuffler is broken.
 */
export async function getSlotDistribution(): Promise<
  Array<{ slot: Slot; count: number }>
> {
  return db
    .select({
      slot: votes.chosenSlot,
      count: sql<number>`count(*)::int`,
    })
    .from(votes)
    .groupBy(votes.chosenSlot);
}

/**
 * Number of runs the given session has voted on (for "you've judged X stories"
 * stats on the /judge page).
 */
export async function countVotesBySession(sessionId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(votes)
    .where(eq(votes.sessionId, sessionId));
  return rows[0]?.count ?? 0;
}

/**
 * Total number of completed runs minus the ones this session has voted on.
 * Used to render "12 stories waiting for you" on the judge landing card.
 */
export async function countUnvotedRuns(sessionId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(runs)
    .where(
      and(
        eq(runs.status, "complete"),
        sql`NOT EXISTS (SELECT 1 FROM ${votes} WHERE ${votes.runId} = ${runs.id} AND ${votes.sessionId} = ${sessionId})`,
      ),
    );
  return rows[0]?.count ?? 0;
}
