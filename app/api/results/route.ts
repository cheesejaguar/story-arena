import { NextResponse } from "next/server";
import { getCachedAggregateModelStats } from "@/lib/db/cached-stats";
import { getRoster } from "@/lib/ai/models";
import { parseArena } from "@/lib/arena";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const roster = getRoster(params.get("season"));
  const arena = parseArena(params.get("arena"));
  const rows = await getCachedAggregateModelStats(roster.id, arena);
  const total = rows.reduce((sum, row) => sum + row.wins, 0);

  return NextResponse.json({
    arena,
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
