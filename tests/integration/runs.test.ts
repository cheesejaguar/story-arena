import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/generate-story", () => ({
  generateStory: vi.fn(async ({ modelSlug }) => ({
    modelSlug,
    outputText: `story-from-${modelSlug}`,
    latencyMs: 100,
    tokenInput: 10,
    tokenOutput: 50,
    finishReason: "stop",
  })),
}));

import { generateBenchmarkStories } from "@/lib/ai/benchmark-run";
import { generateStory } from "@/lib/ai/generate-story";

describe("generateBenchmarkStories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls all 3 models in parallel and returns 3 outputs", async () => {
    const out = await generateBenchmarkStories({
      prompt: "p",
      length: "medium",
      systemPromptVersion: "v1",
    });
    expect(generateStory).toHaveBeenCalledTimes(3);
    expect(out.results).toHaveLength(3);
    expect(out.results.map((r) => r.modelSlug).sort()).toEqual([
      "anthropic/claude-opus-4.6",
      "google/gemini-3.1-pro-preview",
      "openai/gpt-5.4",
    ]);
    expect(out.failed).toHaveLength(0);
  });

  it("reports failures without throwing", async () => {
    (generateStory as ReturnType<typeof vi.fn>).mockImplementationOnce(
      async () => {
        throw new Error("boom");
      },
    );
    const out = await generateBenchmarkStories({
      prompt: "p",
      length: "medium",
      systemPromptVersion: "v1",
    });
    expect(out.results).toHaveLength(2);
    expect(out.failed).toHaveLength(1);
    expect(out.failed[0]).toHaveProperty("modelSlug");
    expect(out.failed[0]).toHaveProperty("error");
  });

  it("uses the same prompt and length for every model (fairness)", async () => {
    await generateBenchmarkStories({
      prompt: "exact-prompt",
      length: "long",
      systemPromptVersion: "v1",
    });
    const calls = (generateStory as ReturnType<typeof vi.fn>).mock.calls;
    expect(calls).toHaveLength(3);
    for (const [arg] of calls) {
      expect(arg.prompt).toBe("exact-prompt");
      expect(arg.length).toBe("long");
      expect(arg.systemPromptVersion).toBe("v1");
    }
  });
});
