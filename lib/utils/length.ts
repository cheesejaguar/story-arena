export type LengthBucket = "short" | "medium" | "long";

const TARGETS: Record<LengthBucket, number> = {
  short: 400,
  medium: 900,
  long: 1800,
};

export function lengthToTargetTokens(b: LengthBucket): number {
  return TARGETS[b];
}

export function parseLength(input: unknown): LengthBucket {
  return input === "short" || input === "long" ? input : "medium";
}
