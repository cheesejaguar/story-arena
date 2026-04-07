import { getAggregateModelStats } from "@/lib/db/queries";
import { BENCHMARK_MODELS } from "@/lib/ai/models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // no caching of vote totals

export default async function ResultsPage() {
  const rows = await getAggregateModelStats();
  const total = rows.reduce((s, r) => s + r.wins, 0);

  // Ensure every benchmark model is represented even with zero wins
  const stats = BENCHMARK_MODELS.map((m) => {
    const row = rows.find((r) => r.modelSlug === m.slug);
    const wins = row?.wins ?? 0;
    return { slug: m.slug, label: m.label, wins, share: total === 0 ? 0 : wins / total };
  }).sort((a, b) => b.wins - a.wins);

  return (
    <div className="mx-auto max-w-2xl px-6 pt-24 pb-12">
      <header className="mb-12 text-center">
        <h1 className="font-serif text-4xl font-light tracking-tight">
          Live results
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {total === 0
            ? "No votes yet. Be the first."
            : `${total.toLocaleString()} votes recorded across all prompts.`}
        </p>
      </header>

      <ol className="space-y-6">
        {stats.map((s, i) => (
          <li key={s.slug} className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <div className="flex items-baseline gap-3">
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-serif text-lg">{s.label}</span>
              </div>
              <div className="flex items-baseline gap-3 font-mono text-sm tabular-nums text-muted-foreground">
                <span>{(s.share * 100).toFixed(1)}%</span>
                <span className="text-foreground">{s.wins.toLocaleString()}</span>
              </div>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-foreground transition-all"
                style={{ width: `${Math.max(s.share * 100, total === 0 ? 0 : 1)}%` }}
                aria-hidden
              />
            </div>
          </li>
        ))}
      </ol>

      <p className="mt-12 text-center text-xs text-muted-foreground">
        Aggregate human preference. Updated in real time.
      </p>
    </div>
  );
}
