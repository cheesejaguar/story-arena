"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CompareGrid, type CompareStory } from "@/components/compare-grid";
import { VotePanel, type Reveal } from "@/components/vote-panel";
import { RevealPanel } from "@/components/reveal-panel";
import type { Slot } from "@/lib/utils/randomize-slots";
import { ARENA_COPY, type Arena } from "@/lib/arena";

type JudgeRun = {
  id: string;
  prompt: string;
  length: "short" | "medium" | "long";
  stories: CompareStory[];
};

type JudgeResponse = {
  run: JudgeRun | null;
  stats: { votedByYou: number; remaining: number };
};

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "empty"; votedByYou: number }
  | { kind: "judging"; run: JudgeRun; votedByYou: number; remaining: number }
  | {
      kind: "revealed";
      run: JudgeRun;
      reveal: Reveal;
      chosenSlot: Slot;
      votedByYou: number;
      remaining: number;
    };

/**
 * Judge mode — the bench where users vote on other people's blind runs.
 * Orchestrates a small state machine: loading → judging → revealed → (fetch next) → judging…
 */
export function JudgeClient({ arena = "story" }: { arena?: Arena }) {
  const copy = ARENA_COPY[arena];
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [viewed, setViewed] = useState<Set<Slot>>(new Set());
  const [scrollDepths, setScrollDepths] = useState<
    Partial<Record<Slot, number>>
  >({});
  const [startTime, setStartTime] = useState(() => Date.now());
  const [nextLoading, setNextLoading] = useState(false);

  const applyNext = useCallback((data: JudgeResponse | null) => {
    if (!data) {
      setPhase({
        kind: "error",
        message: `Couldn't fetch a ${copy.unit.toLowerCase()}. Try again.`,
      });
      return;
    }
    if (!data.run) {
      setPhase({ kind: "empty", votedByYou: data.stats.votedByYou });
      return;
    }
    setPhase({
      kind: "judging",
      run: data.run,
      votedByYou: data.stats.votedByYou,
      remaining: data.stats.remaining,
    });
    setSelectedSlot(null);
    setViewed(new Set());
    setScrollDepths({});
    setStartTime(Date.now());
    // Scroll to top for the next story
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [copy.unit]);

  const loadNext = useCallback(async (): Promise<JudgeResponse | null> => {
    try {
      const res = await fetch(`/api/judge/next?arena=${arena}`, {
        cache: "no-store",
      });
      if (!res.ok) return null;
      return (await res.json()) as JudgeResponse;
    } catch {
      return null;
    }
  }, [arena]);

  const fetchNext = useCallback(async () => {
    const data = await loadNext();
    applyNext(data);
    setNextLoading(false);
  }, [loadNext, applyNext]);

  useEffect(() => {
    let cancelled = false;
    void loadNext().then((data) => {
      if (cancelled) return;
      applyNext(data);
    });
    return () => {
      cancelled = true;
    };
  }, [loadNext, applyNext]);

  const handleNext = useCallback(() => {
    setNextLoading(true);
    void fetchNext();
  }, [fetchNext]);

  const handleViewed = useCallback((slot: Slot) => {
    setViewed((prev) => {
      if (prev.has(slot)) return prev;
      const next = new Set(prev);
      next.add(slot);
      return next;
    });
  }, []);

  const handleScrollDepth = useCallback((slot: Slot, depth: number) => {
    setScrollDepths((prev) => {
      const current = prev[slot] ?? 0;
      if (depth <= current) return prev;
      return { ...prev, [slot]: depth };
    });
  }, []);

  const handleVoted = useCallback(
    (reveal: Reveal) => {
      if (phase.kind !== "judging" || !selectedSlot) return;
      setPhase({
        kind: "revealed",
        run: phase.run,
        reveal,
        chosenSlot: selectedSlot,
        votedByYou: phase.votedByYou + 1,
        remaining: Math.max(0, phase.remaining - 1),
      });
    },
    [phase, selectedSlot],
  );

  // ── Render states ─────────────────────────────────────────────────

  if (phase.kind === "loading") {
    return (
      <div className="mx-auto mt-20 max-w-xl text-center">
        <p className="editorial-caps text-ink-muted">
          Fetching a {copy.unit.toLowerCase()}
        </p>
        <div className="mx-auto mt-4 flex w-12 items-center justify-center gap-1">
          <span className="h-1 w-1 animate-pulse rounded-full bg-ink" />
          <span className="h-1 w-1 animate-pulse rounded-full bg-ink [animation-delay:150ms]" />
          <span className="h-1 w-1 animate-pulse rounded-full bg-ink [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  if (phase.kind === "error") {
    return (
      <div className="mx-auto mt-20 max-w-xl text-center">
        <p className="font-display text-2xl italic text-ink">{phase.message}</p>
        <button
          type="button"
          onClick={handleNext}
          className="mt-6 editorial-caps text-oxblood underline underline-offset-4 hover:text-oxblood-deep"
        >
          Try again
        </button>
      </div>
    );
  }

  if (phase.kind === "empty") {
    return (
      <div className="mx-auto mt-20 max-w-xl text-center">
        <div className="mx-auto mb-6 flex max-w-xs items-center gap-4">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-lg leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>
        <p className="editorial-caps text-ink-muted">
          No pending {copy.unitPlural}
        </p>
        <h1 className="mt-4 font-display text-4xl italic text-ink">
          You&apos;ve judged them all.
        </h1>
        <p className="mt-4 font-serif italic text-ink-muted">
          {phase.votedByYou > 0
            ? `You've cast ${phase.votedByYou.toLocaleString()} ${phase.votedByYou === 1 ? "verdict" : "verdicts"} so far. Come back when fresh ${copy.unitPlural} have been written — or write one yourself.`
            : `Come back once some ${copy.unitPlural} have been written.`}
        </p>
        <div className="mt-10">
          <Link
            href={copy.home}
            className="editorial-caps text-ink underline decoration-oxblood decoration-[1.5px] underline-offset-[6px] hover:text-oxblood"
          >
            Write your own prompt →
          </Link>
        </div>
      </div>
    );
  }

  // Judging or revealed — both show the prompt header + either vote UI or reveal
  const { run, votedByYou, remaining } = phase;
  const allStoriesViewed = run.stories.every((s) => viewed.has(s.slot));

  return (
    <div>
      {/* Judge status bar */}
      <div className="mb-8 flex items-center justify-between gap-4 px-1">
        <span className="editorial-caps text-ink-muted">
          <span className="text-oxblood">§</span>&nbsp;&nbsp;The Bench
        </span>
        <span className="hairline flex-1" />
        <span className="editorial-caps text-ink-faint tabular-nums">
          {votedByYou.toLocaleString()} judged &nbsp;·&nbsp;{" "}
          {remaining.toLocaleString()} waiting
        </span>
      </div>

      {/* Prompt */}
      <header className="mx-auto mb-10 max-w-3xl text-center">
        <p className="editorial-caps text-ink-muted">Someone&apos;s prompt</p>
        <p className="mt-4 font-display text-xl italic leading-relaxed text-ink sm:text-2xl">
          &ldquo;{run.prompt}&rdquo;
        </p>
      </header>

      {phase.kind === "revealed" ? (
        <RevealPanel
          reveal={phase.reveal}
          chosenSlot={phase.chosenSlot}
          subtitle={`${phase.votedByYou.toLocaleString()} judged — ${phase.remaining.toLocaleString()} still waiting for you`}
          arena={arena}
          primaryAction={{
            label: `Next ${copy.unit.toLowerCase()}`,
            onClick: handleNext,
            loading: nextLoading,
          }}
        />
      ) : (
        <>
          <CompareGrid
            key={run.id}
            stories={run.stories}
            selectedSlot={selectedSlot}
            onSelect={setSelectedSlot}
            onViewed={handleViewed}
            onScrollDepth={handleScrollDepth}
            arena={arena}
          />
          <VotePanel
            runId={run.id}
            selectedSlot={selectedSlot}
            allStoriesViewed={allStoriesViewed}
            startTime={startTime}
            scrollDepths={scrollDepths}
            onVoted={handleVoted}
            arena={arena}
          />
        </>
      )}
    </div>
  );
}
