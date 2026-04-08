import { cookies } from "next/headers";
import Link from "next/link";
import { PromptForm } from "@/components/prompt-form";

export default async function HomePage() {
  // Touch the cookie store so this page renders dynamically. The actual
  // session cookie is created lazily by /api/runs (a Route Handler — the
  // only place Next.js permits cookie writes) on the user's first submit.
  await cookies();

  const issueDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="relative">
      {/* ── Masthead bar ─────────────────────────────────────────────── */}
      <div className="border-b border-rule/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 text-ink">
          <span className="masthead-caps text-ink">
            <span className="text-oxblood">❦</span>&nbsp;&nbsp;Story&nbsp;·&nbsp;Arena
          </span>
          <nav className="hidden items-center gap-5 masthead-caps text-ink-muted sm:flex">
            <Link
              href="/judge"
              className="transition-colors hover:text-oxblood"
            >
              The Bench
            </Link>
            <span className="text-ink-faint">·</span>
            <Link
              href="/results"
              className="transition-colors hover:text-oxblood"
            >
              Standings
            </Link>
            <span className="text-ink-faint">·</span>
            <Link
              href="/about"
              className="transition-colors hover:text-oxblood"
            >
              Colophon
            </Link>
          </nav>
          <span className="masthead-caps text-ink-muted">
            Vol. I &nbsp;·&nbsp; N°1 &nbsp;·&nbsp; MMXXVI
          </span>
        </div>
      </div>

      {/* ── Hero / wordmark ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-12 text-center sm:pt-28">
        <p className="rise-in rise-in-1 editorial-caps text-ink-muted">
          ⁂ &nbsp; A Contest of Pens &nbsp; ⁂
        </p>

        <h1
          className="rise-in rise-in-2 mt-8 font-display italic font-normal leading-[0.88] tracking-tight text-ink"
          style={{ fontSize: "clamp(4.5rem, 14vw, 10rem)" }}
        >
          Story
          <br />
          Arena
        </h1>

        {/* Rule + fleuron break */}
        <div className="rise-in rise-in-3 mx-auto mt-12 flex max-w-md items-center gap-5">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-lg leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>

        <p className="rise-in rise-in-3 mx-auto mt-8 max-w-2xl font-serif text-lg italic leading-relaxed text-ink-muted sm:text-xl">
          Three frontier intelligences compose the same story in secret.
          <br className="hidden sm:inline" />
          <span className="not-italic font-medium text-ink">
            You choose the finest pen.
          </span>
        </p>

        {/* Tiny editorial byline */}
        <p className="rise-in rise-in-3 mt-6 editorial-caps text-ink-faint">
          Filed {issueDate} &nbsp;·&nbsp; A Living Dataset
        </p>

        {/* Quick link to judge mode */}
        <p className="rise-in rise-in-3 mt-8 font-serif text-sm italic text-ink-muted">
          Or{" "}
          <Link
            href="/judge"
            className="not-italic editorial-caps text-oxblood underline decoration-[1.5px] underline-offset-4 hover:text-oxblood-deep"
          >
            judge a story someone else wrote
          </Link>
          .
        </p>
      </section>

      {/* ── Form ─────────────────────────────────────────────────────── */}
      <section className="rise-in rise-in-4 mx-auto max-w-4xl px-6 pt-8 pb-24">
        <PromptForm />
      </section>

      {/* ── Foot note ────────────────────────────────────────────────── */}
      <section className="rise-in rise-in-5 mx-auto max-w-2xl px-6 pb-20 text-center">
        <div className="mx-auto mb-5 flex items-center justify-center gap-4">
          <span className="hairline w-12" />
          <span className="text-oxblood text-xs leading-none">⁂</span>
          <span className="hairline w-12" />
        </div>
        <p className="editorial-caps text-ink-muted">
          Stories appear blind as A &nbsp;·&nbsp; B &nbsp;·&nbsp; C
        </p>
        <p className="mt-2 font-serif text-sm italic text-ink-muted">
          Pick the finest. We reveal the authors after.
        </p>
      </section>
    </div>
  );
}
