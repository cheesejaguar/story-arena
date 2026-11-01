import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/security/redis";
import { env } from "@/lib/env";
import { logger } from "@/lib/utils/logger";

export const runLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 runs per hour per session
  prefix: "sa:run",
});

export const ipRunLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"), // shared-IP abuse guard
  prefix: "sa:run:ip",
});

export const voteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 h"), // 60 votes per hour per session
  prefix: "sa:vote",
});

export const ipVoteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(120, "1 h"),
  prefix: "sa:vote:ip",
});

export const adminLoginLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "15 m"), // brute-force guard
  prefix: "sa:admin:login",
});

/**
 * Check a limiter, failing OPEN on Redis errors. Availability matters more
 * than perfect rate limiting here: the spend cap is the hard financial
 * backstop, and moderation/generation still have their own guards.
 */
export async function checkLimit(
  limiter: Ratelimit,
  key: string,
): Promise<{ success: boolean; remaining?: number }> {
  try {
    const result = await limiter.limit(key);
    return { success: result.success, remaining: result.remaining };
  } catch (err) {
    logger.warn({ err: String(err) }, "rate_limit.failed_open");
    return { success: true };
  }
}

const CONCURRENCY_KEY = "sa:runs:concurrent";
const CONCURRENCY_TTL_SECONDS = 60 * 10;

/**
 * Global concurrency gate for the expensive 3-way fan-out. Returns true when
 * a slot was acquired; callers MUST call `releaseRunSlot()` in a finally.
 * Fails open on Redis errors (the spend cap still protects the budget).
 */
export async function acquireRunSlot(): Promise<boolean> {
  if (process.env.MOCK_AI === "1") return true;
  try {
    const current = await redis.incr(CONCURRENCY_KEY);
    if (current === 1) await redis.expire(CONCURRENCY_KEY, CONCURRENCY_TTL_SECONDS);
    if (current > env.GLOBAL_MAX_CONCURRENT_RUNS) {
      await redis.decr(CONCURRENCY_KEY);
      return false;
    }
    return true;
  } catch (err) {
    logger.warn({ err: String(err) }, "concurrency.failed_open");
    return true;
  }
}

export async function releaseRunSlot(): Promise<void> {
  if (process.env.MOCK_AI === "1") return;
  try {
    const current = await redis.decr(CONCURRENCY_KEY);
    if (current < 0) await redis.set(CONCURRENCY_KEY, 0);
  } catch (err) {
    logger.warn({ err: String(err) }, "concurrency.release.failed");
  }
}
