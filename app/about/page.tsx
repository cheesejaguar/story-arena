import { BENCHMARK_MODELS } from "@/lib/ai/models";

export const runtime = "nodejs";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 pt-24 pb-12">
      <header className="mb-12">
        <h1 className="font-serif text-4xl font-light tracking-tight">About</h1>
        <p className="mt-3 text-base text-muted-foreground">
          What this is, how it works, and what we do with the data.
        </p>
      </header>

      <article className="story-prose space-y-8 text-base">
        <section>
          <h2 className="font-serif text-2xl font-light">The idea</h2>
          <p className="mt-3">
            Most language-model benchmarks measure things you can grade
            automatically: code that compiles, math that resolves, multiple
            choice. Fiction writing isn&apos;t that. The only honest way to know
            which model writes the best story is to ask people which one they
            prefer.
          </p>
          <p className="mt-3">
            Story Arena is that question, repeated. You write a prompt. Three
            frontier models write the story in parallel. We hide which model
            wrote which, and you tell us which one is best. Every vote is a
            human preference label.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-light">How it works</h2>
          <p className="mt-3">
            Each run sends your prompt to all three models with the same system
            instruction and the same length budget. The three responses are
            randomized into slots A, B, and C — neither the page nor the URL
            reveals which model is in which slot until after you vote. The
            vote then maps your slot choice back to the real model identity
            and stores it as a preference label.
          </p>
          <p className="mt-3">The models in this round:</p>
          <ul className="mt-3 list-disc pl-6">
            {BENCHMARK_MODELS.map((m) => (
              <li key={m.slug}>
                <span className="font-medium">{m.label}</span>{" "}
                <span className="font-mono text-xs text-muted-foreground">
                  {m.slug}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-light">What we collect</h2>
          <p className="mt-3">
            We store your prompt, the three generated stories, the slot
            randomization, and your vote. We also store a pseudonymous session
            id (a random number in a cookie — no name, no email, no profile)
            so we can prevent double-voting and rate-limit abuse. We may use
            this data to evaluate model quality, improve the product, and
            publish aggregate statistics.
          </p>
          <p className="mt-3">
            We do not require an account. We do not sell the data. We do not
            try to identify you. If you want your data removed, get in touch.
          </p>
        </section>

        <section>
          <h2 className="font-serif text-2xl font-light">A caveat</h2>
          <p className="mt-3">
            Human preference is not the same as objective literary quality. A
            model that wins here is winning <em>at being preferred by people
            who use Story Arena</em> — which is a useful thing to know, but
            isn&apos;t the same as knowing what the best fiction is. Read the
            results with that in mind.
          </p>
        </section>
      </article>
    </div>
  );
}
