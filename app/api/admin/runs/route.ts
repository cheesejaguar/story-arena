import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/security/admin-auth";
import { listRecentRuns } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const runs = await listRecentRuns(100);
  return NextResponse.json({ runs });
}
