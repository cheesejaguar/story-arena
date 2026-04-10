import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { REDDIT_SEEDED_RUNS } from "../data/reddit-seeded-runs";
import * as schema from "../lib/db/schema";
import { runs, storyOutputs } from "../lib/db/schema";
import {
  buildRunInsert,
  buildStoryOutputInserts,
  getSeedLookupKey,
  validateRedditSeedDataset,
} from "../lib/seed/reddit-seed";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set. Run with: pnpm db:seed:reddit");
  }

  const sql = neon(process.env.DATABASE_URL);
  const db = drizzle(sql, { schema });

  const dataset = validateRedditSeedDataset(REDDIT_SEEDED_RUNS);

  let inserted = 0;
  let skipped = 0;

  for (const seed of dataset) {
    const lookup = getSeedLookupKey(seed.promptText);
    const existing = await db.query.runs.findFirst({
      where: and(
        eq(runs.sessionId, lookup.sessionId),
        eq(runs.promptHash, lookup.promptHash),
      ),
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    const [run] = await db.insert(runs).values(buildRunInsert(seed)).returning();
    await db.insert(storyOutputs).values(buildStoryOutputInserts(run.id, seed));
    inserted += 1;
  }

  console.log(`seeded reddit runs: inserted=${inserted} skipped=${skipped}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
