import { describe, it, expect } from "vitest";
import { lengthToTargetTokens, parseLength } from "@/lib/utils/length";

describe("length helpers", () => {
  it("maps each bucket to a target token count", () => {
    expect(lengthToTargetTokens("short")).toBe(400);
    expect(lengthToTargetTokens("medium")).toBe(900);
    expect(lengthToTargetTokens("long")).toBe(1800);
  });
  it("parses with default fallback to medium", () => {
    expect(parseLength("short")).toBe("short");
    expect(parseLength(undefined)).toBe("medium");
    expect(parseLength("xl")).toBe("medium");
  });
});
