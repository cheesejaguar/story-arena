import { BENCHMARK_MODELS } from "@/lib/ai/models";

export const runtime = "nodejs";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 pt-20 pb-20">
      {/* Masthead */}
      <header className="mx-auto mb-14 max-w-2xl text-center">
        <p className="editorial-caps text-ink-muted">⁂ &nbsp; Colophon &nbsp; ⁂</p>
        <h1
          className="mt-6 font-display italic font-normal leading-[0.9] tracking-tight text-ink"
          style={{ fontSize: "clamp(3rem, 8vw, 5rem)" }}
        >
          About
        </h1>
        <div className="mx-auto mt-8 flex max-w-sm items-center gap-4">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-base leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>
        <p className="mt-6 font-serif text-lg italic text-ink-muted">
          What this is, how it works, and what we do with the data.
        </p>
      </header>

      <article className="story-prose mx-auto max-w-2xl space-y-14">
        <section>
          <p className="editorial-caps text-ink-muted">§ &nbsp;The idea</p>
          <h2 className="mt-3 font-display text-3xl italic font-normal text-ink">
            A benchmark that measures taste.
          </h2>
          <p className="mt-5">
            Most language-model benchmarks measure things you can grade
            automatically: code that compiles, math that resolves, multiple
            choice. Fiction isn&apos;t that. The only honest way to know which
            model writes the best story is to ask people which one they
            prefer.
          </p>
          <p className="mt-4">
            Story Arena is that question, repeated. You write a prompt. Three
            frontier models write it in parallel. We hide which model wrote
            which, and you tell us which is best. Every vote is a human
            preference label.
          </p>
        </section>

        <div className="mx-auto flex max-w-xs items-center gap-4">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-xs leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>

        <section>
          <p className="editorial-caps text-ink-muted">§ &nbsp;How it works</p>
          <h2 className="mt-3 font-display text-3xl italic font-normal text-ink">
            Blind by construction.
          </h2>
          <p className="mt-5">
            Each run sends your prompt to all three models with the same
            system instruction and the same length budget. The three responses
            are randomized into slots A, B, and C by a cryptographically
            random Fisher-Yates shuffle. Nothing on the page, the URL, or the
            network payload reveals which model is in which slot until you
            vote. The vote maps your slot choice to the real model identity
            at write time; the mapping is stored as a human preference label
            with column-level integrity constraints so it can&apos;t drift.
          </p>
          <p className="mt-4">The models in this round:</p>
          <ul className="mt-4 list-none space-y-2 pl-0">
            {BENCHMARK_MODELS.map((m, i) => {
              const numeral = ["I", "II", "III"][i] ?? `${i + 1}`;
              return (
                <li
                  key={m.slug}
                  className="flex items-baseline gap-4 border-b border-rule/50 pb-2 not-italic"
                >
                  <span className="font-display text-lg italic text-oxblood w-6 shrink-0">
                    {numeral}
                  </span>
                  <span className="font-serif text-base text-ink">
                    {m.label}
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-ink-faint">
                    {m.slug}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="mx-auto flex max-w-xs items-center gap-4">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-xs leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>

        <section>
          <p className="editorial-caps text-ink-muted">
            § &nbsp;What we collect
          </p>
          <h2 className="mt-3 font-display text-3xl italic font-normal text-ink">
            Prompts, stories, votes.
          </h2>
          <p className="mt-5">
            We store your prompt, the three generated stories, the slot
            randomization, and your vote. We also store a pseudonymous session
            id — a random number in a signed cookie, no name, no email, no
            profile — so we can prevent double voting and rate-limit abuse.
            We may use this data to evaluate model quality, improve the
            product, and publish aggregate statistics.
          </p>
          <p className="mt-4">
            We do not require an account. We do not sell the data. We do not
            try to identify you. If you want your data removed, get in touch.
          </p>
        </section>

        <div className="mx-auto flex max-w-xs items-center gap-4">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-xs leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>

        <section>
          <p className="editorial-caps text-ink-muted">§ &nbsp;A caveat</p>
          <h2 className="mt-3 font-display text-3xl italic font-normal text-ink">
            Preference ≠ quality.
          </h2>
          <p className="mt-5">
            Human preference is not the same as objective literary quality.
            A model that wins here is winning{" "}
            <em>at being preferred by people who use Story Arena</em> — which
            is a useful thing to know, but isn&apos;t the same as knowing what
            the best fiction in the world is. Read the standings with that in
            mind.
          </p>
        </section>
      </article>
    </div>
  );
}
