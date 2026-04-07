import "server-only";
import { cookies } from "next/headers";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const COOKIE = "sa_admin";

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function isAdmin(): Promise<boolean> {
  const store = await cookies();
  const value = store.get(COOKIE)?.value;
  return Boolean(value && constantTimeEqual(value, env.ADMIN_SECRET));
}

export async function setAdminCookie(secret: string): Promise<boolean> {
  if (!constantTimeEqual(secret, env.ADMIN_SECRET)) return false;
  const store = await cookies();
  store.set(COOKIE, secret, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
  return true;
}
