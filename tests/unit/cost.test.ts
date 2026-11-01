import { describe, expect, it } from "vitest";
import { ACTIVE_ROSTER } from "@/lib/ai/models";
import {
  estimatePromptTokens,
  estimateRunCostMicroUsdForPrompt,
  formatUsdMicro,
  microUsdToUsd,
} from "@/lib/utils/cost";

describe("cost formatting", () => {
  it("renders micro-USD at an appropriate precision", () => {
    expect(formatUsdMicro(null)).toBe("—");
    expect(formatUsdMicro(0)).toBe("$0");
    expect(formatUsdMicro(5_000)).toBe("$0.0050");
    expect(formatUsdMicro(1_500_000)).toBe("$1.50");
    expect(microUsdToUsd(2_500_000)).toBe(2.5);
  });
});

describe("run cost estimation", () => {
  it("includes prompt overhead and scales with length", () => {
    const short = estimateRunCostMicroUsdForPrompt(ACTIVE_ROSTER, "A prompt", "short");
    const long = estimateRunCostMicroUsdForPrompt(ACTIVE_ROSTER, "A prompt", "long");
    expect(short).toBeGreaterThan(0);
    expect(long).toBeGreaterThan(short);
    expect(estimatePromptTokens("abcd")).toBe(301);
  });
});
