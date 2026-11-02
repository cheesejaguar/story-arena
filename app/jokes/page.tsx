import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { PromptForm } from "@/components/prompt-form";
import { JOKE_PROMPTS } from "@/data/joke-prompts";
import {
  getHomepageJokePrompts,
  jokePromptSourceLabel,
} from "@/lib/seed/joke-prompts";

export const metadata: Metadata = {
  title: "Joke Arena — Three frontier AIs. One setup. You laugh.",
  description:
    "A blind comedy contest between frontier language models. Read three punchlines, pick the funniest, and the comics are revealed after.",
};

const PICKED = getHomepageJokePrompts(JOKE_PROMPTS, 6);
const EXAMPLES = PICKED.map((p) => ({
  id: p.id,
  text: p.promptText,
  source: jokePromptSourceLabel(p),
}));
const EXAMPLES_HEADING = PICKED.some((p) => p.source === "reddit")
  ? "From the joke subreddits"
  : "House prompts";

export default async function JokesPage() {
  // Same as the homepage: render dynamically so the session cookie flow works.
  await cookies();

  return (
    <div className="relative">
      {/* ── Masthead bar ─────────────────────────────────────────────── */}
      <div className="border-b border-rule/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4 text-ink">
          <Link href="/" className="masthead-caps text-ink hover:text-oxblood">
            <span className="text-oxblood">❦</span>&nbsp;&nbsp;Story&nbsp;·&nbsp;Arena
          </Link>
          <nav className="hidden items-center gap-5 masthead-caps text-ink-muted sm:flex">
            <Link href="/jokes/judge" className="transition-colors hover:text-oxblood">
              Joke Bench
            </Link>
            <span className="text-ink-faint">·</span>
            <Link href="/results?arena=joke" className="transition-colors hover:text-oxblood">
              Standings
            </Link>
            <span className="text-ink-faint">·</span>
            <Link href="/" className="transition-colors hover:text-oxblood">
              Story Arena
            </Link>
          </nav>
          <span className="masthead-caps text-ink-muted">The Comedy Supplement</span>
        </div>
      </div>

      {/* ── Hero / wordmark ──────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 pt-20 pb-12 text-center sm:pt-28">
        <p className="rise-in rise-in-1 editorial-caps text-ink-muted">
          ⁂ &nbsp; A Contest of Wits &nbsp; ⁂
        </p>

        <h1
          className="rise-in rise-in-2 mt-8 font-display italic font-normal leading-[0.88] tracking-tight text-ink"
          style={{ fontSize: "clamp(4.5rem, 14vw, 10rem)" }}
        >
          Joke
          <br />
          Arena
        </h1>

        <div className="rise-in rise-in-3 mx-auto mt-12 flex max-w-md items-center gap-5">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-lg leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>

        <p className="rise-in rise-in-3 mx-auto mt-8 max-w-2xl font-serif text-lg italic leading-relaxed text-ink-muted sm:text-xl">
          Three frontier intelligences take the same setup.
          <br className="hidden sm:inline" />
          <span className="not-italic font-medium text-ink">
            You decide which one is actually funny.
          </span>
        </p>

        <p className="rise-in rise-in-3 mt-8 font-serif text-sm italic text-ink-muted">
          Or{" "}
          <Link
            href="/jokes/judge"
            className="not-italic editorial-caps text-oxblood underline decoration-[1.5px] underline-offset-4 hover:text-oxblood-deep"
          >
            rate jokes from someone else&apos;s setup
          </Link>
          .
        </p>
      </section>

      {/* ── Form ─────────────────────────────────────────────────────── */}
      <section className="rise-in rise-in-4 mx-auto max-w-4xl px-6 pt-8 pb-24">
        <PromptForm
          arena="joke"
          examples={EXAMPLES}
          examplesHeading={EXAMPLES_HEADING}
        />
      </section>

      {/* ── Foot note ────────────────────────────────────────────────── */}
      <section className="rise-in rise-in-5 mx-auto max-w-2xl px-6 pb-20 text-center">
        <div className="mx-auto mb-5 flex items-center justify-center gap-4">
          <span className="hairline w-12" />
          <span className="text-oxblood text-xs leading-none">⁂</span>
          <span className="hairline w-12" />
        </div>
        <p className="editorial-caps text-ink-muted">
          Jokes appear blind as A &nbsp;·&nbsp; B &nbsp;·&nbsp; C
        </p>
        <p className="mt-2 font-serif text-sm italic text-ink-muted">
          Pick the funniest. We reveal the comics after.
        </p>
      </section>
    </div>
  );
}
