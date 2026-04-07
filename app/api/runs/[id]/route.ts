import { NextResponse } from "next/server";
import { getRunWithOutputs } from "@/lib/db/queries";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const data = await getRunWithOutputs(id);
  if (!data || data.run.status !== "complete") {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  // Blinded payload: no provider, no model_slug, no internal_model_name.
  // Only slot + text reaches the client.
  return NextResponse.json({
    runId: data.run.id,
    prompt: data.run.promptText,
    length: data.run.promptLengthBucket,
    stories: data.outputs
      .map((o) => ({ slot: o.slotLabel, text: o.outputText }))
      .sort((a, b) => a.slot.localeCompare(b.slot)),
  });
}
