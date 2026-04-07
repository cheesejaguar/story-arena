import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  // AI Gateway auth: short-lived OIDC token. Auto-injected on Vercel; refreshed
  // locally via `vercel env pull`.
  VERCEL_OIDC_TOKEN: z.string().min(1),
  ADMIN_SECRET: z.string().min(32),
  SESSION_COOKIE_SECRET: z.string().min(32),
  SYSTEM_PROMPT_VERSION: z.string().default("v1"),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
