"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BENCHMARK_MODELS } from "@/lib/ai/models";
import type { Slot } from "@/lib/utils/randomize-slots";
import type { Reveal } from "./vote-panel";

const SLOTS: Slot[] = ["A", "B", "C"];

function modelLabel(slug: string): string {
  return BENCHMARK_MODELS.find((m) => m.slug === slug)?.label ?? slug;
}

/**
 * Post-vote reveal — unblind the three stories and highlight the user's pick.
 * The "primary action" defaults to "Try another prompt → /", but judge-mode
 * and other flows can override it with e.g. "Next story" + a click handler.
 */
export type RevealPrimaryAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  loading?: boolean;
};

export function RevealPanel({
  reveal,
  chosenSlot,
  primaryAction,
  subtitle,
}: {
  reveal: Reveal;
  chosenSlot: Slot;
  primaryAction?: RevealPrimaryAction;
  subtitle?: string;
}) {
  const action: RevealPrimaryAction = primaryAction ?? {
    label: "Try another prompt",
    href: "/",
  };

  return (
    <div className="mx-auto mt-12 max-w-3xl text-center">
      <div className="mx-auto mb-6 flex max-w-sm items-center gap-4">
        <span className="hairline flex-1" />
        <span className="text-oxblood text-sm leading-none">❦</span>
        <span className="hairline flex-1" />
      </div>
      <p className="editorial-caps text-ink-muted">Reveal</p>
      <h2 className="mt-3 font-display text-4xl italic font-normal leading-tight text-ink">
        You picked{" "}
        <span className="not-italic font-medium text-oxblood">
          {modelLabel(reveal[chosenSlot])}
        </span>
      </h2>
      {subtitle ? (
        <p className="mt-2 font-serif text-sm italic text-ink-muted">
          {subtitle}
        </p>
      ) : null}

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        {SLOTS.map((slot) => {
          const isPick = slot === chosenSlot;
          return (
            <Card
              key={slot}
              className={cn(
                "p-5 text-center transition-all",
                isPick
                  ? "ring-2 ring-oxblood ring-offset-2 ring-offset-background bg-paper-deep/60"
                  : "opacity-85",
              )}
            >
              <p className="editorial-caps text-ink-muted">Story {slot}</p>
              <p className="mt-3 font-display text-xl italic font-normal leading-tight text-ink">
                {modelLabel(reveal[slot])}
              </p>
              <p className="mt-1 font-mono text-[10px] text-ink-faint tabular-nums">
                {reveal[slot]}
              </p>
              {isPick ? (
                <p className="mt-3 editorial-caps text-oxblood">Your pick</p>
              ) : null}
            </Card>
          );
        })}
      </div>

      <div className="mt-12 flex flex-col items-center gap-4">
        {action.href ? (
          <Button
            size="lg"
            className="rounded-none border border-ink bg-ink px-8 py-6 font-display text-lg italic font-normal text-paper shadow-none hover:bg-oxblood-deep hover:border-oxblood-deep"
            render={
              <Link href={action.href}>
                <span className="editorial-caps mr-3 text-paper/60">
                  {action.label}
                </span>
                <span className="text-xl not-italic">→</span>
              </Link>
            }
          />
        ) : (
          <Button
            size="lg"
            onClick={action.onClick}
            disabled={action.loading}
            className="rounded-none border border-ink bg-ink px-8 py-6 font-display text-lg italic font-normal text-paper shadow-none hover:bg-oxblood-deep hover:border-oxblood-deep disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="editorial-caps mr-3 text-paper/60">
              {action.loading ? "Finding one" : action.label}
            </span>
            <span className="text-xl not-italic">
              {action.loading ? "…" : "→"}
            </span>
          </Button>
        )}

        <Link
          href="/"
          className="editorial-caps text-ink-muted underline underline-offset-4 hover:text-oxblood"
        >
          or write your own prompt
        </Link>
      </div>
    </div>
  );
}
