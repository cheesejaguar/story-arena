"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Slot } from "@/lib/utils/randomize-slots";

export type StoryCardProps = {
  slot: Slot;
  text: string;
  selected: boolean;
  disabled?: boolean;
  onSelect: () => void;
  onViewed?: () => void;
  onScrollDepth?: (depth: number) => void;
};

export function StoryCard({
  slot,
  text,
  selected,
  disabled,
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

  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

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
        )}
      >
        <header className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-lg font-medium tracking-wide text-muted-foreground">
            Story {slot}
          </h2>
          {selected && (
            <span className="text-xs font-medium uppercase tracking-wider text-foreground/70">
              Your pick
            </span>
          )}
        </header>
        <div className="story-prose">
          {paragraphs.map((p, i) => (
            <p key={i} className="mb-4 last:mb-0">
              {p}
            </p>
          ))}
        </div>
      </Card>
    </div>
  );
}
