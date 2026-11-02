import type { Arena } from "@/lib/arena";

export type LengthBucket = "short" | "medium" | "long";

const TARGETS: Record<LengthBucket, number> = {
  short: 400,
  medium: 900,
  long: 1800,
};

export function lengthToTargetTokens(b: LengthBucket): number {
  return TARGETS[b];
}

/** Jokes are a few sentences at most; 300 tokens leaves room for a setup. */
const JOKE_TARGET_TOKENS = 300;

/** Output budget for a run, accounting for the arena it belongs to. */
export function targetTokensFor(arena: Arena, b: LengthBucket): number {
  return arena === "joke" ? JOKE_TARGET_TOKENS : TARGETS[b];
}

export function parseLength(input: unknown): LengthBucket {
  return input === "short" || input === "long" ? input : "medium";
}
