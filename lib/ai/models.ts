export const BENCHMARK_MODELS = [
  { key: "gpt54", label: "GPT-5.4", provider: "openai", slug: "openai/gpt-5.4" },
  { key: "opus46", label: "Claude Opus 4.6", provider: "anthropic", slug: "anthropic/claude-opus-4.6" },
  { key: "gemini31pro", label: "Gemini 3.1 Pro", provider: "google", slug: "google/gemini-3.1-pro-preview" },
] as const;

export type BenchmarkModel = (typeof BENCHMARK_MODELS)[number];
export type ModelSlug = BenchmarkModel["slug"];
