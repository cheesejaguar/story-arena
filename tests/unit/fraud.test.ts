import { describe, expect, it } from "vitest";
import { computeFraudScore } from "@/lib/utils/fraud";

describe("computeFraudScore", () => {
  it("gives a clean, slow, fully-read vote a score of zero", () => {
    expect(
      computeFraudScore({
        timeToVoteMs: 30_000,
        allStoriesViewed: true,
        scrollDepths: [80, 75, 90],
      }),
    ).toBe(0);
  });

  it("flags instant votes, unseen stories, and shallow reading", () => {
    expect(
      computeFraudScore({
        timeToVoteMs: 500,
        allStoriesViewed: false,
        scrollDepths: [undefined, 5, 10],
      }),
    ).toBe(70);
  });

  it("never exceeds 100", () => {
    expect(
      computeFraudScore({
        timeToVoteMs: 0,
        allStoriesViewed: false,
        scrollDepths: [],
      }),
    ).toBe(70);
  });
});
