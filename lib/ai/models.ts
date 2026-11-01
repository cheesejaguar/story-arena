/**
 * Model registry and benchmark seasons.
 *
 * The app compares exactly three models at a time. A "roster" freezes that
 * trio for a season so that historical runs, votes, and seed data keep
 * resolving their model labels even after the active roster rotates.
 *
 * Pricing is stored per million tokens, in USD. Cost helpers return
 * micro-USD (1e-6 USD) so the database can store exact integers.
 */

export const ACTIVE_ROSTER_ID = "2026-Q4";
export const LEGACY_ROSTER_ID = "legacy-2026-Q2";

export type Provider = "openai" | "anthropic" | "google";

export type LegacyModelSlug =
  | "openai/gpt-5.4"
  | "anthropic/claude-opus-4.6"
  | "google/gemini-3.1-pro-preview";

export type ActiveModelSlug =
  | "openai/gpt-6.1-sol"
  | "anthropic/claude-opus-5.5"
  | "google/gemini-4-argon";

export type AuxiliaryModelSlug = "openai/gpt-6-luna";

export type ModelSlug = LegacyModelSlug | ActiveModelSlug | AuxiliaryModelSlug;

export type ModelPricing = {
  /** USD per 1M input tokens. */
  inputPerMillionUsd: number;
  /** USD per 1M output tokens. */
  outputPerMillionUsd: number;
};

/**
 * Provider-specific reasoning configuration. We keep reasoning at the
 * lowest level each model supports: fiction benefits little from deep
 * chain-of-thought, and reasoning tokens are billed as output.
 */
export type ReasoningConfig =
  | {
      provider: "openai";
      reasoningEffort: "none" | "minimal" | "low" | "medium" | "high" | "xhigh";
    }
  | {
      provider: "anthropic";
      effort: "low" | "medium" | "high" | "max";
    }
  | {
      provider: "google";
      thinkingLevel: "minimal" | "low" | "medium" | "high";
    };

export type BenchmarkModel = {
  key: string;
  label: string;
  provider: Provider;
  slug: ModelSlug;
  pricing: ModelPricing;
  contextWindow: number;
  /** ISO date the model was released on AI Gateway. */
  released: string;
  reasoning?: ReasoningConfig;
};

export type ModelRoster = {
  id: string;
  label: string;
  /** Human-facing season label. */
  season: string;
  activeFrom: string;
  models: readonly [BenchmarkModel, BenchmarkModel, BenchmarkModel];
};

/* ── Active season ───────────────────────────────────────────────────── */

const GPT_61_SOL: BenchmarkModel = {
  key: "gpt61sol",
  label: "GPT-6.1 Sol",
  provider: "openai",
  slug: "openai/gpt-6.1-sol",
  pricing: { inputPerMillionUsd: 2, outputPerMillionUsd: 10 },
  contextWindow: 1_050_000,
  released: "2026-09-29",
  // Sol does not expose a "none" reasoning level; low is the floor.
  reasoning: { provider: "openai", reasoningEffort: "low" },
};

const CLAUDE_OPUS_55: BenchmarkModel = {
  key: "opus55",
  label: "Claude Opus 5.5",
  provider: "anthropic",
  slug: "anthropic/claude-opus-5.5",
  pricing: { inputPerMillionUsd: 4, outputPerMillionUsd: 20 },
  contextWindow: 1_000_000,
  released: "2026-09-22",
  // Opus 5.5 supports effort low..max, but not a full disable.
  reasoning: { provider: "anthropic", effort: "low" },
};

const GEMINI_4_ARGON: BenchmarkModel = {
  key: "gemini4argon",
  label: "Gemini 4 Argon",
  provider: "google",
  slug: "google/gemini-4-argon",
  pricing: { inputPerMillionUsd: 2, outputPerMillionUsd: 10 },
  contextWindow: 1_000_000,
  released: "2026-10-13",
  reasoning: { provider: "google", thinkingLevel: "low" },
};

/* ── Historical season ───────────────────────────────────────────────── */

const GPT_54: BenchmarkModel = {
  key: "gpt54",
  label: "GPT-5.4",
  provider: "openai",
  slug: "openai/gpt-5.4",
  pricing: { inputPerMillionUsd: 2.5, outputPerMillionUsd: 15 },
  contextWindow: 1_050_000,
  released: "2026-03-05",
};

const CLAUDE_OPUS_46: BenchmarkModel = {
  key: "opus46",
  label: "Claude Opus 4.6",
  provider: "anthropic",
  slug: "anthropic/claude-opus-4.6",
  pricing: { inputPerMillionUsd: 5, outputPerMillionUsd: 25 },
  contextWindow: 1_000_000,
  released: "2026-02-05",
};

