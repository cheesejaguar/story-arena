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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-3">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write a fictional prompt. A scene, a what-if, a character at a turning point..."
          rows={4}
          disabled={submitting}
          className="resize-none border-border bg-card text-base leading-relaxed font-serif"
          maxLength={4000}
        />
        <ExamplePrompts onPick={(t) => setPrompt(t)} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Length</span>
          <LengthPicker value={length} onChange={setLength} disabled={submitting} />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={submitting || prompt.trim().length < 4}
          className="min-w-[10rem]"
        >
          {submitting ? "Generating stories…" : "Generate stories"}
        </Button>
      </div>

      {submitting && (
        <p className="text-center text-xs text-muted-foreground">
          Three frontier models are writing in parallel. This usually takes 20–60 seconds.
        </p>
      )}
    </form>
  );
}
