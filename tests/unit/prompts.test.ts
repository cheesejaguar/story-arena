import { describe, it, expect } from "vitest";
import { getSystemPrompt } from "@/lib/ai/prompts";

describe("getSystemPrompt", () => {
  it("returns versioned text and rejects unknown version", () => {
    const v1 = getSystemPrompt("v1");
    expect(v1).toContain("anonymous story completions");
    expect(v1).toContain("Output only the story");
    expect(() => getSystemPrompt("v999")).toThrow();
  });
});
