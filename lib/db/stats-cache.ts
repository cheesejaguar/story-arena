import "server-only";
import { revalidateTag } from "next/cache";
import { logger } from "@/lib/utils/logger";

/** Shared tag for every cached aggregate on /results and /admin. */
export const STATS_TAG = "stats";

/**
 * Revalidation is best-effort: the mutation has already been persisted, so a
 * cache-store hiccup must not turn a successful vote or run into a 500.
 */
export function invalidateStatsCache(): void {
  try {
    revalidateTag(STATS_TAG, "max");
  } catch (err) {
    logger.warn({ err: String(err) }, "stats.revalidate.failed");
  }
}
