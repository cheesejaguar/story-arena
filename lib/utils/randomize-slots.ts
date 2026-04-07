import { randomInt } from "node:crypto";

const SLOTS = ["A", "B", "C"] as const;
export type Slot = (typeof SLOTS)[number];

export function randomizeSlots<T>(items: T[]): Array<{ slot: Slot; value: T }> {
  if (items.length !== SLOTS.length) {
    throw new Error(`randomizeSlots expects exactly ${SLOTS.length} items, got ${items.length}`);
  }
  const copy = [...items];
  // Cryptographically secure Fisher-Yates shuffle. The randomization is the
  // app's blinding mechanism — Math.random would be predictable enough that
  // a determined user could break the blind.
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.map((value, idx) => ({ slot: SLOTS[idx], value }));
}
