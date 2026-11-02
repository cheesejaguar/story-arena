/**
 * Client-safe joke prompt types and helpers. Joke prompts come from two
 * places: setups pulled from joke subreddits by
 * `scripts/fetch-reddit-joke-prompts.ts`, and a small set of original house
 * prompts so the Joke Arena homepage is never empty.
 */
export type JokePrompt = {
  id: string;
  source: "reddit" | "house";
  promptText: string;
  featured: boolean;
  /** Present only for prompts pulled from Reddit. */
  reddit?: {
    subreddit: string;
    permalink: string;
    score: number;
  };
};

/** Minimal shape of a Reddit listing child, as returned by the OAuth API. */
export type RedditListingPost = {
  id: string;
  subreddit: string;
  title: string;
  selftext?: string;
  permalink: string;
  score: number;
  over_18?: boolean;
  stickied?: boolean;
  removed_by_category?: string | null;
};

const MIN_SETUP_CHARS = 15;
const MAX_SETUP_CHARS = 200;

/**
 * On joke subreddits the title is the setup and the body is the punchline.
 * Keep posts whose title can stand alone as a setup for a model to finish:
 * SFW, not a mod post, not removed, and short enough to be a one-liner.
 */
export function redditPostToJokePrompt(post: RedditListingPost): JokePrompt | null {
  if (post.over_18 || post.stickied || post.removed_by_category) return null;

  const setup = post.title.replace(/\s+/g, " ").trim();
  if (setup.length < MIN_SETUP_CHARS || setup.length > MAX_SETUP_CHARS) return null;
  // Meta posts and titles that are the whole joke ("Puns. That's it.") have
  // no body to suggest a punchline is missing.
  if (!post.selftext?.trim()) return null;
  if (/\b(mod|meta|announcement|rule)s?\b/i.test(setup)) return null;

  return {
    id: `reddit:${post.id}`,
    source: "reddit",
    promptText: setup,
    featured: true,
    reddit: {
      subreddit: post.subreddit,
      permalink: `https://www.reddit.com${post.permalink}`,
      score: post.score,
    },
  };
}

/**
 * Prompts shown on the Joke Arena homepage: the highest-scoring Reddit setups
 * first, topped up with house prompts when the Reddit archive is thin.
 */
export function getHomepageJokePrompts(prompts: JokePrompt[], limit = 6): JokePrompt[] {
  const featured = prompts.filter((p) => p.featured);
  const reddit = featured
    .filter((p) => p.source === "reddit")
    .sort((a, b) => (b.reddit?.score ?? 0) - (a.reddit?.score ?? 0));
  const house = featured.filter((p) => p.source === "house");
  return [...reddit, ...house].slice(0, limit);
}

export function jokePromptSourceLabel(prompt: JokePrompt): string {
  return prompt.reddit ? `r/${prompt.reddit.subreddit}` : "House prompt";
}
