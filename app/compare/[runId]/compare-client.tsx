"use client";

import { useMemo, useState } from "react";
import { CompareGrid, type CompareStory } from "@/components/compare-grid";
import { VotePanel, type Reveal } from "@/components/vote-panel";
import { RevealPanel } from "@/components/reveal-panel";
import type { Slot } from "@/lib/utils/randomize-slots";

export function CompareClient({
  runId,
  stories,
}: {
  runId: string;
  stories: CompareStory[];
}) {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [viewed, setViewed] = useState<Set<Slot>>(new Set());
  const [scrollDepths, setScrollDepths] = useState<Partial<Record<Slot, number>>>({});
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [startTime] = useState(() => Date.now());

  const allStoriesViewed = useMemo(
    () => stories.every((s) => viewed.has(s.slot)),
    [stories, viewed],
  );

  function handleViewed(slot: Slot) {
    setViewed((prev) => {
      if (prev.has(slot)) return prev;
      const next = new Set(prev);
      next.add(slot);
      return next;
    });
  }

  function handleScrollDepth(slot: Slot, depth: number) {
    setScrollDepths((prev) => {
      const current = prev[slot] ?? 0;
      if (depth <= current) return prev;
      return { ...prev, [slot]: depth };
    });
  }

  if (reveal && selectedSlot) {
    return <RevealPanel reveal={reveal} chosenSlot={selectedSlot} />;
  }

  return (
    <>
      <CompareGrid
        stories={stories}
        selectedSlot={selectedSlot}
        disabled={Boolean(reveal)}
        onSelect={setSelectedSlot}
        onViewed={handleViewed}
        onScrollDepth={handleScrollDepth}
      />
      <VotePanel
        runId={runId}
        selectedSlot={selectedSlot}
        allStoriesViewed={allStoriesViewed}
        startTime={startTime}
        scrollDepths={scrollDepths}
        onVoted={setReveal}
      />
    </>
  );
}
