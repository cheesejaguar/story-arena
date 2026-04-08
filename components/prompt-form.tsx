"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { LengthPicker } from "./length-picker";
import { ExamplePrompts } from "./example-prompts";
import type { LengthBucket } from "@/lib/utils/length";

export function PromptForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [length, setLength] = useState<LengthBucket>("medium");
  const [submitting, setSubmitting] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (prompt.trim().length < 4) {
      toast.error("Please write a longer prompt (at least 4 characters).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), length }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg =
          res.status === 429
            ? "You're going too fast. Try again in a bit."
            : res.status === 422
              ? data.error || "That prompt was blocked by moderation."
              : data.error || "Something went wrong. Try again.";
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      const { redirectTo } = await res.json();
      startTransition(() => router.push(redirectTo));
    } catch {
      toast.error("Network error. Try again.");
      setSubmitting(false);
    }
  }

  const charCount = prompt.trim().length;
  const canSubmit = charCount >= 4 && !submitting;

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
          placeholder="Write a fictional prompt. A scene, a what-if, a character at a turning point, a single image that demands a story…"
          rows={5}
          disabled={submitting}
          maxLength={4000}
          className="resize-none rounded-none border-0 border-y border-ink/80 bg-transparent px-0 py-5 font-serif text-lg italic leading-relaxed text-ink placeholder:text-ink-faint placeholder:italic focus-visible:border-oxblood focus-visible:ring-0 focus-visible:ring-offset-0"
        />
      </div>

      {/* ── Example prompts from the archive ────────────────────────── */}
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
            <LengthPicker value={length} onChange={setLength} disabled={submitting} />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={!canSubmit}
            className="group relative rounded-none border border-ink bg-ink px-8 py-6 font-display text-lg italic font-normal text-paper shadow-none transition-all hover:bg-oxblood-deep hover:border-oxblood-deep disabled:border-rule disabled:bg-paper-deep disabled:text-ink-faint"
          >
            <span className="editorial-caps mr-3 text-paper/60 group-hover:text-paper/70 group-disabled:text-ink-faint">
              {submitting ? "Setting type" : "Generate stories"}
            </span>
            <span className="text-xl not-italic">
              {submitting ? "…" : "→"}
            </span>
          </Button>
        </div>

        {submitting && (
          <div className="mt-6 text-center">
            <p className="font-serif italic text-sm text-ink-muted">
              Three frontier models are composing in parallel. The press runs
              slowly — <span className="text-ink">expect 20 to 60 seconds</span>.
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
