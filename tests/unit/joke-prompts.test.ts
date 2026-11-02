import { describe, it, expect } from "vitest";
import {
  getHomepageJokePrompts,
  jokePromptSourceLabel,
  redditPostToJokePrompt,
  type JokePrompt,
  type RedditListingPost,
} from "@/lib/seed/joke-prompts";
import { JOKE_PROMPTS } from "@/data/joke-prompts";

function post(overrides: Partial<RedditListingPost> = {}): RedditListingPost {
  return {
    id: "abc123",
    subreddit: "Jokes",
    title: "Why did the chicken join a band?",
    selftext: "Because it had the drumsticks.",
    permalink: "/r/Jokes/comments/abc123/why_did_the_chicken/",
    score: 1200,
    ...overrides,
  };
}

describe("redditPostToJokePrompt", () => {
  it("turns a setup-in-title post into a prompt", () => {
    const prompt = redditPostToJokePrompt(post());
    expect(prompt).toEqual({
      id: "reddit:abc123",
      source: "reddit",
      promptText: "Why did the chicken join a band?",
      featured: true,
      reddit: {
        subreddit: "Jokes",
        permalink: "https://www.reddit.com/r/Jokes/comments/abc123/why_did_the_chicken/",
        score: 1200,
      },
    });
  });

  it("drops NSFW, stickied, removed, and mod posts", () => {
    expect(redditPostToJokePrompt(post({ over_18: true }))).toBeNull();
    expect(redditPostToJokePrompt(post({ stickied: true }))).toBeNull();
    expect(redditPostToJokePrompt(post({ removed_by_category: "moderator" }))).toBeNull();
    expect(redditPostToJokePrompt(post({ title: "Mod announcement: new rules for posting" }))).toBeNull();
  });

  it("drops titles with no punchline body or bad length", () => {
    expect(redditPostToJokePrompt(post({ selftext: "  " }))).toBeNull();
    expect(redditPostToJokePrompt(post({ title: "Puns." }))).toBeNull();
    expect(redditPostToJokePrompt(post({ title: "x".repeat(201) }))).toBeNull();
  });
});

describe("getHomepageJokePrompts", () => {
  const house: JokePrompt = { id: "house:01", source: "house", promptText: "A house setup", featured: true };
  const low = redditPostToJokePrompt(post({ id: "low", title: "A lower scoring setup here", score: 10 }))!;
  const high = redditPostToJokePrompt(post({ id: "high", title: "A higher scoring setup here", score: 999 }))!;

  it("puts Reddit prompts first by score, then house prompts", () => {
    expect(getHomepageJokePrompts([house, low, high]).map((p) => p.id)).toEqual([
      "reddit:high",
      "reddit:low",
      "house:01",
    ]);
  });

  it("respects the limit and skips unfeatured prompts", () => {
    expect(getHomepageJokePrompts([house, { ...high, featured: false }], 6)).toEqual([house]);
    expect(getHomepageJokePrompts([house, low, high], 1)).toEqual([high]);
  });

  it("labels the source", () => {
    expect(jokePromptSourceLabel(high)).toBe("r/Jokes");
    expect(jokePromptSourceLabel(house)).toBe("House prompt");
  });
});

describe("JOKE_PROMPTS", () => {
  it("ships unique, non-empty prompts within the joke length limit", () => {
    expect(JOKE_PROMPTS.length).toBeGreaterThanOrEqual(6);
    const ids = new Set(JOKE_PROMPTS.map((p) => p.id));
    expect(ids.size).toBe(JOKE_PROMPTS.length);
    for (const p of JOKE_PROMPTS) {
      expect(p.promptText.trim().length).toBeGreaterThanOrEqual(4);
      expect(p.promptText.length).toBeLessThanOrEqual(500);
    }
  });
});
