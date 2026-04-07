import "server-only";
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  UPSTASH_REDIS_REST_URL: z.url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  // AI Gateway auth: short-lived OIDC token. Auto-injected on Vercel; refreshed
  // locally via `vercel env pull`.
  VERCEL_OIDC_TOKEN: z.string().min(1),
  ADMIN_SECRET: z.string().min(32),
  SESSION_COOKIE_SECRET: z.string().min(32),
  SYSTEM_PROMPT_VERSION: z.string().default("v1"),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(z.treeifyError(parsed.error), null, 2),
  );
  throw new Error("Invalid environment variables. See logs above.");
}

export const env = parsed.data;
export type Env = z.infer<typeof EnvSchema>;
