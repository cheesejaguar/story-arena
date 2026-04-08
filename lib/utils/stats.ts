/**
 * Wilson score interval — a better binomial confidence interval than the
 * naive normal approximation, especially for small sample sizes or win
 * rates near 0/1. Returns the center (adjusted win rate) plus lower and
 * upper bounds of the interval.
 *
 * Used by the results and admin pages to draw honest error bars on model
 * win rates, so nobody reads "100% win rate" off a single vote.
 *
 * Reference: https://en.wikipedia.org/wiki/Binomial_proportion_confidence_interval#Wilson_score_interval
 */
export function wilsonInterval(
  wins: number,
  total: number,
  confidence: 0.9 | 0.95 | 0.99 = 0.95,
): { lower: number; center: number; upper: number } {
  if (total === 0) return { lower: 0, center: 0, upper: 0 };

  const z =
    confidence === 0.9 ? 1.645 : confidence === 0.99 ? 2.576 : 1.96;

  const p = wins / total;
  const denom = 1 + (z * z) / total;
  const center = (p + (z * z) / (2 * total)) / denom;
  const margin =
    (z / denom) *
    Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total));

  return {
    lower: Math.max(0, center - margin),
    center,
    upper: Math.min(1, center + margin),
  };
}
