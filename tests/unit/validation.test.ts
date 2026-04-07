import { describe, it, expect } from "vitest";
import { CreateRunSchema, SubmitVoteSchema } from "@/lib/utils/validation";

describe("CreateRunSchema", () => {
  it("accepts a valid run payload", () => {
    const parsed = CreateRunSchema.parse({ prompt: "Write a story", length: "medium" });
    expect(parsed.prompt).toBe("Write a story");
    expect(parsed.length).toBe("medium");
  });
  it("defaults length to medium", () => {
    const parsed = CreateRunSchema.parse({ prompt: "Write a story" });
    expect(parsed.length).toBe("medium");
  });
  it("rejects empty prompt", () => {
    expect(() => CreateRunSchema.parse({ prompt: "" })).toThrow();
  });
  it("rejects too-short prompt", () => {
    expect(() => CreateRunSchema.parse({ prompt: "hi" })).toThrow();
  });
  it("rejects too-long prompt", () => {
    expect(() => CreateRunSchema.parse({ prompt: "x".repeat(5000) })).toThrow();
  });
  it("rejects invalid length", () => {
    expect(() => CreateRunSchema.parse({ prompt: "Write a story", length: "xl" })).toThrow();
  });
});

describe("SubmitVoteSchema", () => {
  it("validates a complete vote payload", () => {
    const parsed = SubmitVoteSchema.parse({
      runId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      chosenSlot: "B",
      allStoriesViewed: true,
      timeToVoteMs: 1000,
      reason: "best pacing",
      scrollDepthA: 50,
      scrollDepthB: 100,
      scrollDepthC: 75,
    });
    expect(parsed.chosenSlot).toBe("B");
  });
  it("accepts minimal vote (no optional fields)", () => {
    const parsed = SubmitVoteSchema.parse({
      runId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
      chosenSlot: "A",
      allStoriesViewed: false,
      timeToVoteMs: 0,
    });
    expect(parsed.chosenSlot).toBe("A");
  });
  it("rejects invalid slot", () => {
    expect(() =>
      SubmitVoteSchema.parse({
        runId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        chosenSlot: "Z",
        allStoriesViewed: true,
        timeToVoteMs: 1000,
      }),
    ).toThrow();
  });
  it("rejects non-uuid runId", () => {
    expect(() =>
      SubmitVoteSchema.parse({
        runId: "not-a-uuid",
        chosenSlot: "A",
        allStoriesViewed: true,
        timeToVoteMs: 1000,
      }),
    ).toThrow();
  });
  it("rejects negative timeToVoteMs", () => {
    expect(() =>
      SubmitVoteSchema.parse({
        runId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        chosenSlot: "A",
        allStoriesViewed: true,
        timeToVoteMs: -1,
      }),
    ).toThrow();
  });
  it("rejects too-long reason", () => {
    expect(() =>
      SubmitVoteSchema.parse({
        runId: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        chosenSlot: "A",
        allStoriesViewed: true,
        timeToVoteMs: 1000,
        reason: "x".repeat(2000),
      }),
    ).toThrow();
  });
});
