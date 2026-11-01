import { describe, expect, it } from "vitest";
import {
  ACTIVE_ROSTER,
  LEGACY_ROSTER_ID,
  MODEL_BY_SLUG,
  MODEL_ROSTERS,
  costMicroUsd,
  getModelLabel,
  getRoster,
  reasoningProviderOptions,
} from "@/lib/ai/models";

describe("model seasons", () => {
  it("keeps exactly three distinct models in each roster", () => {
    for (const roster of Object.values(MODEL_ROSTERS)) {
      expect(roster.models).toHaveLength(3);
      expect(new Set(roster.models.map((model) => model.slug)).size).toBe(3);
    }
  });

  it("resolves historical slugs after a season rotates", () => {
    expect(MODEL_BY_SLUG.get("openai/gpt-5.4")?.label).toBe("GPT-5.4");
    expect(MODEL_BY_SLUG.get("anthropic/claude-opus-4.6")?.label).toBe(
      "Claude Opus 4.6",
    );
    expect(MODEL_BY_SLUG.get("google/gemini-3.1-pro-preview")?.label).toBe(
      "Gemini 3.1 Pro",
    );
    expect(getModelLabel("openai/not-a-real-model")).toBe("openai/not-a-real-model");
  });

  it("falls back to the active roster for unknown season ids", () => {
    expect(getRoster(LEGACY_ROSTER_ID).season).toBe("2026-Q2");
    expect(getRoster("does-not-exist").id).toBe(ACTIVE_ROSTER.id);
    expect(getRoster(null).id).toBe(ACTIVE_ROSTER.id);
  });

  it("emits provider-specific reasoning options at the lowest effort", () => {
    const [openai, anthropic, google] = ACTIVE_ROSTER.models;
    expect(reasoningProviderOptions(openai)).toEqual({
      openai: { reasoningEffort: "low" },
    });
    expect(reasoningProviderOptions(anthropic)).toEqual({
      anthropic: { effort: "low" },
    });
    expect(reasoningProviderOptions(google)).toEqual({
      google: { thinkingConfig: { thinkingLevel: "low" } },
    });
  });
});

describe("costMicroUsd", () => {
  it("converts per-million pricing into integer micro-USD", () => {
    const model = ACTIVE_ROSTER.models[0];
    // 1M input at $2 + 1M output at $10 = $12 = 12,000,000 micro-USD.
    expect(costMicroUsd(model, 1_000_000, 1_000_000)).toBe(12_000_000);
    expect(costMicroUsd(model, 0, 0)).toBe(0);
    expect(costMicroUsd(model, -10, -10)).toBe(0);
  });
});
