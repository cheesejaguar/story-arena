"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StoryMarkdown } from "./story-markdown";
import type { Slot } from "@/lib/utils/randomize-slots";

export type StoryCardProps = {
  slot: Slot;
  text: string;
  selected: boolean;
  disabled?: boolean;
  /** When true, show a "writing…" shimmer instead of plain empty. */
  streaming?: boolean;
  onSelect: () => void;
  onViewed?: () => void;
  onScrollDepth?: (depth: number) => void;
};

export function StoryCard({
  slot,
  text,
  selected,
  disabled,
  streaming,
  onSelect,
  onViewed,
  onScrollDepth,
}: StoryCardProps) {
  // shadcn's Card is a function component without forwardRef, so we attach
  // observers to a wrapping div instead.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const maxDepth = useRef(0);

  useEffect(() => {
    if (!wrapperRef.current || !onViewed) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.25) {
            onViewed();
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: [0, 0.25, 0.5, 1] },
    );
    observer.observe(wrapperRef.current);
    return () => observer.disconnect();
  }, [onViewed]);

  useEffect(() => {
    if (!wrapperRef.current || !onScrollDepth) return;
    const el = wrapperRef.current;
    const handler = () => {
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight;
      if (total === 0) return;
      const visible =
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const depth = Math.max(
        0,
        Math.min(100, Math.round((visible / total) * 100)),
      );
      if (depth > maxDepth.current) {
        maxDepth.current = depth;
        onScrollDepth(depth);
      }
    };
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, [onScrollDepth]);

  function handleSelect() {
    if (disabled) return;
    onSelect();
  }

  return (
    <div ref={wrapperRef}>
      <Card
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-pressed={selected}
        onClick={handleSelect}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleSelect();
          }
        }}
        className={cn(
          "relative cursor-pointer p-6 transition-all",
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
          ) : (
            <StoryMarkdown text={text} />
          )}
          {streaming && text.length > 0 && (
            <span
              aria-hidden
              className="inline-block w-[0.4em] h-[1.1em] ml-0.5 translate-y-[0.15em] bg-ink/60 animate-pulse"
            />
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
