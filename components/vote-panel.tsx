"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Slot } from "@/lib/utils/randomize-slots";

export type Reveal = Record<"A" | "B" | "C", string>;

export type VotePanelProps = {
  runId: string;
  selectedSlot: Slot | null;
  allStoriesViewed: boolean;
  startTime: number;
  scrollDepths: Partial<Record<Slot, number>>;
  onVoted: (reveal: Reveal) => void;
};

export function VotePanel({
  runId,
  selectedSlot,
  allStoriesViewed,
  startTime,
  scrollDepths,
  onVoted,
}: VotePanelProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!selectedSlot || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId,
          chosenSlot: selectedSlot,
          reason: reason.trim() || undefined,
          timeToVoteMs: Date.now() - startTime,
          allStoriesViewed,
          scrollDepthA: scrollDepths.A,
          scrollDepthB: scrollDepths.B,
          scrollDepthC: scrollDepths.C,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(
          res.status === 409
            ? "You've already voted on this run."
            : data.error || "Couldn't record your vote. Try again.",
        );
        setSubmitting(false);
        return;
      }
      const { reveal } = (await res.json()) as { reveal: Reveal };
      onVoted(reveal);
    } catch {
      toast.error("Network error. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-14 max-w-2xl">
      {/* Editorial separator */}
      <div className="mb-8 flex items-center gap-4">
        <span className="hairline flex-1" />
        <span className="text-oxblood text-sm leading-none">❦</span>
        <span className="hairline flex-1" />
      </div>

      <div className="mb-5 flex items-center gap-4">
        <span className="editorial-caps text-ink-muted">
          <span className="text-oxblood">§</span>&nbsp;&nbsp;Your verdict
        </span>
        <span className="hairline flex-1" />
      </div>

      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="A line about why, if you like. Optional."
        rows={2}
        maxLength={500}
        disabled={submitting}
        className="resize-none rounded-none border-0 border-y border-ink/60 bg-transparent px-0 py-4 font-serif text-base italic leading-relaxed text-ink placeholder:text-ink-faint placeholder:italic focus-visible:border-oxblood focus-visible:ring-0 focus-visible:ring-offset-0"
      />

      <div className="mt-8 flex flex-col items-center gap-4">
        <Button
          size="lg"
          onClick={submit}
          disabled={!selectedSlot || submitting}
          className="group rounded-none border border-ink bg-ink px-8 py-6 font-display text-lg italic font-normal text-paper shadow-none transition-all hover:bg-oxblood-deep hover:border-oxblood-deep disabled:border-rule disabled:bg-paper-deep disabled:text-ink-faint"
        >
          <span className="editorial-caps mr-3 text-paper/60 group-disabled:text-ink-faint">
            {submitting
              ? "Recording"
              : selectedSlot
                ? `Vote for Story ${selectedSlot}`
                : "Pick a story to vote"}
          </span>
          <span className="text-xl not-italic">
            {submitting ? "…" : "→"}
          </span>
        </Button>
        {!allStoriesViewed && selectedSlot && (
          <p className="font-serif text-xs italic text-ink-muted">
            Tip: read all three before voting — the label quality depends on it.
          </p>
        )}
      </div>
    </div>
  );
}
