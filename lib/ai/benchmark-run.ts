import { BENCHMARK_MODELS } from "./models";
import { generateStory, type GeneratedStory } from "./generate-story";
import type { LengthBucket } from "@/lib/utils/length";

export type BenchmarkInput = {
  prompt: string;
  length: LengthBucket;
  systemPromptVersion: string;
};

export type BenchmarkResult = {
  results: GeneratedStory[];
  failed: { modelSlug: string; error: string }[];
};

export async function generateBenchmarkStories(
  input: BenchmarkInput,
): Promise<BenchmarkResult> {
  const settled = await Promise.allSettled(
    BENCHMARK_MODELS.map((m) =>
      generateStory({
        prompt: input.prompt,
        modelSlug: m.slug,
        length: input.length,
        systemPromptVersion: input.systemPromptVersion,
      }),
    ),
  );

  const results: GeneratedStory[] = [];
  const failed: BenchmarkResult["failed"] = [];
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") {
      results.push(r.value);
    } else {
      failed.push({
        modelSlug: BENCHMARK_MODELS[i].slug,
        error: String(r.reason),
      });
    }
  });
  return { results, failed };
}