const GEMINI_31_PRO: BenchmarkModel = {
  key: "gemini31pro",
  label: "Gemini 3.1 Pro",
  provider: "google",
  slug: "google/gemini-3.1-pro-preview",
  pricing: { inputPerMillionUsd: 2, outputPerMillionUsd: 12 },
  contextWindow: 1_000_000,
  released: "2026-02-19",
};

/* ── Auxiliary models (not part of the benchmark) ────────────────────── */

export const MODERATION_MODEL: BenchmarkModel = {
  key: "gpt6luna",
  label: "GPT-6 Luna",
  provider: "openai",
  slug: "openai/gpt-6-luna",
  pricing: { inputPerMillionUsd: 0.1, outputPerMillionUsd: 0.5 },
  contextWindow: 1_050_000,
  released: "2026-09-22",
  reasoning: { provider: "openai", reasoningEffort: "none" },
};

/* ── Registry ────────────────────────────────────────────────────────── */

export const MODEL_ROSTERS: Record<string, ModelRoster> = {
  [ACTIVE_ROSTER_ID]: {
    id: ACTIVE_ROSTER_ID,
    label: "Season 2026 · Q4",
    season: "2026-Q4",
    activeFrom: "2026-10-01",
    models: [GPT_61_SOL, CLAUDE_OPUS_55, GEMINI_4_ARGON],
  },
  [LEGACY_ROSTER_ID]: {
    id: LEGACY_ROSTER_ID,
    label: "Season 2026 · Q2",
    season: "2026-Q2",
    activeFrom: "2026-04-01",
    models: [GPT_54, CLAUDE_OPUS_46, GEMINI_31_PRO],
  },
};

export const ACTIVE_ROSTER: ModelRoster = MODEL_ROSTERS[ACTIVE_ROSTER_ID]!;

/** Backwards-compatible alias used across the app. */
export const BENCHMARK_MODELS = ACTIVE_ROSTER.models;

export const ALL_MODELS: BenchmarkModel[] = [
  ...Object.values(MODEL_ROSTERS).flatMap((roster) => [...roster.models]),
  MODERATION_MODEL,
];

export const MODEL_BY_SLUG: Map<string, BenchmarkModel> = new Map(
  ALL_MODELS.map((model) => [model.slug, model]),
);

export function getModelBySlug(slug: string): BenchmarkModel | undefined {
  return MODEL_BY_SLUG.get(slug);
}

export function getModelLabel(slug: string): string {
  return MODEL_BY_SLUG.get(slug)?.label ?? slug;
}

export function getRoster(id?: string | null): ModelRoster {
  if (id && MODEL_ROSTERS[id]) return MODEL_ROSTERS[id]!;
  return ACTIVE_ROSTER;
}

export function isKnownRosterId(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(MODEL_ROSTERS, id);
}

/* ── Provider options ────────────────────────────────────────────────── */

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type AiProviderOptions = Record<string, Record<string, JsonValue>>;

/**
 * Translate our normalized reasoning config into the provider-specific
 * options that AI Gateway forwards to each upstream provider.
 */
export function reasoningProviderOptions(
  model: BenchmarkModel,
): AiProviderOptions {
  const reasoning = model.reasoning;
  if (!reasoning) return {};

  switch (reasoning.provider) {
    case "openai":
      return { openai: { reasoningEffort: reasoning.reasoningEffort } };
    case "anthropic":
      return { anthropic: { effort: reasoning.effort } };
    case "google":
      return {
        google: { thinkingConfig: { thinkingLevel: reasoning.thinkingLevel } },
      };
  }
}

/* ── Cost helpers ────────────────────────────────────────────────────── */

/**
 * Cost in micro-USD. Because pricing is USD per 1M tokens,
 * `tokens * pricePerMillion` is already micro-USD.
 */
export function costMicroUsd(
  model: BenchmarkModel,
  inputTokens: number,
  outputTokens: number,
): number {
  return Math.max(
    0,
    Math.round(
      inputTokens * model.pricing.inputPerMillionUsd +
        outputTokens * model.pricing.outputPerMillionUsd,
    ),
  );
}

export function estimateRunCostMicroUsd(
  roster: ModelRoster,
  inputTokensPerModel: number,
  outputTokensPerModel: number,
): number {
  return roster.models.reduce(
    (sum, model) =>
      sum + costMicroUsd(model, inputTokensPerModel, outputTokensPerModel),
    0,
  );
}
