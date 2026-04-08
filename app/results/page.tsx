import {
  getAggregateModelStats,
  getSlotDistribution,
  getWinsByLength,
} from "@/lib/db/queries";
import { BENCHMARK_MODELS } from "@/lib/ai/models";
import { wilsonInterval } from "@/lib/utils/stats";
import type { LengthBucket } from "@/lib/utils/length";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // no caching of vote totals

const LENGTHS: LengthBucket[] = ["short", "medium", "long"];
const LENGTH_LABELS: Record<LengthBucket, string> = {
  short: "Brief",
  medium: "Standard",
  long: "Extended",
};

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default async function ResultsPage() {
  const [aggregate, slotDist, winsByLength] = await Promise.all([
    getAggregateModelStats(),
    getSlotDistribution(),
    getWinsByLength(),
  ]);

  const totalVotes = aggregate.reduce((s, r) => s + r.wins, 0);

  // Overall leaderboard with Wilson CIs
  const overall = BENCHMARK_MODELS.map((m) => {
    const wins = aggregate.find((r) => r.modelSlug === m.slug)?.wins ?? 0;
    const ci = wilsonInterval(wins, totalVotes);
    return { slug: m.slug, label: m.label, wins, ...ci };
  }).sort((a, b) => b.center - a.center);

  // Slot distribution — expect ~33% each under a working randomizer
  const slotCounts = new Map(slotDist.map((r) => [r.slot, r.count]));
  const slots = (["A", "B", "C"] as const).map((slot) => ({
    slot,
    count: slotCounts.get(slot) ?? 0,
    share: totalVotes === 0 ? 0 : (slotCounts.get(slot) ?? 0) / totalVotes,
  }));
  // Chi-ish deviation from 33.3% — just the absolute max delta so we can label it.
  const maxSlotDeviation = Math.max(...slots.map((s) => Math.abs(s.share - 1 / 3)));

  // Wins by length bucket × model
  const lengthIndex = new Map<string, number>();
  for (const r of winsByLength) {
    lengthIndex.set(`${r.length}::${r.modelSlug}`, r.wins);
  }
  const totalsByLength = new Map<LengthBucket, number>();
  for (const len of LENGTHS) {
    let t = 0;
    for (const m of BENCHMARK_MODELS) {
      t += lengthIndex.get(`${len}::${m.slug}`) ?? 0;
    }
    totalsByLength.set(len, t);
  }

  return (
    <div className="mx-auto max-w-4xl px-6 pt-16 pb-20">
      {/* ── Masthead ─────────────────────────────────────────────── */}
      <header className="mx-auto mb-14 max-w-2xl text-center">
        <p className="editorial-caps text-ink-muted">⁂ &nbsp; Standings &nbsp; ⁂</p>
        <h1
          className="mt-6 font-display italic font-normal leading-[0.9] tracking-tight text-ink"
          style={{ fontSize: "clamp(3rem, 8vw, 5rem)" }}
        >
          Live results
        </h1>
        <div className="mx-auto mt-8 flex max-w-sm items-center gap-4">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-base leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>
        <p className="mt-6 font-serif text-lg italic text-ink-muted">
          {totalVotes === 0 ? (
            <>No votes yet. Be the first.</>
          ) : (
            <>
              <span className="not-italic text-ink font-medium tabular-nums">
                {totalVotes.toLocaleString()}
              </span>{" "}
              {totalVotes === 1 ? "vote" : "votes"} cast across all prompts.
            </>
          )}
        </p>
      </header>

      {/* ── Overall win share with Wilson CIs ────────────────────── */}
      <section className="mb-16">
        <div className="mb-6 flex items-center gap-4">
          <span className="editorial-caps text-ink-muted">
            <span className="text-oxblood">§</span>&nbsp;&nbsp;Overall win share
          </span>
          <span className="hairline flex-1" />
          <span className="editorial-caps text-ink-faint">95% interval</span>
        </div>

        <ol className="space-y-7">
          {overall.map((m, i) => (
            <li key={m.slug}>
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-ink-faint tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-xl italic text-ink">
                    {m.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-4 font-mono text-xs text-ink-muted tabular-nums">
                  <span>{pct(m.center)}</span>
                  <span className="text-ink tabular-nums">
                    {m.wins.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Bar + Wilson CI bracket */}
              <div className="relative h-4">
                {/* Background */}
                <div className="absolute inset-y-1.5 left-0 right-0 bg-paper-deep" />
                {/* CI range (lighter) */}
                {totalVotes > 0 && (
                  <div
                    className="absolute inset-y-0.5 bg-oxblood/15"
                    style={{
                      left: `${m.lower * 100}%`,
                      width: `${(m.upper - m.lower) * 100}%`,
                    }}
                  />
                )}
                {/* CI bracket lines */}
                {totalVotes > 0 && (
                  <>
                    <span
                      className="absolute top-0 h-full w-[1px] bg-oxblood/60"
                      style={{ left: `${m.lower * 100}%` }}
                      aria-hidden
                    />
                    <span
                      className="absolute top-0 h-full w-[1px] bg-oxblood/60"
                      style={{ left: `${m.upper * 100}%` }}
                      aria-hidden
                    />
                  </>
                )}
                {/* Center marker — a tall thin tick in ink */}
                <span
                  className="absolute top-0 h-full w-[2px] bg-ink"
                  style={{ left: `${m.center * 100}%` }}
                  aria-hidden
                />
              </div>

              {totalVotes > 0 && (
                <div className="mt-1 flex justify-between font-mono text-[10px] text-ink-faint tabular-nums">
                  <span>{pct(m.lower)}</span>
                  <span>{pct(m.upper)}</span>
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* ── By length bucket ─────────────────────────────────────── */}
      <section className="mb-16">
        <div className="mb-6 flex items-center gap-4">
          <span className="editorial-caps text-ink-muted">
            <span className="text-oxblood">§</span>&nbsp;&nbsp;By length
          </span>
          <span className="hairline flex-1" />
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {LENGTHS.map((len) => {
            const lenTotal = totalsByLength.get(len) ?? 0;
            return (
              <div key={len}>
                <div className="mb-3 flex items-baseline justify-between">
                  <p className="editorial-caps text-ink">{LENGTH_LABELS[len]}</p>
                  <p className="font-mono text-xs tabular-nums text-ink-faint">
                    {lenTotal.toLocaleString()}
                  </p>
                </div>
                <div className="space-y-3">
                  {BENCHMARK_MODELS.map((m) => {
                    const wins = lengthIndex.get(`${len}::${m.slug}`) ?? 0;
                    const share = lenTotal === 0 ? 0 : wins / lenTotal;
                    return (
                      <div key={m.slug}>
                        <div className="flex items-baseline justify-between gap-2 text-xs">
                          <span className="font-serif italic text-ink">
                            {m.label}
                          </span>
                          <span className="font-mono tabular-nums text-ink-muted">
                            {pct(share)}
                          </span>
                        </div>
                        <div className="mt-1 h-1 bg-paper-deep">
                          <div
                            className="h-full bg-ink"
                            style={{ width: `${share * 100}%` }}
                            aria-hidden
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Slot-bias diagnostic ─────────────────────────────────── */}
      <section className="mb-16">
        <div className="mb-6 flex items-center gap-4">
          <span className="editorial-caps text-ink-muted">
            <span className="text-oxblood">§</span>&nbsp;&nbsp;Slot bias check
          </span>
          <span className="hairline flex-1" />
          <span
            className={`editorial-caps tabular-nums ${
              totalVotes === 0
                ? "text-ink-faint"
                : maxSlotDeviation < 0.05
                  ? "text-ink-muted"
                  : "text-oxblood"
            }`}
          >
            {totalVotes === 0
              ? "no data"
              : maxSlotDeviation < 0.05
                ? "healthy"
                : `±${pct(maxSlotDeviation)} skew`}
          </span>
        </div>

        <p className="mb-4 font-serif text-sm italic text-ink-muted">
          Under a working randomizer each slot should be chosen about a third
          of the time. A large deviation means the blinding is leaking a
          position bias.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {slots.map((s) => (
            <div key={s.slot}>
              <div className="flex items-baseline justify-between">
                <p className="editorial-caps text-ink">Slot {s.slot}</p>
                <p className="font-mono text-xs tabular-nums text-ink-muted">
                  {pct(s.share)}
                </p>
              </div>
              <div className="mt-2 h-2 bg-paper-deep">
                <div
                  className="h-full bg-ink"
                  style={{ width: `${s.share * 100}%` }}
                  aria-hidden
                />
              </div>
              <p className="mt-1 font-mono text-[10px] tabular-nums text-ink-faint">
                {s.count.toLocaleString()} picks &nbsp;·&nbsp; target 33.3%
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Foot rule ────────────────────────────────────────────── */}
      <div className="mx-auto mt-12 flex max-w-md items-center gap-4">
        <span className="hairline flex-1" />
        <span className="text-oxblood text-xs leading-none">⁂</span>
        <span className="hairline flex-1" />
      </div>
      <p className="mt-4 text-center font-serif text-xs italic text-ink-muted">
        Human preference for fiction — not objective literary quality. Read
        with the caveat on the Colophon.
      </p>
    </div>
  );
}
