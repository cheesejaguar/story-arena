import { describe, it, expect, vi, beforeEach } from "vitest";

const generateTextMock = vi.fn();
vi.mock("ai", async () => {
  const actual = await vi.importActual<typeof import("ai")>("ai");
  return {
    ...actual,
    generateText: (...args: unknown[]) => generateTextMock(...args),
  };
});

import { moderatePrompt } from "@/lib/moderation/moderate-prompt";

describe("moderatePrompt", () => {
  beforeEach(() => generateTextMock.mockReset());

  it("rejects too-short prompts without calling the SDK", async () => {
    const r = await moderatePrompt("hi");
    expect(r).toEqual({ allowed: false, reason: "Prompt too short" });
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("rejects too-long prompts without calling the SDK", async () => {
    const r = await moderatePrompt("x".repeat(5000));
    expect(r).toEqual({ allowed: false, reason: "Prompt too long" });
    expect(generateTextMock).not.toHaveBeenCalled();
  });

  it("allows mid-length prompts when SDK approves", async () => {
    generateTextMock.mockResolvedValueOnce({
      output: { allowed: true },
    });
    const r = await moderatePrompt("Write a story about a lighthouse keeper.");
    expect(r).toEqual({ allowed: true });
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it("blocks when SDK marks as disallowed", async () => {
    generateTextMock.mockResolvedValueOnce({
      output: { allowed: false, reason: "policy violation" },
    });
    const r = await moderatePrompt("Some prompt that gets blocked.");
    expect(r).toEqual({ allowed: false, reason: "policy violation" });
  });

  it("fails open when the SDK throws", async () => {
    generateTextMock.mockRejectedValueOnce(new Error("network down"));
    const r = await moderatePrompt("Write a story about a robot.");
    expect(r).toEqual({ allowed: true });
  });
});
