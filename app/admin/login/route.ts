import { NextResponse } from "next/server";
import { setAdminCookie } from "@/lib/security/admin-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
