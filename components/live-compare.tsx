"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CompareGrid } from "./compare-grid";
import { VotePanel, type Reveal } from "./vote-panel";
import { RevealPanel } from "./reveal-panel";
import type { Slot } from "@/lib/utils/randomize-slots";

export type LiveState = {
  runId: string | null;
  /** Streaming text accumulated per slot. */
  texts: Record<Slot, string>;
  /** Which slots have finished generating. */
  slotsDone: Set<Slot>;
  /** Whether the full run is persisted and ready for voting. */
  ready: boolean;
  /** Terminal error from the stream, if any. */
  error: string | null;
};

export const INITIAL_LIVE_STATE: LiveState = {
  runId: null,
  texts: { A: "", B: "", C: "" },
  slotsDone: new Set(),
  ready: false,
  error: null,
};

/**
 * Renders the blind compare view while text streams in from POST /api/runs.
 *
 * - Shows all three slots (A/B/C) from the moment the stream opens
 * - Each card fills with live deltas; a subtle cursor/shimmer hints at progress
 * - Once `state.ready === true`, the vote panel unlocks
 * - After vote, the reveal panel swaps in
 *
 * The component is driven entirely by the `state` prop, so the parent
 * (PromptForm) owns the stream lifecycle.
 */
export function LiveCompare({ state }: { state: LiveState }) {
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [startTime] = useState(() => Date.now());

  // Auto-scroll the viewport to the cards on first render so the user
  // immediately sees the live text arriving.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const stories = useMemo(
    () => (["A", "B", "C"] as Slot[]).map((slot) => ({
      slot,
      text: state.texts[slot] ?? "",
    })),
    [state.texts],
  );

  const canVote = state.ready && !reveal;
  const allStoriesViewed = state.ready; // generous default: if ready, assume yes

  if (reveal && selectedSlot) {
    return (
      <div className="mx-auto max-w-5xl">
        <RevealPanel reveal={reveal} chosenSlot={selectedSlot} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Status bar */}
      <div className="mb-6 flex items-center gap-4 px-2">
        <span className="hairline flex-1" />
        <span className="editorial-caps text-ink-muted">
          {state.error
            ? "An error stopped the run"
            : state.ready
              ? "All three pens have finished — cast your vote"
              : "Three frontier pens · writing in parallel"}
        </span>
        <span className="hairline flex-1" />
      </div>

      <CompareGrid
        stories={stories}
        selectedSlot={selectedSlot}
        disabled={!canVote}
        onSelect={canVote ? setSelectedSlot : () => {}}
        renderStreaming={(slot) => !state.slotsDone.has(slot)}
      />

      {state.ready && state.runId ? (
        <VotePanel
          runId={state.runId}
          selectedSlot={selectedSlot}
          allStoriesViewed={allStoriesViewed}
          startTime={startTime}
          scrollDepths={{}}
          onVoted={setReveal}
        />
      ) : state.error ? (
        <div className="mx-auto mt-12 max-w-xl text-center">
          <p className="font-serif text-lg italic text-ink">{state.error}</p>
          <p className="mt-4">
            <Link
              href="/"
              className="editorial-caps text-oxblood underline underline-offset-4 hover:text-oxblood-deep"
            >
              Try another prompt
            </Link>
          </p>
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-md text-center">
          <p className="font-serif text-sm italic text-ink-muted">
            The press runs slowly — {state.slotsDone.size} of 3 pens finished.
          </p>
        </div>
      )}
    </div>
  );
}
