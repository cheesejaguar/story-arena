import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/security/admin-auth";
import { getAggregateModelStats } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const stats = await getAggregateModelStats();
  return NextResponse.json({ stats });
}
