import "server-only";
import { redis } from "@/lib/security/redis";
import { env } from "@/lib/env";
import { logger } from "@/lib/utils/logger";

const CAP_MICRO_USD = Math.round(env.DAILY_SPEND_CAP_USD * 1_000_000);
/** Hold back 10% of the estimate for retries, reasoning, and pricing drift. */
const RESERVATION_BUFFER = 1.1;
const KEY_TTL_SECONDS = 60 * 60 * 48;

export type SpendReservation =
  | { kind: "skipped" }
  | { kind: "reserved"; key: string; microUsd: number };

export type SpendReservationResult =
  | { ok: true; reservation: SpendReservation }
  | { ok: false; spentMicroUsd: number; capMicroUsd: number };

function dayKey(date = new Date()): string {
  return `sa:spend:${date.toISOString().slice(0, 10)}`;
}

function shouldSkip(): boolean {
  // Mock runs cost nothing and E2E/CI must not require a live Redis.
  return process.env.MOCK_AI === "1";
}

/**
 * Atomically reserve budget for one run. The reservation is conservative
 * (estimate + 10%); it is reconciled down to actual cost when the run
 * completes, or released entirely when generation fails.
 */
export async function reserveSpend(
  estimatedMicroUsd: number,
): Promise<SpendReservationResult> {
  if (shouldSkip()) return { ok: true, reservation: { kind: "skipped" } };

  const key = dayKey();
  const microUsd = Math.ceil(estimatedMicroUsd * RESERVATION_BUFFER);

  try {
    const total = await redis.incrby(key, microUsd);
    await redis.expire(key, KEY_TTL_SECONDS);

    if (total > CAP_MICRO_USD) {
      await redis.decrby(key, microUsd);
      logger.warn(
        { spentMicroUsd: total - microUsd, capMicroUsd: CAP_MICRO_USD },
        "spend.cap.reached",
      );
      return {
        ok: false,
        spentMicroUsd: Math.max(0, total - microUsd),
        capMicroUsd: CAP_MICRO_USD,
      };
    }

    return { ok: true, reservation: { kind: "reserved", key, microUsd } };
  } catch (err) {
    // Fail open. A Redis outage should not take the product down; the admin
    // cost dashboard and provider-side budgets remain the backstop.
    logger.warn({ err: String(err) }, "spend.reserve.failed_open");
    return { ok: true, reservation: { kind: "skipped" } };
  }
}

/** Replace a reservation with the actual cost of the completed run. */
export async function reconcileSpend(
  reservation: SpendReservation,
  actualMicroUsd: number,
): Promise<void> {
  if (reservation.kind === "skipped") return;
  const delta = Math.max(0, Math.round(actualMicroUsd)) - reservation.microUsd;
  if (delta === 0) return;
  try {
    await redis.incrby(reservation.key, delta);
  } catch (err) {
    logger.warn({ err: String(err) }, "spend.reconcile.failed");
  }
}

/** Give reserved budget back when a run fails or is aborted. */
export async function releaseSpend(
  reservation: SpendReservation,
): Promise<void> {
  if (reservation.kind === "skipped") return;
  try {
    await redis.incrby(reservation.key, -reservation.microUsd);
  } catch (err) {
    logger.warn({ err: String(err) }, "spend.release.failed");
  }
}

/** Total spent today, in micro-USD. Used by the admin dashboard. */
export async function getTodaySpendMicroUsd(): Promise<number> {
  if (shouldSkip()) return 0;
  try {
    const value = await redis.get<number>(dayKey());
    return Number(value ?? 0);
  } catch {
    return 0;
  }
}

export function dailySpendCapMicroUsd(): number {
  return CAP_MICRO_USD;
}
