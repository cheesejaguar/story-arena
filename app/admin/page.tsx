import Link from "next/link";
import { isAdmin } from "@/lib/security/admin-auth";
import {
  getAggregateModelStats,
  getSlotDistribution,
  getWinsByLength,
  listRecentRuns,
} from "@/lib/db/queries";
import { BENCHMARK_MODELS } from "@/lib/ai/models";
import { wilsonInterval } from "@/lib/utils/stats";
import type { LengthBucket } from "@/lib/utils/length";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LENGTHS: LengthBucket[] = ["short", "medium", "long"];
const LENGTH_LABELS: Record<LengthBucket, string> = {
  short: "Brief",
  medium: "Standard",
  long: "Extended",
};

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

type AdminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const authed = await isAdmin();
  const params = await searchParams;

  // ── Unauthed: editorial sign-in ──────────────────────────────────
  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-6 pt-32">
        <div className="mx-auto mb-6 flex max-w-xs items-center gap-4">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-sm leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>
        <p className="text-center editorial-caps text-ink-muted">
          The Editor&apos;s Desk
        </p>
        <h1 className="mt-4 text-center font-display text-4xl italic text-ink">
          Sign in
        </h1>
        <form method="POST" action="/admin/login" className="mt-10 space-y-6">
          <div>
            <label
              htmlFor="secret"
              className="block editorial-caps text-ink-muted"
            >
              Admin secret
            </label>
            <input
              id="secret"
              name="secret"
              type="password"
              autoComplete="off"
              required
              className="mt-3 block w-full border-0 border-y border-ink/70 bg-transparent px-0 py-3 font-mono text-sm text-ink placeholder:text-ink-faint focus:border-oxblood focus:outline-none focus:ring-0"
            />
          </div>
          {params.error && (
            <p className="font-serif text-sm italic text-oxblood">
              Incorrect secret. Try again.
            </p>
          )}
          <button
            type="submit"
            className="w-full rounded-none border border-ink bg-ink py-4 font-display text-base italic text-paper transition-colors hover:bg-oxblood-deep hover:border-oxblood-deep"
          >
            <span className="editorial-caps mr-3 text-paper/60">
              Sign in
            </span>
            <span className="text-lg not-italic">→</span>
          </button>
        </form>
      </div>
    );
  }

  // ── Authed: dashboard ────────────────────────────────────────────
  const [aggregate, slotDist, winsByLength, runs] = await Promise.all([
    getAggregateModelStats(),
    getSlotDistribution(),
    getWinsByLength(),
    listRecentRuns(100),
  ]);

  const totalVotes = aggregate.reduce((s, r) => s + r.wins, 0);
  const failedCount = runs.filter((r) => r.status === "failed").length;
  const completeCount = runs.filter((r) => r.status === "complete").length;

  const overall = BENCHMARK_MODELS.map((m) => {
    const wins = aggregate.find((r) => r.modelSlug === m.slug)?.wins ?? 0;
    const ci = wilsonInterval(wins, totalVotes);
    return { slug: m.slug, label: m.label, wins, ...ci };
  }).sort((a, b) => b.center - a.center);

  const slotCounts = new Map(slotDist.map((r) => [r.slot, r.count]));
  const slots = (["A", "B", "C"] as const).map((slot) => ({
    slot,
    count: slotCounts.get(slot) ?? 0,
    share: totalVotes === 0 ? 0 : (slotCounts.get(slot) ?? 0) / totalVotes,
  }));
  const maxSlotDeviation = Math.max(
    ...slots.map((s) => Math.abs(s.share - 1 / 3)),
  );

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
    <div className="mx-auto max-w-6xl px-6 pt-12 pb-20">
      <header className="mb-12">
        <p className="editorial-caps text-ink-muted">⁂ &nbsp; Editor&apos;s Desk</p>
        <h1 className="mt-3 font-display text-4xl italic text-ink">Admin</h1>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs tabular-nums text-ink-muted">
          <span>
            <span className="text-ink">{totalVotes.toLocaleString()}</span> votes
          </span>
          <span>
            <span className="text-ink">{completeCount.toLocaleString()}</span>{" "}
            complete
          </span>
          <span>
            <span className={failedCount > 0 ? "text-oxblood" : "text-ink"}>
              {failedCount.toLocaleString()}
            </span>{" "}
            failed
          </span>
          <span>
            <span className="text-ink">{runs.length}</span> recent runs
          </span>
        </div>
      </header>

      {/* ── Win share w/ CIs ─────────────────────────────────────── */}
      <section className="mb-14">
        <div className="mb-5 flex items-center gap-4">
          <span className="editorial-caps text-ink-muted">
            <span className="text-oxblood">§</span>&nbsp;&nbsp;Overall win share
          </span>
          <span className="hairline flex-1" />
          <span className="editorial-caps text-ink-faint">95% interval</span>
        </div>

        <ol className="space-y-6">
          {overall.map((m, i) => (
            <li key={m.slug}>
              <div className="mb-2 flex items-baseline justify-between gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-xs text-ink-faint tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-lg italic text-ink">
                    {m.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-4 font-mono text-xs text-ink-muted tabular-nums">
                  <span>{pct(m.center)}</span>
                  <span className="text-ink">{m.wins.toLocaleString()}</span>
                </div>
              </div>
              <div className="relative h-4">
                <div className="absolute inset-y-1.5 left-0 right-0 bg-paper-deep" />
                {totalVotes > 0 && (
                  <div
                    className="absolute inset-y-0.5 bg-oxblood/15"
                    style={{
                      left: `${m.lower * 100}%`,
                      width: `${(m.upper - m.lower) * 100}%`,
                    }}
                  />
                )}
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
                <span
                  className="absolute top-0 h-full w-[2px] bg-ink"
                  style={{ left: `${m.center * 100}%` }}
                  aria-hidden
                />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ── By length ────────────────────────────────────────────── */}
      <section className="mb-14">
        <div className="mb-5 flex items-center gap-4">
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
                  <p className="editorial-caps text-ink">
                    {LENGTH_LABELS[len]}
                  </p>
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

      {/* ── Slot bias ────────────────────────────────────────────── */}
      <section className="mb-14">
        <div className="mb-5 flex items-center gap-4">
          <span className="editorial-caps text-ink-muted">
            <span className="text-oxblood">§</span>&nbsp;&nbsp;Slot bias
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
                {s.count.toLocaleString()} picks
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Recent runs ──────────────────────────────────────────── */}
      <section>
        <div className="mb-5 flex items-center gap-4">
          <span className="editorial-caps text-ink-muted">
            <span className="text-oxblood">§</span>&nbsp;&nbsp;Recent runs
          </span>
          <span className="hairline flex-1" />
        </div>

        <div className="border-t border-b border-rule">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-rule/60">
                <th className="py-3 text-left editorial-caps text-ink-muted">
                  When
                </th>
                <th className="py-3 text-left editorial-caps text-ink-muted">
                  Status
                </th>
                <th className="py-3 text-left editorial-caps text-ink-muted">
                  Length
                </th>
                <th className="py-3 text-left editorial-caps text-ink-muted">
                  Prompt
                </th>
                <th className="py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule/40">
              {runs.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center font-serif italic text-ink-muted"
                  >
                    No runs yet.
                  </td>
                </tr>
              )}
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap py-3 pr-4 font-mono text-[11px] tabular-nums text-ink-muted">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-ink-muted">
                    <span
                      className={
                        r.status === "failed"
                          ? "text-oxblood"
                          : r.status === "complete"
                            ? "text-ink"
                            : "text-ink-faint"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-mono text-[11px] text-ink-muted">
                    {r.promptLengthBucket}
                  </td>
                  <td className="max-w-[40ch] truncate py-3 pr-4 font-serif italic text-ink">
                    {r.promptText}
                  </td>
                  <td className="whitespace-nowrap py-3 text-right">
                    <Link
                      href={`/admin/runs/${r.id}`}
                      className="editorial-caps text-ink-muted hover:text-oxblood"
                    >
                      View &rarr;
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
