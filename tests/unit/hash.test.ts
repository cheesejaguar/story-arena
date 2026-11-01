import { describe, it, expect } from "vitest";
import { buildDedupeKey, hashPrompt, normalizePrompt } from "@/lib/utils/hash";

describe("hashPrompt", () => {
  it("returns a stable 64-char hex string", () => {
    const h = hashPrompt("Write a story about a robot.");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(h).toBe(hashPrompt("Write a story about a robot."));
  });
  it("differs across inputs", () => {
    expect(hashPrompt("a")).not.toBe(hashPrompt("b"));
  });
  it("normalizes whitespace and case before hashing", () => {
    expect(normalizePrompt("  Write   A Story  ")).toBe("write a story");
    expect(hashPrompt("  Write   A Story  ")).toBe(hashPrompt("write a story"));
  });
});

describe("buildDedupeKey", () => {
  const base = {
    prompt: "A story about a robot.",
    length: "medium" as const,
    rosterId: "2026-Q4",
    systemPromptVersion: "v1",
  };

  it("is stable for identical conditions", () => {
    expect(buildDedupeKey(base)).toBe(buildDedupeKey({ ...base }));
  });

  it("changes when any replay condition changes", () => {
    const key = buildDedupeKey(base);
    expect(buildDedupeKey({ ...base, length: "long" })).not.toBe(key);
    expect(buildDedupeKey({ ...base, rosterId: "legacy-2026-Q2" })).not.toBe(key);
    expect(buildDedupeKey({ ...base, systemPromptVersion: "v2" })).not.toBe(key);
    expect(buildDedupeKey({ ...base, prompt: "A different prompt." })).not.toBe(key);
  });
});
