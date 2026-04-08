import "server-only";
import { z } from "zod";

// `vercel env add` accepts values via stdin which almost always includes a
// trailing newline (`echo "v1" | ...`), and Vercel stores the literal value
// it received. All these strings get `.trim()` as a defense so a stray
// newline can't cause "Unknown system prompt version: v1\n"-style bugs.
const trimmed = z.string().trim();

const EnvSchema = z.object({
  DATABASE_URL: z.url(),
  // Upstash Redis credentials. The Vercel Marketplace Upstash integration
  // provisions these under the legacy Vercel KV names (KV_REST_API_*) for
  // backward compatibility, so that's what we read.
  KV_REST_API_URL: z.url(),
  KV_REST_API_TOKEN: trimmed.min(1),
  // AI Gateway auth: short-lived OIDC token. Auto-injected on Vercel when AI
  // Gateway is enabled on the project; refreshed locally via `vercel env pull`.
  // Optional so non-AI routes (e.g. /results, /admin, /about) can boot even
  // when AI Gateway is not yet provisioned. The AI SDK reads it directly from
  // process.env at call time and will throw a 502 if missing.
  VERCEL_OIDC_TOKEN: trimmed.min(1).optional(),
  ADMIN_SECRET: trimmed.min(32),
  SESSION_COOKIE_SECRET: trimmed.min(32),
  SYSTEM_PROMPT_VERSION: trimmed.default("v1"),
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
