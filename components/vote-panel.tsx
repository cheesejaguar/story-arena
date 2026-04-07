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
    <div className="mx-auto mt-12 max-w-2xl space-y-4">
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Optional: why this one? (one sentence is fine)"
        rows={2}
        maxLength={500}
        disabled={submitting}
        className="resize-none border-border bg-card text-sm font-serif"
      />
      <div className="flex flex-col items-center gap-3">
        <Button
          size="lg"
          onClick={submit}
          disabled={!selectedSlot || submitting}
          className="min-w-[14rem]"
        >
          {submitting
            ? "Recording vote…"
            : selectedSlot
              ? `Vote for Story ${selectedSlot}`
              : "Pick a story to vote"}
        </Button>
        {!allStoriesViewed && selectedSlot && (
          <p className="text-xs text-muted-foreground">
            Tip: read all three before voting for the best label quality.
          </p>
        )}
      </div>
    </div>
  );
}
