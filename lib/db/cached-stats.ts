import "server-only";
import { unstable_cache } from "next/cache";
import { STATS_TAG } from "./stats-cache";
import {
  getAggregateModelStats,
  getCostSummary,
  getSlotDistribution,
  getWinsByLength,
  listSeasonSummaries,
} from "./queries";

/**
 * Stats are expensive aggregate queries but tolerate a minute of staleness.
 * `unstable_cache` keeps them out of the hot path without opting the whole
 * app into Cache Components. Both vote and run handlers call
 * `invalidateStatsCache()` so a new label shows up on the next visit.
 */
const REVALIDATE_SECONDS = 60;

export const getCachedAggregateModelStats = unstable_cache(
  async (rosterId?: string) => getAggregateModelStats(rosterId),
  ["aggregate-model-stats"],
  { tags: [STATS_TAG], revalidate: REVALIDATE_SECONDS },
);

export const getCachedSlotDistribution = unstable_cache(
  async (rosterId?: string) => getSlotDistribution(rosterId),
  ["slot-distribution"],
  { tags: [STATS_TAG], revalidate: REVALIDATE_SECONDS },
);

export const getCachedWinsByLength = unstable_cache(
  async (rosterId?: string) => getWinsByLength(rosterId),
  ["wins-by-length"],
  { tags: [STATS_TAG], revalidate: REVALIDATE_SECONDS },
);

export const getCachedSeasonSummaries = unstable_cache(
  async () => listSeasonSummaries(),
  ["season-summaries"],
  { tags: [STATS_TAG], revalidate: REVALIDATE_SECONDS },
);

export const getCachedCostSummary = unstable_cache(
  async () => getCostSummary(),
  ["cost-summary"],
  { tags: [STATS_TAG], revalidate: REVALIDATE_SECONDS },
);
