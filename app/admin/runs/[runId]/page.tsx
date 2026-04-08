import { notFound } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/security/admin-auth";
import { getRunWithOutputs } from "@/lib/db/queries";
import { BENCHMARK_MODELS } from "@/lib/ai/models";
import { Card } from "@/components/ui/card";
import { StoryMarkdown } from "@/components/story-markdown";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function modelLabel(slug: string): string {
  return BENCHMARK_MODELS.find((m) => m.slug === slug)?.label ?? slug;
}

type PageProps = {
  params: Promise<{ runId: string }>;
};

export default async function AdminRunDetailPage({ params }: PageProps) {
  if (!(await isAdmin())) {
    return (
      <div className="mx-auto max-w-md px-6 pt-32 text-center">
        <p className="font-serif italic text-ink-muted">
          Unauthorized.{" "}
          <Link
            href="/admin"
            className="editorial-caps text-oxblood underline underline-offset-4"
          >
            Sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  const { runId } = await params;
  const data = await getRunWithOutputs(runId);
  if (!data) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 pt-12 pb-20">
      <header className="mb-10">
        <Link
          href="/admin"
          className="editorial-caps text-ink-muted hover:text-oxblood"
        >
          ← Editor&apos;s Desk
        </Link>
        <h1 className="mt-4 font-display text-3xl italic text-ink">
          Run detail
        </h1>
        <p className="mt-1 font-mono text-[11px] text-ink-faint">
          {data.run.id}
        </p>
      </header>

      <section className="mb-10">
        <p className="editorial-caps text-ink-muted">Prompt</p>
        <p className="mt-3 font-display text-xl italic leading-relaxed text-ink">
          &ldquo;{data.run.promptText}&rdquo;
        </p>
        <div className="mt-4 flex flex-wrap gap-2 font-mono text-[10px] tabular-nums text-ink-faint">
          <span className="border border-rule px-2 py-1">
            {data.run.status}
          </span>
          <span className="border border-rule px-2 py-1">
            {data.run.promptLengthBucket}
          </span>
          <span className="border border-rule px-2 py-1">
            {new Date(data.run.createdAt).toLocaleString()}
          </span>
          {data.run.completedAt && (
            <span className="border border-rule px-2 py-1">
              finished&nbsp;{new Date(data.run.completedAt).toLocaleString()}
            </span>
          )}
          <span className="border border-rule px-2 py-1">
            prompt v{data.run.systemPromptVersion}
          </span>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-center gap-4">
          <span className="editorial-caps text-ink-muted">
            <span className="text-oxblood">§</span>&nbsp;&nbsp;Outputs
          </span>
          <span className="hairline flex-1" />
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {data.outputs
            .slice()
            .sort((a, b) => a.slotLabel.localeCompare(b.slotLabel))
            .map((o) => (
              <Card key={o.id} className="p-5">
                <header className="mb-4 flex items-baseline justify-between">
                  <span className="editorial-caps text-ink-muted">
                    <span className="text-oxblood">❦</span>&nbsp;&nbsp;Story{" "}
                    {o.slotLabel}
                  </span>
                </header>
                <p className="font-display text-base italic text-ink">
                  {modelLabel(o.modelSlug)}
                </p>
                <p className="mt-1 font-mono text-[9px] text-ink-faint">
                  {o.modelSlug}
                </p>
                <div className="mt-4 border-t border-rule/50 pt-4">
                  <div className="story-prose max-h-64 overflow-y-auto pr-1 text-[13px]">
                    <StoryMarkdown text={o.outputText} />
                  </div>
                </div>
                <p className="mt-4 border-t border-rule/40 pt-3 font-mono text-[9px] tabular-nums text-ink-faint">
                  {o.latencyMs}ms &nbsp;·&nbsp; {o.tokenInput ?? "?"} in /{" "}
                  {o.tokenOutput ?? "?"} out &nbsp;·&nbsp;{" "}
                  {o.finishReason ?? "?"}
                </p>
              </Card>
            ))}
        </div>
      </section>
    </div>
  );
}
