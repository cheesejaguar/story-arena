import { cookies } from "next/headers";
import { PromptForm } from "@/components/prompt-form";

export default async function HomePage() {
  // Touch the cookie store so this page renders dynamically. The actual
  // session cookie is created lazily by /api/runs (a Route Handler — the
  // only place Next.js permits cookie writes) on the user's first submit.
  await cookies();

  return (
    <div className="mx-auto max-w-3xl px-6 pt-24 pb-12">
      <header className="mb-12 space-y-4 text-center">
        <h1 className="font-serif text-5xl font-light tracking-tight sm:text-6xl">
          Story Arena
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          Three frontier AIs. One prompt.{" "}
          <span className="text-foreground">You decide who writes best.</span>
        </p>
      </header>

      <PromptForm />

      <p className="mt-12 text-center text-xs text-muted-foreground">
        Stories appear blind as A, B, and C. Vote for the best one.
        <br />
        We&apos;ll reveal the models after.
      </p>
    </div>
  );
}
