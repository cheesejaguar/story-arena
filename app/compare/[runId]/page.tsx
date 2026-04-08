import { notFound } from "next/navigation";
import Link from "next/link";
import { getRunWithOutputs } from "@/lib/db/queries";
import { CompareClient } from "./compare-client";

export const runtime = "nodejs";

type PageProps = {
  params: Promise<{ runId: string }>;
};

export default async function ComparePage({ params }: PageProps) {
  const { runId } = await params;
  const data = await getRunWithOutputs(runId);

  if (!data) {
    notFound();
  }

  if (data.run.status !== "complete") {
    return (
      <div className="mx-auto max-w-xl px-6 pt-32 text-center">
        <div className="mx-auto mb-6 flex max-w-xs items-center gap-4">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-sm leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>
        <p className="editorial-caps text-ink-muted">The Press</p>
        <h1 className="mt-4 font-display text-3xl italic text-ink">
          This run isn&apos;t ready.
        </h1>
        <p className="mt-4 font-serif italic text-ink-muted">
          {data.run.status === "failed"
            ? "One or more models failed to generate. Try a fresh prompt."
            : "Stories are still being generated. Refresh in a moment."}
        </p>
        <p className="mt-10">
          <Link
            href="/"
            className="editorial-caps text-ink underline decoration-oxblood decoration-[1.5px] underline-offset-[6px] hover:text-oxblood"
          >
            Write a new prompt →
          </Link>
        </p>
      </div>
    );
  }

  // Build BLINDED stories — project ONLY slot + text to keep model identity server-side.
  const stories = data.outputs
    .map((o) => ({ slot: o.slotLabel, text: o.outputText }))
    .sort((a, b) => a.slot.localeCompare(b.slot));

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-16">
      <header className="mx-auto mb-12 max-w-3xl text-center">
        <p className="editorial-caps text-ink-muted">Your prompt</p>
        <p className="mt-4 font-display text-xl italic leading-relaxed text-ink sm:text-2xl">
          &ldquo;{data.run.promptText}&rdquo;
        </p>
      </header>

      <CompareClient runId={data.run.id} stories={stories} />
    </div>
  );
}
