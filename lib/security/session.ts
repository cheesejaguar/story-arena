import "server-only";
import { cookies } from "next/headers";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const COOKIE = "sa_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

function sign(value: string): string {
  return createHmac("sha256", env.SESSION_COOKIE_SECRET).update(value).digest("hex");
}

function verify(value: string, signature: string): boolean {
  const expected = sign(value);
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
}

export async function getOrCreateSessionId(): Promise<string> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (raw) {
    const [id, sig] = raw.split(".");
    if (id && sig && verify(id, sig)) return id;
  }
  const id = randomBytes(16).toString("hex");
  store.set(COOKIE, `${id}.${sign(id)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    maxAge: MAX_AGE,
    path: "/",
  });
  return id;
}
