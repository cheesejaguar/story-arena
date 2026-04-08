import { describe, it, expect, vi, beforeEach } from "vitest";
import type { StoryMeta, StoryStreamEvent } from "@/lib/ai/generate-story";

// Helper that returns an async generator yielding the canned delta + done events.
function makeStream(modelSlug: string, throwAt?: "start" | "mid") {
  return async function* (): AsyncGenerator<StoryStreamEvent, void, void> {
    if (throwAt === "start") {
      throw new Error("boom");
    }
    yield { type: "delta", text: `story-from-` };
    if (throwAt === "mid") {
      throw new Error("boom mid-stream");
    }
    yield { type: "delta", text: modelSlug };
    const meta: StoryMeta = {
      modelSlug: modelSlug as StoryMeta["modelSlug"],
      outputText: `story-from-${modelSlug}`,
      latencyMs: 100,
      tokenInput: 10,
      tokenOutput: 50,
      finishReason: "stop",
    };
    yield { type: "done", meta };
  };
}

const generateStoryStreamMock = vi.fn();
vi.mock("@/lib/ai/generate-story", () => ({
  generateStoryStream: (input: { modelSlug: string }) => generateStoryStreamMock(input),
}));

import { streamBenchmarkRun } from "@/lib/ai/benchmark-run";
import type {
  BenchmarkStreamEvent,
  BenchmarkStreamResult,
} from "@/lib/ai/benchmark-run";

/**
 * Drive the streaming benchmark generator to completion, collecting every
 * event along the way and returning the final summary.
 */
async function collect(
  gen: AsyncGenerator<BenchmarkStreamEvent, BenchmarkStreamResult, void>,
) {
  const events: BenchmarkStreamEvent[] = [];
  let step = await gen.next();
  while (!step.done) {
    events.push(step.value);
    step = await gen.next();
  }
  return { events, summary: step.value };
}

describe("streamBenchmarkRun", () => {
  beforeEach(() => {
    generateStoryStreamMock.mockReset();
    generateStoryStreamMock.mockImplementation(({ modelSlug }: { modelSlug: string }) =>
      makeStream(modelSlug)(),
    );
  });

  it("streams all 3 models to completion and returns a full summary", async () => {
    const { events, summary } = await collect(
      streamBenchmarkRun({
        prompt: "p",
        length: "medium",
        systemPromptVersion: "v1",
      }),
    );

    // Called once per model
    expect(generateStoryStreamMock).toHaveBeenCalledTimes(3);

    // Every model produced a slot_done event
    const doneEvents = events.filter((e) => e.type === "slot_done");
    expect(doneEvents).toHaveLength(3);
    expect(new Set(doneEvents.map((e) => e.slot))).toEqual(new Set(["A", "B", "C"]));

    // Every model produced at least one slot_delta
    const deltaEvents = events.filter((e) => e.type === "slot_delta");
    expect(deltaEvents.length).toBeGreaterThanOrEqual(6); // 2 deltas per model mock

    // Summary has all 3 slots completed, no failures
    expect(Object.keys(summary.completed).sort()).toEqual(["A", "B", "C"]);
    expect(summary.failed).toHaveLength(0);

    // Slot assignment maps back to all 3 model slugs
    expect(
      Object.values(summary.slotAssignment).sort(),
    ).toEqual([
      "anthropic/claude-opus-4.6",
      "google/gemini-3.1-pro-preview",
      "openai/gpt-5.4",
    ]);

    // Each completed slot's modelSlug matches its slotAssignment entry
    for (const slot of ["A", "B", "C"] as const) {
      expect(summary.completed[slot]?.modelSlug).toBe(summary.slotAssignment[slot]);
    }
  });

  it("reports a mid-stream failure via slot_error without killing the run", async () => {
    let call = 0;
    generateStoryStreamMock.mockImplementation(({ modelSlug }: { modelSlug: string }) => {
      call += 1;
      return makeStream(modelSlug, call === 1 ? "start" : undefined)();
    });

    const { events, summary } = await collect(
      streamBenchmarkRun({
        prompt: "p",
        length: "medium",
        systemPromptVersion: "v1",
      }),
    );

    const errors = events.filter((e) => e.type === "slot_error");
    const dones = events.filter((e) => e.type === "slot_done");
    expect(errors.length).toBe(1);
    expect(dones.length).toBe(2);

    expect(Object.keys(summary.completed).length).toBe(2);
    expect(summary.failed.length).toBe(1);
    expect(summary.failed[0].error).toMatch(/boom/);
  });

  it("passes the same prompt, length and version to every model (fairness)", async () => {
    await collect(
      streamBenchmarkRun({
        prompt: "exact-prompt",
        length: "long",
        systemPromptVersion: "v1",
      }),
    );
    const calls = generateStoryStreamMock.mock.calls;
    expect(calls).toHaveLength(3);
    for (const [arg] of calls) {
      expect(arg.prompt).toBe("exact-prompt");
      expect(arg.length).toBe("long");
      expect(arg.systemPromptVersion).toBe("v1");
    }
  });
});
