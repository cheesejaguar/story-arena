import type { JokePrompt } from "@/lib/seed/joke-prompts";
import { REDDIT_JOKE_PROMPTS } from "./reddit-joke-prompts";

/**
 * Original setups written for Joke Arena. They keep the homepage stocked
 * until `pnpm fetch:reddit:jokes` fills `reddit-joke-prompts.ts`, and remain
 * as a fallback afterwards.
 */
const HOUSE_JOKE_PROMPTS: JokePrompt[] = [
  "A cat, a Roomba, and a smart fridge walk into a bar.",
  "Why did the time traveler get kicked out of the book club?",
  "What does a ghost put on its dating profile?",
  "My GPS has started giving me life advice.",
  "Why did the astronaut break up with the moon?",
  "A pirate opens a vegan restaurant.",
  "Why don't dragons ever win at hide and seek?",
  "My grandma just discovered group chats.",
  "What did the sourdough starter say at its own intervention?",
  "Why was the mathematician banned from the escape room?",
  "A vampire tries to file his taxes.",
  "What's the worst thing to hear your dentist say mid-procedure?",
].map((promptText, index) => ({
  id: `house:${String(index + 1).padStart(2, "0")}`,
  source: "house" as const,
  promptText,
  featured: true,
}));

export const JOKE_PROMPTS: JokePrompt[] = [
  ...REDDIT_JOKE_PROMPTS,
  ...HOUSE_JOKE_PROMPTS,
];
