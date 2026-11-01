import "server-only";
import { redis } from "./redis";
import { logger } from "@/lib/utils/logger";

const TTL_SECONDS = 60 * 10;

function key(sessionId: string, idempotencyKey: string): string {
  return `sa:idem:${sessionId}:${idempotencyKey}`;
}

/** Returns the run id already associated with this key, if any. */
export async function getClaimedRunId(
  sessionId: string,
  idempotencyKey: string,
): Promise<string | null> {
  try {
    return await redis.get<string>(key(sessionId, idempotencyKey));
  } catch {
    return null;
  }
}

/**
 * Claim a key for a newly-created run. Returns false when another request
 * won the race (in which case the caller should abandon its own run).
 */
export async function claimRunId(
  sessionId: string,
  idempotencyKey: string,
  runId: string,
): Promise<boolean> {
  try {
    const result = await redis.set(key(sessionId, idempotencyKey), runId, {
      nx: true,
      ex: TTL_SECONDS,
    });
    return result === "OK";
  } catch (err) {
    logger.warn({ err: String(err) }, "idempotency.claim.failed_open");
    return true;
  }
}

export async function clearClaim(
  sessionId: string,
  idempotencyKey: string,
): Promise<void> {
  try {
    await redis.del(key(sessionId, idempotencyKey));
  } catch {
    // Expires on its own.
  }
}
