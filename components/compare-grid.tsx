"use client";

import { useEffect, useRef } from "react";
import { StoryCard } from "./story-card";
import type { Slot } from "@/lib/utils/randomize-slots";
import type { Arena } from "@/lib/arena";

export type CompareStory = {
  slot: Slot;
  text: string;
};

export type CompareGridProps = {
  stories: CompareStory[];
  selectedSlot: Slot | null;
  disabled?: boolean;
  onSelect: (slot: Slot) => void;
  onViewed?: (slot: Slot) => void;
  onScrollDepth?: (slot: Slot, depth: number) => void;
  /** Optional hook — when returns true for a slot, that card shows a "writing…" shimmer. */
  renderStreaming?: (slot: Slot) => boolean;
  arena?: Arena;
};

/**
 * One responsive grid for every breakpoint. On phones the cards stack; on
 * desktop they sit side by side. A single IntersectionObserver and a single
 * passive scroll listener cover all three cards, instead of mounting six
 * observers (desktop + mobile trees) and three scroll listeners.
 */
export function CompareGrid({
  stories,
  selectedSlot,
  disabled,
  onSelect,
  onViewed,
  onScrollDepth,
  renderStreaming,
  arena,
}: CompareGridProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const maxDepth = useRef<Partial<Record<Slot, number>>>({});
  const viewedRef = useRef(onViewed);
  const scrollRef = useRef(onScrollDepth);
  const slotKey = stories.map((story) => story.slot).join("");

  useEffect(() => {
    viewedRef.current = onViewed;
    scrollRef.current = onScrollDepth;
  }, [onViewed, onScrollDepth]);

  useEffect(() => {
    if (!viewedRef.current) return;
    const root = gridRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio <= 0.25) continue;
          const slot = (entry.target as HTMLElement).dataset.slot as Slot | undefined;
          if (!slot) continue;
          viewedRef.current?.(slot);
          observer.unobserve(entry.target);
        }
      },
      { threshold: [0, 0.25, 0.5, 1] },
    );

    for (const el of root.querySelectorAll<HTMLElement>("[data-slot]")) {
      observer.observe(el);
    }
    return () => observer.disconnect();
  }, [slotKey]);

  useEffect(() => {
    if (!scrollRef.current) return;
    const root = gridRef.current;
    if (!root) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const viewportHeight = window.innerHeight;
      for (const el of root.querySelectorAll<HTMLElement>("[data-slot]")) {
        const slot = el.dataset.slot as Slot | undefined;
        if (!slot) continue;
        const rect = el.getBoundingClientRect();
        const total = el.scrollHeight || rect.height;
        if (total === 0) continue;
        const visible =
          Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0);
        const depth = Math.round(
          Math.max(0, Math.min(1, visible / total)) * 100,
        );
        if (depth > (maxDepth.current[slot] ?? 0)) {
          maxDepth.current[slot] = depth;
          scrollRef.current?.(slot, depth);
        }
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [slotKey]);

  return (
    <div ref={gridRef} className="grid gap-6 lg:grid-cols-3">
      {stories.map((story) => (
        <StoryCard
          key={story.slot}
          slot={story.slot}
          text={story.text}
          selected={selectedSlot === story.slot}
          disabled={disabled}
          streaming={renderStreaming ? renderStreaming(story.slot) : false}
          arena={arena}
          onSelect={() => onSelect(story.slot)}
        />
      ))}
    </div>
  );
}
