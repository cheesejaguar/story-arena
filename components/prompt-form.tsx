"use client";

import { useCallback, useState } from "react";
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

/**
 * Events that the streaming /api/runs endpoint emits on a success path.
 * Each is one newline-delimited JSON object in the response body.
 */
type StreamEvent =
  | { type: "init"; runId: string }
  | { type: "slot_delta"; slot: Slot; text: string }
  | { type: "slot_done"; slot: Slot }
  | { type: "slot_error"; slot: Slot }
  | { type: "done"; runId: string; redirectTo: string }
  | { type: "error"; error: string };

type Phase = "idle" | "streaming" | "done";

export function PromptForm() {
  const [prompt, setPrompt] = useState("");
  const [length, setLength] = useState<LengthBucket>("medium");
  const [phase, setPhase] = useState<Phase>("idle");
  const [liveState, setLiveState] = useState<LiveState>(INITIAL_LIVE_STATE);

  const resetAll = useCallback(() => {
    setPhase("idle");
    setLiveState(INITIAL_LIVE_STATE);
    setPrompt("");
  }, []);

  const handleStreamEvent = useCallback((evt: StreamEvent) => {
    setLiveState((prev) => {
      switch (evt.type) {
        case "init":
          return { ...prev, runId: evt.runId };
        case "slot_delta":
          return {
            ...prev,
            texts: {
              ...prev.texts,
              [evt.slot]: (prev.texts[evt.slot] ?? "") + evt.text,
            },
          };
        case "slot_done": {
          const next = new Set(prev.slotsDone);
          next.add(evt.slot);
          return { ...prev, slotsDone: next };
        }
        case "slot_error": {
          const next = new Set(prev.slotsDone);
          next.add(evt.slot); // treat as "done but broken" so UI stops waiting
          return { ...prev, slotsDone: next };
        }
        case "done":
          return { ...prev, ready: true };
        case "error":
          return { ...prev, error: evt.error, ready: false };
        default:
          return prev;
      }
    });
    if (evt.type === "done") {
      setPhase("done");
    }
    if (evt.type === "error") {
      toast.error(evt.error);
      setPhase("done"); // terminal — the LiveCompare will render its error state
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase !== "idle") return;
    if (prompt.trim().length < 4) {
      toast.error("Please write a longer prompt (at least 4 characters).");
      return;
    }

    setPhase("streaming");
    setLiveState(INITIAL_LIVE_STATE);

    let res: Response;
    try {
      res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), length }),
      });
    } catch {
      toast.error("Network error. Try again.");
      setPhase("idle");
      return;
    }

    // Non-200 responses are plain JSON (rate limit, validation, moderation)
    // and don't carry a stream body.
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const msg =
        res.status === 429
          ? "You're going too fast. Try again in a bit."
          : res.status === 422
            ? data.error || "That prompt was blocked by moderation."
            : data.error || "Something went wrong. Try again.";
      toast.error(msg);
      setPhase("idle");
      return;
    }

    if (!res.body) {
      toast.error("No response body from the server.");
      setPhase("idle");
      return;
    }

    // Read NDJSON stream line-by-line.
    const reader = res.body
      .pipeThrough(new TextDecoderStream())
      .getReader();
    let buffer = "";
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const evt = JSON.parse(trimmed) as StreamEvent;
            handleStreamEvent(evt);
          } catch {
            // Malformed line — skip it rather than killing the stream.
          }
        }
      }
      // Flush any tail that arrived without a trailing newline.
      const tail = buffer.trim();
      if (tail) {
        try {
          handleStreamEvent(JSON.parse(tail) as StreamEvent);
        } catch {
          /* ignore */
        }
      }
    } catch {
      toast.error("The stream was interrupted. Try again.");
      setPhase("idle");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────
  if (phase === "streaming" || phase === "done") {
    return (
      <div className="space-y-8">
        <LiveCompare state={liveState} />
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
