import { NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/security/admin-auth";
import { adminLoginLimiter, checkLimit } from "@/lib/security/rate-limit";
import { getClientIp, isSameOrigin } from "@/lib/security/request";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const { success } = await checkLimit(adminLoginLimiter, getClientIp(req));
  if (!success) {
    return NextResponse.redirect(new URL("/admin?error=rate", req.url), {
      status: 303,
    });
  }

  const form = await req.formData();
  const secret = form.get("secret");
  if (typeof secret !== "string") {
    return NextResponse.redirect(new URL("/admin?error=1", req.url));
  }
  const ok = await setAdminCookie(secret);
  return NextResponse.redirect(
    new URL(ok ? "/admin" : "/admin?error=1", req.url),
    { status: 303 }, // POST → GET on redirect
  );
}
