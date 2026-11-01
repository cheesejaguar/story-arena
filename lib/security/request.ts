/**
 * Best-effort client IP. Vercel sets `x-forwarded-for`; the left-most entry
 * is the original client. We only use this for rate limiting, never for
 * identity.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "unknown"
  );
}

/**
 * Reject cross-site browser mutations. Non-browser clients (curl, server to
 * server) usually omit Origin, and same-site cookies already protect those;
 * we only compare when an Origin header is present.
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}
