import { notFound } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/security/admin-auth";
import { getRunWithOutputs } from "@/lib/db/queries";
import { BENCHMARK_MODELS } from "@/lib/ai/models";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
        <p className="text-sm text-muted-foreground">
          Unauthorized.{" "}
          <Link href="/admin" className="underline underline-offset-4">
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
    <div className="mx-auto max-w-5xl px-6 pt-12 pb-16">
      <header className="mb-8">
        <Link href="/admin" className="text-xs text-muted-foreground underline underline-offset-4">
          ← Back to admin
        </Link>
        <h1 className="mt-3 font-serif text-2xl font-light">Run detail</h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">{data.run.id}</p>
      </header>

      <section className="mb-8">
        <h2 className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">
          Prompt
        </h2>
        <p className="story-prose italic">&ldquo;{data.run.promptText}&rdquo;</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">{data.run.status}</Badge>
          <Badge variant="outline">{data.run.promptLengthBucket}</Badge>
          <Badge variant="outline">{new Date(data.run.createdAt).toLocaleString()}</Badge>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-4 text-xs uppercase tracking-wider text-muted-foreground">
          Outputs
        </h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {data.outputs
            .slice()
            .sort((a, b) => a.slotLabel.localeCompare(b.slotLabel))
            .map((o) => (
              <Card key={o.id} className="p-4">
                <header className="mb-3 flex items-baseline justify-between">
                  <span className="font-serif text-base">Story {o.slotLabel}</span>
                  <span className="text-xs text-muted-foreground">
                    {modelLabel(o.modelSlug)}
                  </span>
                </header>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {o.modelSlug}
                </p>
                <div className="mt-3 max-h-64 overflow-y-auto pr-2">
                  <div className="story-prose text-sm max-w-none">
                    <StoryMarkdown text={o.outputText} />
                  </div>
                </div>
                <p className="mt-3 font-mono text-[10px] text-muted-foreground">
                  {o.latencyMs}ms · {o.tokenInput ?? "?"} in / {o.tokenOutput ?? "?"} out
                </p>
              </Card>
            ))}
        </div>
      </section>
    </div>
  );
}
