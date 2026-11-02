import { describe, it, expect } from "vitest";
import { getSystemPrompt } from "@/lib/ai/prompts";
import { JOKE_SYSTEM_PROMPT_VERSION } from "@/lib/arena";

describe("getSystemPrompt", () => {
  it("returns versioned text and rejects unknown version", () => {
    const v1 = getSystemPrompt("v1");
    expect(v1).toContain("anonymous story completions");
    expect(v1).toContain("Output ONLY the story");
    expect(v1).toContain("No meta-commentary");
    expect(v1).toContain("Markdown");
    expect(() => getSystemPrompt("v999")).toThrow();
  });

  it("has a joke prompt under the joke version tag", () => {
    const joke = getSystemPrompt(JOKE_SYSTEM_PROMPT_VERSION);
    expect(joke).toContain("ONE original joke");
    expect(joke).toContain("Output ONLY the joke");
  });
});
