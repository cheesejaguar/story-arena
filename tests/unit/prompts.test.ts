import { describe, it, expect } from "vitest";
import { getSystemPrompt } from "@/lib/ai/prompts";

describe("getSystemPrompt", () => {
  it("returns versioned text and rejects unknown version", () => {
    const v1 = getSystemPrompt("v1");
    expect(v1).toContain("anonymous story completions");
    expect(v1).toContain("Output ONLY the story");
    expect(v1).toContain("No meta-commentary");
    expect(v1).toContain("Markdown");
    expect(() => getSystemPrompt("v999")).toThrow();
  });
});
