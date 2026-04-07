import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

// Vercel Marketplace Upstash integration provisions credentials under the
// legacy Vercel KV names (KV_REST_API_*).
const redis = new Redis({
  url: env.KV_REST_API_URL,
  token: env.KV_REST_API_TOKEN,
});

export const runLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 h"), // 10 runs per hour per session
  prefix: "sa:run",
});

export const voteLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(60, "1 h"), // 60 votes per hour per session
  prefix: "sa:vote",
});
