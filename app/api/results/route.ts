import { NextResponse } from "next/server";
import { getCachedAggregateModelStats } from "@/lib/db/cached-stats";
import { getRoster } from "@/lib/ai/models";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const seasonParam = new URL(req.url).searchParams.get("season");
  const roster = getRoster(seasonParam);
  const rows = await getCachedAggregateModelStats(roster.id);
  const total = rows.reduce((sum, row) => sum + row.wins, 0);

  return NextResponse.json({
    season: {
      id: roster.id,
      label: roster.label,
      activeFrom: roster.activeFrom,
    },
    total,
    models: roster.models.map((model) => {
      const wins = rows.find((row) => row.modelSlug === model.slug)?.wins ?? 0;
      return {
        modelSlug: model.slug,
        label: model.label,
        wins,
        winRate: total === 0 ? 0 : wins / total,
      };
    }),
  });
}
