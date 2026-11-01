import "server-only";
import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

// Vercel Marketplace Upstash integration provisions credentials under the
// legacy Vercel KV names (KV_REST_API_*).
export const redis = new Redis({
  url: env.KV_REST_API_URL,
  token: env.KV_REST_API_TOKEN,
});
