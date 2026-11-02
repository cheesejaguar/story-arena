import type { Metadata } from "next";
import { JudgeClient } from "@/components/judge-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Joke Bench — Story Arena",
  description:
    "Rate jokes by frontier language models. Blind comparisons from other people's setups, your vote, the model revealed afterward.",
};

export default function JokeJudgePage() {
  return (
    <div className="mx-auto max-w-7xl px-6 pt-16 pb-20">
      <header className="mx-auto mb-16 max-w-3xl text-center">
        <p className="editorial-caps text-ink-muted">⁂ &nbsp; The Joke Bench &nbsp; ⁂</p>
        <h1
          className="mt-6 font-display italic font-normal leading-[0.9] tracking-tight text-ink"
          style={{ fontSize: "clamp(3rem, 8vw, 5rem)" }}
        >
          Which one
          <br />
          got the laugh?
        </h1>
        <div className="mx-auto mt-8 flex max-w-sm items-center gap-4">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-base leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>
        <p className="mt-6 font-serif text-base italic leading-relaxed text-ink-muted">
          Someone else wrote the setup. Three models went for the punchline.{" "}
          <span className="not-italic text-ink">Pick the funniest.</span>
        </p>
      </header>

      <JudgeClient arena="joke" />
    </div>
  );
}
