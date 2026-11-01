import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/security/admin-auth";
import {
  getCachedAggregateModelStats,
  getCachedCostSummary,
  getCachedSeasonSummaries,
} from "@/lib/db/cached-stats";
import { ACTIVE_ROSTER } from "@/lib/ai/models";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [stats, cost, seasons] = await Promise.all([
    getCachedAggregateModelStats(ACTIVE_ROSTER.id),
    getCachedCostSummary(),
    getCachedSeasonSummaries(),
  ]);

  return NextResponse.json({
    season: ACTIVE_ROSTER.id,
    stats,
    cost,
    seasons,
  });
}
