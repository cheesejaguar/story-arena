import { timingSafeEqual } from "node:crypto";

const HEX = /^[0-9a-f]+$/i;

/** Constant-time comparison of two UTF-8 strings. */
export function safeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/**
 * Constant-time comparison of two hex strings.
 *
 * Guards against malformed input: `Buffer.from("zz", "hex")` silently
 * produces an empty buffer, and `timingSafeEqual` throws when the two
 * buffers differ in length. Both would turn a tampered cookie into a 500.
 */
export function safeEqualHex(a: string, b: string): boolean {
  if (a.length === 0 || b.length === 0) return false;
  if (a.length !== b.length) return false;
  if (!HEX.test(a) || !HEX.test(b)) return false;

  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
