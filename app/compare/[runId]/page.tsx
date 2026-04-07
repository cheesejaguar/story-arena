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
      <div className="mx-auto max-w-2xl px-6 pt-24 text-center">
        <h1 className="font-serif text-3xl">This run isn&apos;t ready</h1>
        <p className="mt-3 text-muted-foreground">
          {data.run.status === "failed"
            ? "One or more models failed to generate. Try a fresh prompt."
            : "Stories are still being generated. Refresh in a moment."}
        </p>
        <p className="mt-6">
          <Link href="/" className="underline underline-offset-4">
            Try another prompt
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
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
          Your prompt
        </p>
        <p className="font-serif text-xl italic leading-relaxed text-foreground/90">
          &ldquo;{data.run.promptText}&rdquo;
        </p>
      </header>

      <CompareClient runId={data.run.id} stories={stories} />
    </div>
  );
}
