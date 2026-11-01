import "server-only";
import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import { env } from "@/lib/env";
import { safeEqualString } from "./constant-time";

const COOKIE = "sa_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

/**
 * The cookie carries `expiry.signature`, never the raw admin secret. The
 * signature is an HMAC over the expiry using the admin secret as the key,
 * so leaking the cookie does not leak the password.
 */
function signature(expiresAt: number): string {
  return createHmac("sha256", env.ADMIN_SECRET)
    .update(`admin-session:${expiresAt}`)
    .digest("hex");
}

function isValidToken(value: string): boolean {
  const [expiresRaw, sig] = value.split(".");
  if (!expiresRaw || !sig) return false;
  const expiresAt = Number(expiresRaw);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return false;
  return safeEqualString(signature(expiresAt), sig);
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  return Boolean(value && isValidToken(value));
}

export async function setAdminCookie(secret: string): Promise<boolean> {
  if (!safeEqualString(secret, env.ADMIN_SECRET)) return false;

  const store = await cookies();
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  store.set(COOKIE, `${expiresAt}.${signature(expiresAt)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
  return true;
}

export async function clearAdminCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}
