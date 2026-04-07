import { describe, it, expect } from "vitest";
import { hashPrompt } from "@/lib/utils/hash";

describe("hashPrompt", () => {
  it("returns a stable 64-char hex string", () => {
    const h = hashPrompt("Write a story about a robot.");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(hashPrompt("Write a story about a robot."));
  });
  it("differs across inputs", () => {
    expect(hashPrompt("a")).not.toBe(hashPrompt("b"));
  });
});
