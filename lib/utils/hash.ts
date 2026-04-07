import { createHash } from "node:crypto";

export function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt.trim().toLowerCase()).digest("hex");
}
