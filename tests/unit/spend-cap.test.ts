import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { store } = vi.hoisted(() => ({ store: new Map<string, number>() }));

vi.mock("@/lib/security/redis", () => ({
  redis: {
    incrby: vi.fn(async (key: string, amount: number) => {
      const next = (store.get(key) ?? 0) + amount;
      store.set(key, next);
      return next;
    }),
    decrby: vi.fn(async (key: string, amount: number) => {
      const next = (store.get(key) ?? 0) - amount;
      store.set(key, next);
      return next;
    }),
    expire: vi.fn(async () => 1),
    get: vi.fn(async (key: string) => store.get(key) ?? null),
  },
}));

import {
  dailySpendCapMicroUsd,
  getTodaySpendMicroUsd,
  reconcileSpend,
  releaseSpend,
  reserveSpend,
} from "@/lib/ai/spend-cap";

const originalMockAi = process.env.MOCK_AI;

beforeEach(() => {
  store.clear();
  process.env.MOCK_AI = "0";
});

afterEach(() => {
  if (originalMockAi === undefined) delete process.env.MOCK_AI;
  else process.env.MOCK_AI = originalMockAi;
});

describe("daily spend cap", () => {
  it("reserves estimate + 10% and reconciles down to actual cost", async () => {
    const result = await reserveSpend(1_000_000);
    expect(result.ok).toBe(true);
    if (!result.ok || result.reservation.kind !== "reserved") {
      throw new Error("expected a reservation");
    }

    const { key, microUsd } = result.reservation;
    expect(microUsd).toBe(1_100_000);
    expect(store.get(key)).toBe(1_100_000);

    await reconcileSpend(result.reservation, 500_000);
    expect(store.get(key)).toBe(500_000);
    expect(await getTodaySpendMicroUsd()).toBe(500_000);
  });

  it("releases the full reservation when a run fails", async () => {
    const result = await reserveSpend(2_000_000);
    if (!result.ok || result.reservation.kind !== "reserved") {
      throw new Error("expected a reservation");
    }
    const { key } = result.reservation;
    expect(store.get(key)).toBe(2_200_000);
    await releaseSpend(result.reservation);
    expect(store.get(key)).toBe(0);
  });

  it("refuses a reservation that would exceed the daily cap", async () => {
    expect(dailySpendCapMicroUsd()).toBe(25_000_000);
    const first = await reserveSpend(20_000_000);
    expect(first.ok).toBe(true);

    const second = await reserveSpend(3_000_000);
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.capMicroUsd).toBe(25_000_000);
      expect(second.spentMicroUsd).toBe(22_000_000);
    }

    // The rejected increment is rolled back.
    const [key] = [...store.keys()];
    expect(store.get(key)).toBe(22_000_000);
  });

  it("skips Redis entirely in mock mode", async () => {
    process.env.MOCK_AI = "1";
    const result = await reserveSpend(20_000_000);
    expect(result).toEqual({ ok: true, reservation: { kind: "skipped" } });
    expect(store.size).toBe(0);
    expect(await getTodaySpendMicroUsd()).toBe(0);
  });
});
