"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LengthPicker } from "./length-picker";
import { ExamplePrompts } from "./example-prompts";
import {
  LiveCompare,
  INITIAL_LIVE_STATE,
  type LiveState,
} from "./live-compare";
import type { LengthBucket } from "@/lib/utils/length";
import type { Slot } from "@/lib/utils/randomize-slots";
import type { RunStreamEvent } from "@/lib/utils/stream-protocol";

type Phase = "idle" | "streaming" | "done";

type PendingFrame = {
  deltas: Partial<Record<Slot, string>>;
  done: Slot[];
  runId?: string;
  ready?: boolean;
  error?: string;
  hasChanges: boolean;
};

function emptyFrame(): PendingFrame {
  return { deltas: {}, done: [], hasChanges: false };
}

/**
 * Coalesces stream events into one React update per animation frame. Without
 * this, a 900-token story produces hundreds of renders per second across
 * three cards.
 */
export function PromptForm() {
  const [prompt, setPrompt] = useState("");
  const [length, setLength] = useState<LengthBucket>("medium");
  const [phase, setPhase] = useState<Phase>("idle");
  const [liveState, setLiveState] = useState<LiveState>(INITIAL_LIVE_STATE);

  const abortRef = useRef<AbortController | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<PendingFrame>(emptyFrame());
  const mountedRef = useRef(true);
  // Reuse the key when the user retries the same prompt after a network
  // failure. Without this, a retry while the first run is still pending would
  // start (and pay for) a second generation.
  const lastAttemptRef = useRef<{
    key: string;
    prompt: string;
    length: LengthBucket;
  } | null>(null);

  const flush = useCallback(() => {
    frameRef.current = null;
    const pending = pendingRef.current;
    if (!pending.hasChanges) return;
    pendingRef.current = emptyFrame();

    setLiveState((prev) => {
      const texts = { ...prev.texts };
      for (const slot of ["A", "B", "C"] as Slot[]) {
        const chunk = pending.deltas[slot];
        if (chunk) texts[slot] += chunk;
      }
      const slotsDone = new Set(prev.slotsDone);
      for (const slot of pending.done) slotsDone.add(slot);
      return {
        ...prev,
        runId: pending.runId ?? prev.runId,
        texts,
        slotsDone,
        ready: pending.ready ?? prev.ready,
        error: pending.error ?? prev.error,
      };
    });
  }, []);

  const scheduleFlush = useCallback(() => {
    if (frameRef.current != null) return;
    frameRef.current = requestAnimationFrame(flush);
  }, [flush]);

  const handleStreamEvent = useCallback(
    (evt: RunStreamEvent) => {
      const pending = pendingRef.current;
      pending.hasChanges = true;

      switch (evt.type) {
        case "init":
          pending.runId = evt.runId;
          break;
        case "slot_delta":
          pending.deltas[evt.slot] =
            (pending.deltas[evt.slot] ?? "") + evt.text;
          break;
        case "slot_done":
        case "slot_error":
          pending.done.push(evt.slot);
          break;
        case "done":
          pending.ready = true;
          pending.runId = evt.runId;
          // The action succeeded; a later submit is a new action.
          lastAttemptRef.current = null;
          break;
        case "error":
          pending.error = evt.error;
          break;
      }

      scheduleFlush();

      if (evt.type === "done") setPhase("done");
      if (evt.type === "error") {
        toast.error(evt.error);
        setPhase("done");
      }
    },
    [scheduleFlush],
  );

  const resetAll = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    pendingRef.current = emptyFrame();
    setPhase("idle");
    setLiveState(INITIAL_LIVE_STATE);
    setPrompt("");
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "idle") return;
    if (prompt.trim().length < 4) {
      toast.error("Please write a longer prompt (at least 4 characters).");
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setPhase("streaming");
    setLiveState(INITIAL_LIVE_STATE);
    pendingRef.current = emptyFrame();

    const trimmedPrompt = prompt.trim();
    const previousAttempt = lastAttemptRef.current;
    const idempotencyKey =
      previousAttempt &&
      previousAttempt.prompt === trimmedPrompt &&
      previousAttempt.length === length
        ? previousAttempt.key
        : typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    lastAttemptRef.current = {
      key: idempotencyKey,
      prompt: trimmedPrompt,
      length,
    };

    let res: Response;
    try {
      res = await fetch("/api/runs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({ prompt: trimmedPrompt, length }),
        signal: controller.signal,
      });
    } catch {
      if (controller.signal.aborted) return;
      toast.error("Network error. Try again.");
      if (mountedRef.current) setPhase("idle");
      return;
    }

    // Non-200 responses are plain JSON (rate limit, validation, moderation)
    // and don't carry a stream body.
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        code?: string;
      };
      const msg =
        res.status === 429 && data.code === "DAILY_SPEND_CAP"
          ? "The daily generation budget is exhausted. Try again tomorrow."
          : res.status === 429
            ? "You're going too fast. Try again in a bit."
            : res.status === 409 && data.code === "RUN_IN_PROGRESS"
              ? "This run is already being generated. Give it a moment."
              : res.status === 422
                ? data.error || "That prompt was blocked by moderation."
                : res.status === 503
                  ? "The press is at capacity. Try again in a moment."
                  : data.error || "Something went wrong. Try again.";
      toast.error(msg);
      if (mountedRef.current) setPhase("idle");
      return;
    }

    if (!res.body) {
      toast.error("No response body from the server.");
      if (mountedRef.current) setPhase("idle");
      return;
    }

    // Read NDJSON stream line-by-line.
    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    let terminal = false;

    const dispatchLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const evt = JSON.parse(trimmed) as RunStreamEvent;
        if (evt.type === "done" || evt.type === "error") terminal = true;
        handleStreamEvent(evt);
      } catch {
        // Malformed line — skip it rather than killing the stream.
      }
    };

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) dispatchLine(line);
      }
      // Flush any tail that arrived without a trailing newline.
      dispatchLine(buffer);

      if (!terminal && !controller.signal.aborted) {
        toast.error("The stream ended unexpectedly. Try again.");
        if (mountedRef.current) setPhase("idle");
      }
    } catch {
      if (controller.signal.aborted) return;
      toast.error("The stream was interrupted. Try again.");
      if (mountedRef.current) setPhase("idle");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  if (phase === "streaming" || phase === "done") {
    return (
      <div className="space-y-8">
        <LiveCompare
          key={liveState.runId ?? "pending"}
          state={liveState}
        />
        {(liveState.ready || liveState.error) && (
          <div className="mx-auto mt-6 max-w-md text-center">
            <button
              type="button"
              onClick={resetAll}
              className="editorial-caps text-ink-muted underline underline-offset-4 hover:text-oxblood"
            >
              ← New prompt
            </button>
          </div>
        )}
      </div>
    );
  }

  const charCount = prompt.trim().length;
  const canSubmit = charCount >= 4 && phase === "idle";

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* ── Prompt section ──────────────────────────────────────────── */}
      <div>
        <div className="mb-4 flex items-baseline gap-4">
          <span className="editorial-caps text-ink-muted">
            <span className="text-oxblood">§</span>&nbsp;&nbsp;The Prompt
          </span>
          <span className="hairline flex-1" />
          <span className="editorial-caps text-ink-faint tabular-nums">
            {charCount.toString().padStart(4, "0")} / 4000
          </span>
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write a fictional prompt — or borrow one from the Reddit archive below."
          rows={5}
          maxLength={4000}
          className="resize-none rounded-none border-0 border-y border-ink/80 bg-transparent px-0 py-5 font-serif text-lg italic leading-relaxed text-ink placeholder:text-ink-faint placeholder:italic focus-visible:border-oxblood focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* ── Curated prompts from Reddit ─────────────────────────────── */}
      <ExamplePrompts onPick={(t) => setPrompt(t)} />

      {/* ── Submission row ──────────────────────────────────────────── */}
      <div>
        <div className="mb-6 flex items-center gap-4">
          <span className="hairline flex-1" />
          <span className="text-oxblood text-sm leading-none">❦</span>
          <span className="hairline flex-1" />
        </div>

        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="editorial-caps text-ink-muted">Length</span>
            <LengthPicker value={length} onChange={setLength} disabled={false} />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit}
            className="group relative rounded-none border border-ink bg-ink px-8 py-6 font-display text-lg italic font-normal text-paper shadow-none transition-all hover:bg-oxblood-deep hover:border-oxblood-deep disabled:border-rule disabled:bg-paper-deep disabled:text-ink-faint"
          >
            <span className="editorial-caps mr-3 text-paper/60 group-hover:text-paper/70 group-disabled:text-ink-faint">
              Generate stories
            </span>
            <span className="text-xl not-italic">→</span>
          </Button>
        </div>
      </div>
    </form>
  );
}
