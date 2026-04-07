import Link from "next/link";
import { isAdmin } from "@/lib/security/admin-auth";
import { getAggregateModelStats, listRecentRuns } from "@/lib/db/queries";
import { BENCHMARK_MODELS } from "@/lib/ai/models";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AdminPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const authed = await isAdmin();
  const params = await searchParams;

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-6 pt-32">
        <Card className="p-8">
          <h1 className="font-serif text-2xl">Admin sign-in</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter the admin secret to continue.
          </p>
          <form method="POST" action="/admin/login" className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">Secret</Label>
              <Input
                id="secret"
                name="secret"
                type="password"
                autoComplete="off"
                required
              />
            </div>
            {params.error && (
              <p className="text-sm text-destructive">
                Incorrect secret. Try again.
              </p>
            )}
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </Card>
      </div>
    );
  }

  const [stats, runs] = await Promise.all([
    getAggregateModelStats(),
    listRecentRuns(50),
  ]);

  const totalVotes = stats.reduce((s, r) => s + r.wins, 0);

  return (
    <div className="mx-auto max-w-5xl px-6 pt-12 pb-16">
      <header className="mb-10">
        <h1 className="font-serif text-3xl font-light">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {runs.length} recent runs · {totalVotes} total votes
        </p>
      </header>

      <section className="mb-12">
        <h2 className="mb-4 font-serif text-xl">Win share</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {BENCHMARK_MODELS.map((m) => {
            const row = stats.find((r) => r.modelSlug === m.slug);
            const wins = row?.wins ?? 0;
            const share = totalVotes === 0 ? 0 : wins / totalVotes;
            return (
              <Card key={m.slug} className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {m.label}
                </p>
                <p className="mt-2 font-mono text-2xl tabular-nums">{wins}</p>
                <p className="text-xs text-muted-foreground">
                  {(share * 100).toFixed(1)}% share
                </p>
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-serif text-xl">Recent runs</h2>
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">When</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Length</th>
                <th className="px-4 py-2">Prompt</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {runs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                    No runs yet.
                  </td>
                </tr>
              )}
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-xs">{r.status}</td>
                  <td className="px-4 py-2 text-xs">{r.promptLengthBucket}</td>
                  <td className="max-w-[36ch] truncate px-4 py-2 font-serif italic text-muted-foreground">
                    {r.promptText}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <Link
                      href={`/admin/runs/${r.id}`}
                      className="text-xs underline underline-offset-4"
                    >
                      View
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
