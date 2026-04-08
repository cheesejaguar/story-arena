import { BENCHMARK_MODELS, type BenchmarkModel } from "./models";
import { generateStoryStream, type StoryMeta } from "./generate-story";
import { randomizeSlots, type Slot } from "@/lib/utils/randomize-slots";
import { AsyncQueue } from "@/lib/utils/async-queue";
import type { LengthBucket } from "@/lib/utils/length";

export type BenchmarkInput = {
  prompt: string;
  length: LengthBucket;
  systemPromptVersion: string;
};

/**
 * Events yielded by the streaming orchestrator. Ordered as they happen across
 * all three models, with each delta tagged by its slot so a client can route
 * it to the right card.
 */
export type BenchmarkStreamEvent =
  | { type: "slot_delta"; slot: Slot; text: string }
  | { type: "slot_done"; slot: Slot; meta: StoryMeta }
  | { type: "slot_error"; slot: Slot; modelSlug: string; error: string };

/** Final summary returned after the generator finishes. */
export type BenchmarkStreamResult = {
  /** Map from slot label (A/B/C) to the model slug randomly assigned to it. */
  slotAssignment: Record<Slot, string>;
  /** Successfully completed slots, keyed by slot label. */
  completed: Partial<Record<Slot, StoryMeta>>;
  /** Failed slots. */
  failed: { slot: Slot; modelSlug: string; error: string }[];
};

/**
 * Run a benchmark across all three models, streaming interleaved deltas as
 * they arrive. Slot randomization happens BEFORE any model is called, so the
 * assignment is deterministic within a single run and persisted alongside
 * each delta. The client sees the slot layout immediately and fills cards
 * as text arrives.
 *
 * Usage:
 *   const gen = streamBenchmarkRun({...});
 *   let result: IteratorResult<BenchmarkStreamEvent, BenchmarkStreamResult>;
 *   while (!(result = await gen.next()).done) {
 *     yieldEventToClient(result.value);
 *   }
 *   const summary = result.value; // BenchmarkStreamResult
 */
export async function* streamBenchmarkRun(
  input: BenchmarkInput,
): AsyncGenerator<BenchmarkStreamEvent, BenchmarkStreamResult, void> {
  // Shuffle models into slots A, B, C using the crypto-grade randomizer.
  const slotted = randomizeSlots([...BENCHMARK_MODELS]);
  const slotAssignment = Object.fromEntries(
    slotted.map(({ slot, value }) => [slot, value.slug]),
  ) as Record<Slot, string>;

  const queue = new AsyncQueue<BenchmarkStreamEvent>();
  const completed: Partial<Record<Slot, StoryMeta>> = {};
  const failed: { slot: Slot; modelSlug: string; error: string }[] = [];
  let runningCount = slotted.length;

  // Kick off all 3 generators concurrently. Each drains into the shared queue.
  for (const { slot, value } of slotted) {
    const model: BenchmarkModel = value;
    void (async () => {
      try {
        for await (const evt of generateStoryStream({
          prompt: input.prompt,
          modelSlug: model.slug,
          length: input.length,
          systemPromptVersion: input.systemPromptVersion,
        })) {
          if (evt.type === "delta") {
            queue.push({ type: "slot_delta", slot, text: evt.text });
          } else {
            completed[slot] = evt.meta;
            queue.push({ type: "slot_done", slot, meta: evt.meta });
          }
        }
      } catch (err) {
        const entry = {
          slot,
          modelSlug: model.slug,
          error: err instanceof Error ? err.message : String(err),
        };
        failed.push(entry);
        queue.push({ type: "slot_error", ...entry });
      } finally {
        runningCount--;
        if (runningCount === 0) {
          queue.close();
        }
      }
    })();
  }

  // Consume the queue and forward events to the caller.
  for await (const evt of queue) {
    yield evt;
  }

  return { slotAssignment, completed, failed };
}
