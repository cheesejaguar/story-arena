import { describe, it, expect } from "vitest";
import { randomizeSlots } from "@/lib/utils/randomize-slots";

describe("randomizeSlots", () => {
  it("assigns each input to a unique slot A/B/C", () => {
    const result = randomizeSlots(["x", "y", "z"]);
    const slots = result.map((r) => r.slot);
    expect(new Set(slots)).toEqual(new Set(["A", "B", "C"]));
  });
  it("produces varied orderings over many runs", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const order = randomizeSlots(["x", "y", "z"]).map((r) => r.value).join("");
      seen.add(order);
    }
    // 6 possible permutations; statistically should observe >1
    expect(seen.size).toBeGreaterThan(1);
  });
  it("rejects inputs of wrong length", () => {
    expect(() => randomizeSlots(["x"])).toThrow();
    expect(() => randomizeSlots(["x", "y", "z", "w"])).toThrow();
  });
});
