/**
 * Lightweight heuristic for flagging low-effort votes. This is intentionally
 * a score, not a block: it gives the admin dashboard a way to filter noise
 * without denying a real reader who happens to vote quickly.
 */
export function computeFraudScore(input: {
  timeToVoteMs: number;
  allStoriesViewed: boolean;
  scrollDepths: Array<number | undefined>;
}): number {
  let score = 0;

  if (input.timeToVoteMs < 3_000) score += 30;
  else if (input.timeToVoteMs < 8_000) score += 10;

  if (!input.allStoriesViewed) score += 20;

  const depths = input.scrollDepths.filter(
    (depth): depth is number => typeof depth === "number",
  );
  const maxDepth = depths.length > 0 ? Math.max(...depths) : 0;
  if (maxDepth < 20) score += 20;

  return Math.min(100, score);
}
