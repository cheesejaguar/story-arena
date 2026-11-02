import type { LengthBucket } from "@/lib/utils/length";

/**
 * Story Arena hosts two contests on the same blind-vote pipeline. Every run
 * records which arena it belongs to so stats, the Bench, and replay never
 * mix a joke vote into the fiction benchmark (or vice versa).
 */
export type Arena = "story" | "joke";

export const ARENAS: readonly Arena[] = ["story", "joke"];

/** System prompt version for joke runs. Bump when the joke prompt changes. */
export const JOKE_SYSTEM_PROMPT_VERSION = "joke-v1";

/** Jokes have no length picker; every joke run is stored as `short`. */
export const JOKE_LENGTH_BUCKET: LengthBucket = "short";

/** Joke setups are one-liners, not story premises. */
export const JOKE_PROMPT_MAX_CHARS = 500;

export function parseArena(input: unknown): Arena {
  return input === "joke" ? "joke" : "story";
}

/** Client-safe copy that differs between the two arenas. */
export const ARENA_COPY = {
  story: {
    name: "Story Arena",
    unit: "Story",
    unitPlural: "stories",
    home: "/",
    bench: "/judge",
  },
  joke: {
    name: "Joke Arena",
    unit: "Joke",
    unitPlural: "jokes",
    home: "/jokes",
    bench: "/jokes/judge",
  },
} as const satisfies Record<
  Arena,
  { name: string; unit: string; unitPlural: string; home: string; bench: string }
>;
