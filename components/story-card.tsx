"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StoryMarkdownLazy } from "./story-markdown-lazy";
import type { Slot } from "@/lib/utils/randomize-slots";

export type StoryCardProps = {
  slot: Slot;
  text: string;
  selected: boolean;
  disabled?: boolean;
  /** When true, show plain text + cursor instead of parsing Markdown. */
  streaming?: boolean;
  onSelect: () => void;
};

export function StoryCard({
  slot,
  text,
  selected,
  disabled,
  streaming,
  onSelect,
}: StoryCardProps) {
  function handleSelect() {
    if (disabled) return;
    onSelect();
  }

  return (
    <div data-slot={slot} className="h-full">
      <Card
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={selected}
        aria-disabled={disabled || undefined}
        aria-label={`Story ${slot}${selected ? ", your pick" : ""}`}
        onClick={handleSelect}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect();
          }
        }}
        className={cn(
          "relative h-full cursor-pointer p-6 transition-all",
          "hover:ring-foreground/30",
          selected &&
            "ring-2 ring-foreground/80 ring-offset-2 ring-offset-background",
          disabled && "cursor-not-allowed opacity-60",
          streaming && "cursor-default",
        )}
      >
        <header className="mb-5 flex items-baseline justify-between">
          <h2 className="editorial-caps text-ink-muted">
            <span className="text-oxblood">❦</span>&nbsp;&nbsp;Story&nbsp;{slot}
          </h2>
          {streaming ? (
            <span className="editorial-caps text-ink-faint animate-pulse">
              Writing…
            </span>
          ) : selected ? (
            <span className="editorial-caps text-oxblood">Your pick</span>
          ) : null}
        </header>
        <div className="story-prose max-w-none text-ink">
          {text.length === 0 && streaming ? (
            <StreamingSkeleton />
          ) : streaming ? (
            // While tokens arrive, plain text is far cheaper than re-parsing
            // partial Markdown on every animation frame.
            <p className="whitespace-pre-wrap">
              {text}
              <span
                aria-hidden
                className="ml-0.5 inline-block h-[1.1em] w-[0.4em] translate-y-[0.15em] animate-pulse bg-ink/60"
              />
            </p>
          ) : (
            <StoryMarkdownLazy text={text} />
          )}
        </div>
      </Card>
    </div>
  );
}

/**
 * Three grey lines that hint at an empty manuscript waiting for ink.
 * Only shown for the brief window before the first delta arrives.
 */
function StreamingSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-full rounded bg-paper-deep animate-pulse" />
      <div className="h-4 w-[92%] rounded bg-paper-deep animate-pulse" />
      <div className="h-4 w-[85%] rounded bg-paper-deep animate-pulse" />
    </div>
  );
}
