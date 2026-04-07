import { NextResponse } from "next/server";
import { getAggregateModelStats } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET() {
  const rows = await getAggregateModelStats();
  const total = rows.reduce((s, r) => s + r.wins, 0);
  return NextResponse.json({
    total,
    models: rows.map((r) => ({
      modelSlug: r.modelSlug,
      wins: r.wins,
      winRate: total === 0 ? 0 : r.wins / total,
    })),
  });
}
