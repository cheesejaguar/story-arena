import "server-only";
import { db } from "./client";
import { runs, storyOutputs, votes } from "./schema";
import { eq, and, sql, desc } from "drizzle-orm";

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
