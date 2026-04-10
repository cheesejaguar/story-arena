# Reddit WritingPrompts Seed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace production-facing placeholder prompt content with a curated Reddit WritingPrompts snapshot and seed the database with 25 completed, voteable runs that work immediately in `/judge`.

**Architecture:** Keep the existing `runs` → `story_outputs` → `votes` flow unchanged. Add a committed TypeScript dataset, a small pure helper module for validation and DB payload construction, an idempotent seed script that only inserts missing seeded runs, and swap the homepage archive UI to render real prompts from the committed dataset.

**Tech Stack:** Next.js 16 App Router, TypeScript, Drizzle ORM, Neon Postgres, Vitest, TSX scripts

---

## File structure map

### Create
- `data/reddit-seeded-runs.ts` — committed snapshot of 25 Reddit-derived prompts, each with source metadata and three fixed slot/model story outputs
- `lib/seed/reddit-seed.ts` — pure types/constants/helpers for validating the dataset, deriving homepage cards, and building `runs` / `story_outputs` insert payloads
- `scripts/seed-reddit-prompts.ts` — idempotent database seed runner using the committed dataset and helper functions
- `tests/unit/reddit-seed.test.ts` — unit coverage for dataset validation, homepage archive derivation, and DB payload shaping

### Modify
- `components/example-prompts.tsx` — replace handcrafted genre examples with the Reddit-backed archive cards
- `components/prompt-form.tsx` — update copy/imports so the archive section reflects curated Reddit prompts rather than placeholders
- `package.json` — add a dedicated seed command
- `README.md` — document the seed command and note that seeded runs power `/judge`

### No planned changes
- `app/api/judge/next/route.ts` — should work unchanged once seeded runs exist
- `app/api/votes/route.ts` — should work unchanged
- `app/results/page.tsx` — should aggregate seeded-run votes unchanged

---

### Task 1: Add a pure Reddit seed helper module and lock the contract with tests

**Files:**
- Create: `lib/seed/reddit-seed.ts`
- Test: `tests/unit/reddit-seed.test.ts`

- [ ] **Step 1: Write the failing test for dataset validation and DB payload helpers**

```ts
import { describe, expect, it } from "vitest";
import type { LengthBucket } from "@/lib/utils/length";
import {
  REDDIT_SEED_COMPLETED_AT,
  REDDIT_SEED_SESSION_ID,
  REDDIT_SEED_SYSTEM_PROMPT_VERSION,
  buildStoryOutputInserts,
  buildRunInsert,
  getHomepageArchivePrompts,
  validateRedditSeedDataset,
  type RedditSeedRun,
} from "@/lib/seed/reddit-seed";

const fixture: RedditSeedRun[] = [
  {
    redditId: "abc123",
    redditPermalink: "https://www.reddit.com/r/WritingPrompts/comments/abc123/example/",
    redditTitle: "[WP] The moon sends one voicemail to Earth every century.",
    redditScore: 98765,
    promptText: "The moon sends one voicemail to Earth every century.",
    featured: true,
    promptLengthBucket: "medium" satisfies LengthBucket,
    stories: [
      { slot: "A", modelSlug: "openai/gpt-5.4", text: "OpenAI story" },
      { slot: "B", modelSlug: "anthropic/claude-opus-4.6", text: "Anthropic story" },
      { slot: "C", modelSlug: "google/gemini-3.1-pro-preview", text: "Google story" },
    ],
  },
];

describe("validateRedditSeedDataset", () => {
  it("accepts a well-formed dataset and preserves the 3-slot shape", () => {
    const result = validateRedditSeedDataset(fixture);
    expect(result).toHaveLength(1);
    expect(result[0].stories.map((story) => story.slot)).toEqual(["A", "B", "C"]);
  });

  it("rejects duplicate prompt text", () => {
    expect(() => validateRedditSeedDataset([...fixture, fixture[0]])).toThrow(/duplicate prompt/i);
  });
});

describe("getHomepageArchivePrompts", () => {
  it("returns featured prompts ordered by Reddit score", () => {
    const extra: RedditSeedRun = {
      ...fixture[0],
      redditId: "def456",
      redditTitle: "[WP] Every museum exhibit whispers after closing.",
      promptText: "Every museum exhibit whispers after closing.",
      redditScore: 100,
      featured: false,
    };

    const prompts = getHomepageArchivePrompts([fixture[0], extra], 6);
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toMatchObject({
      redditId: "abc123",
      promptText: "The moon sends one voicemail to Earth every century.",
    });
  });
});

describe("buildRunInsert / buildStoryOutputInserts", () => {
  it("creates a stable run insert and matching output rows", () => {
    const runInsert = buildRunInsert(fixture[0]);
    expect(runInsert.sessionId).toBe(REDDIT_SEED_SESSION_ID);
    expect(runInsert.systemPromptVersion).toBe(REDDIT_SEED_SYSTEM_PROMPT_VERSION);
    expect(runInsert.completedAt).toEqual(REDDIT_SEED_COMPLETED_AT);
    expect(runInsert.status).toBe("complete");
    expect(runInsert.moderationStatus).toBe("allowed");

    const outputs = buildStoryOutputInserts("run-1", fixture[0]);
    expect(outputs).toHaveLength(3);
    expect(outputs[0]).toMatchObject({
      runId: "run-1",
      slotLabel: "A",
      provider: "openai",
      modelSlug: "openai/gpt-5.4",
      internalModelName: "GPT-5.4",
      generationStatus: "success",
      finishReason: "seeded",
      fallbackUsed: false,
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/reddit-seed.test.ts`

Expected: FAIL with module resolution errors for `@/lib/seed/reddit-seed`.

- [ ] **Step 3: Write the minimal helper implementation**

Create `lib/seed/reddit-seed.ts`:

```ts
import { BENCHMARK_MODELS, type ModelSlug } from "@/lib/ai/models";
import { hashPrompt } from "@/lib/utils/hash";
import type { LengthBucket } from "@/lib/utils/length";
import type { Slot } from "@/lib/utils/randomize-slots";

export type RedditSeedStory = {
  slot: Slot;
  modelSlug: ModelSlug;
  text: string;
};

export type RedditSeedRun = {
  redditId: string;
  redditPermalink: string;
  redditTitle: string;
  redditScore: number;
  promptText: string;
  featured: boolean;
  promptLengthBucket: LengthBucket;
  stories: [RedditSeedStory, RedditSeedStory, RedditSeedStory];
};

export const REDDIT_SEED_SESSION_ID = "seed:reddit:2026-04-10";
export const REDDIT_SEED_SYSTEM_PROMPT_VERSION = "seed:reddit:2026-04-10";
export const REDDIT_SEED_COMPLETED_AT = new Date("2026-04-10T00:00:00.000Z");

const MODEL_INDEX = new Map(BENCHMARK_MODELS.map((model) => [model.slug, model]));

export function validateRedditSeedDataset(dataset: RedditSeedRun[]): RedditSeedRun[] {
  const seenPrompts = new Set<string>();

  for (const run of dataset) {
    const normalizedPrompt = run.promptText.trim();
    if (!normalizedPrompt) {
      throw new Error(`Empty prompt in Reddit seed run ${run.redditId}`);
    }
    if (seenPrompts.has(normalizedPrompt)) {
      throw new Error(`Duplicate prompt detected: ${normalizedPrompt}`);
    }
    seenPrompts.add(normalizedPrompt);

    const slots = run.stories.map((story) => story.slot).sort().join("");
    if (slots !== "ABC") {
      throw new Error(`Seed run ${run.redditId} must include exactly slots A, B, and C`);
    }

    for (const story of run.stories) {
      if (!MODEL_INDEX.has(story.modelSlug)) {
        throw new Error(`Unknown model slug in seed run ${run.redditId}: ${story.modelSlug}`);
      }
      if (!story.text.trim()) {
        throw new Error(`Empty story text in seed run ${run.redditId} slot ${story.slot}`);
      }
    }
  }

  return dataset;
}

export function getHomepageArchivePrompts(dataset: RedditSeedRun[], limit = 6) {
  return dataset
    .filter((run) => run.featured)
    .sort((a, b) => b.redditScore - a.redditScore)
    .slice(0, limit)
    .map((run) => ({
      redditId: run.redditId,
      redditPermalink: run.redditPermalink,
      redditTitle: run.redditTitle,
      redditScore: run.redditScore,
      promptText: run.promptText,
    }));
}

export function buildRunInsert(run: RedditSeedRun) {
  const normalizedPrompt = run.promptText.trim();
  return {
    sessionId: REDDIT_SEED_SESSION_ID,
    promptText: run.promptText,
    promptHash: hashPrompt(normalizedPrompt),
    promptLengthBucket: run.promptLengthBucket,
    promptGenre: "reddit-writing-prompts",
    normalizedPrompt,
    moderationStatus: "allowed" as const,
    systemPromptVersion: REDDIT_SEED_SYSTEM_PROMPT_VERSION,
    status: "complete" as const,
    completedAt: REDDIT_SEED_COMPLETED_AT,
  };
}

export function buildStoryOutputInserts(runId: string, run: RedditSeedRun) {
  return run.stories.map((story) => {
    const model = MODEL_INDEX.get(story.modelSlug);
    if (!model) {
      throw new Error(`Unknown model slug: ${story.modelSlug}`);
    }
    return {
      runId,
      provider: model.provider,
      modelSlug: model.slug,
      internalModelName: model.label,
      slotLabel: story.slot,
      outputText: story.text,
      tokenInput: null,
      tokenOutput: null,
      latencyMs: 1,
      finishReason: "seeded",
      generationStatus: "success",
      fallbackUsed: false,
      rawResponseJson: null,
      createdAt: REDDIT_SEED_COMPLETED_AT,
    };
  });
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/unit/reddit-seed.test.ts`

Expected: PASS with 4 tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/seed/reddit-seed.ts tests/unit/reddit-seed.test.ts
git commit -m "feat: add reddit seed helpers"
```

### Task 2: Commit the curated Reddit snapshot and make it testable

**Files:**
- Create: `data/reddit-seeded-runs.ts`
- Modify: `tests/unit/reddit-seed.test.ts`

- [ ] **Step 1: Add a failing test that imports the real dataset**

Append to `tests/unit/reddit-seed.test.ts`:

```ts
import { REDDIT_SEEDED_RUNS } from "@/data/reddit-seeded-runs";

describe("REDDIT_SEEDED_RUNS", () => {
  it("contains 25 unique Reddit-derived runs with 3 stories each", () => {
    const dataset = validateRedditSeedDataset(REDDIT_SEEDED_RUNS);
    expect(dataset).toHaveLength(25);
    expect(dataset.filter((run) => run.featured)).toHaveLength(6);
    expect(new Set(dataset.map((run) => run.redditId)).size).toBe(25);
    expect(dataset.every((run) => run.stories.length === 3)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/reddit-seed.test.ts`

Expected: FAIL with `Cannot find module '@/data/reddit-seeded-runs'`.

- [ ] **Step 3: Create the committed dataset file with the approved snapshot**

Create `data/reddit-seeded-runs.ts` with this exact shape, then fill it with the curated 25-run snapshot collected from `https://www.reddit.com/r/WritingPrompts/` top posts:

```ts
import type { RedditSeedRun } from "@/lib/seed/reddit-seed";

export const REDDIT_SEEDED_RUNS: RedditSeedRun[] = [
  {
    redditId: "replace-with-real-reddit-id",
    redditPermalink: "https://www.reddit.com/r/WritingPrompts/comments/...",
    redditTitle: "[WP] ...",
    redditScore: 12345,
    promptText: "The exact prompt text shown to Story Arena users.",
    featured: true,
    promptLengthBucket: "medium",
    stories: [
      {
        slot: "A",
        modelSlug: "openai/gpt-5.4",
        text: `Full committed story text for slot A.`,
      },
      {
        slot: "B",
        modelSlug: "anthropic/claude-opus-4.6",
        text: `Full committed story text for slot B.`,
      },
      {
        slot: "C",
        modelSlug: "google/gemini-3.1-pro-preview",
        text: `Full committed story text for slot C.`,
      },
    ],
  },
];
```

Content rules while filling the array:
- Use exactly 25 runs.
- Mark exactly 6 runs as `featured: true` for the homepage cards.
- Keep `promptLengthBucket: "medium"` for all seeded runs unless there is a deliberate editorial reason to vary it.
- Keep the slot/model assignments fixed and explicit.
- Make each story complete, readable prose with no model self-identification.
- Preserve the Reddit-derived prompt wording in `redditTitle` and store the user-facing prompt in `promptText`.

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm exec vitest run tests/unit/reddit-seed.test.ts`

Expected: PASS with the real dataset validated at 25 runs.

- [ ] **Step 5: Commit**

```bash
git add data/reddit-seeded-runs.ts tests/unit/reddit-seed.test.ts
git commit -m "feat: add reddit prompt snapshot"
```

### Task 3: Add an idempotent seed script that inserts only missing seeded runs

**Files:**
- Create: `scripts/seed-reddit-prompts.ts`
- Modify: `package.json`

- [ ] **Step 1: Add a failing test for the "skip existing prompt hash" behavior via a pure helper**

Append to `tests/unit/reddit-seed.test.ts` and extend `lib/seed/reddit-seed.ts` exports:

```ts
import { hashPrompt } from "@/lib/utils/hash";
import { getSeedLookupKey } from "@/lib/seed/reddit-seed";

describe("getSeedLookupKey", () => {
  it("uses the fixed seed session id plus the normalized prompt hash", () => {
    expect(getSeedLookupKey("  The moon sends one voicemail to Earth every century.  ")).toEqual({
      sessionId: REDDIT_SEED_SESSION_ID,
      promptHash: hashPrompt("The moon sends one voicemail to Earth every century."),
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run tests/unit/reddit-seed.test.ts`

Expected: FAIL because `getSeedLookupKey` is not exported yet.

- [ ] **Step 3: Implement the lookup helper and the seed runner**

Add to `lib/seed/reddit-seed.ts`:

```ts
export function getSeedLookupKey(promptText: string) {
  const normalizedPrompt = promptText.trim();
  return {
    sessionId: REDDIT_SEED_SESSION_ID,
    promptHash: hashPrompt(normalizedPrompt),
  };
}
```

Create `scripts/seed-reddit-prompts.ts`:

```ts
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { runs, storyOutputs } from "@/lib/db/schema";
import {
  buildRunInsert,
  buildStoryOutputInserts,
  getSeedLookupKey,
  validateRedditSeedDataset,
} from "@/lib/seed/reddit-seed";
import { REDDIT_SEEDED_RUNS } from "@/data/reddit-seeded-runs";

async function main() {
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
```

Modify `package.json` scripts:

```json
{
  "scripts": {
    "db:seed:reddit": "tsx --env-file .env.local scripts/seed-reddit-prompts.ts"
  }
}
```

Implementation notes:
- Do **not** delete or rewrite existing seeded rows. Skipping preserves referential integrity for any votes already cast.
- Do **not** wire this into `build`; keep it explicit and one-shot.

- [ ] **Step 4: Run the unit test and then the script locally**

Run:
- `pnpm exec vitest run tests/unit/reddit-seed.test.ts`
- `pnpm db:seed:reddit`

Expected:
- Vitest PASS
- Seed script logs `seeded reddit runs: inserted=25 skipped=0` on the first run and `inserted=0 skipped=25` on the second run.

- [ ] **Step 5: Commit**

```bash
git add lib/seed/reddit-seed.ts scripts/seed-reddit-prompts.ts package.json tests/unit/reddit-seed.test.ts
git commit -m "feat: add reddit seed script"
```

### Task 4: Replace the homepage placeholder prompt cards with real Reddit archive cards

**Files:**
- Modify: `components/example-prompts.tsx`
- Modify: `components/prompt-form.tsx`

- [ ] **Step 1: Add a failing assertion around featured prompt selection in the existing unit test file**

Append to `tests/unit/reddit-seed.test.ts`:

```ts
describe("homepage archive sizing", () => {
  it("exposes exactly 6 featured prompts for the homepage grid", () => {
    const prompts = getHomepageArchivePrompts(REDDIT_SEEDED_RUNS, 6);
    expect(prompts).toHaveLength(6);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails if the dataset is not marked correctly**

Run: `pnpm exec vitest run tests/unit/reddit-seed.test.ts`

Expected: FAIL until exactly 6 dataset entries are marked `featured: true`.

- [ ] **Step 3: Replace the component implementation with a Reddit-backed archive**

Update `components/example-prompts.tsx`:

```tsx
"use client";

import { REDDIT_SEEDED_RUNS } from "@/data/reddit-seeded-runs";
import { getHomepageArchivePrompts } from "@/lib/seed/reddit-seed";

const PROMPTS = getHomepageArchivePrompts(REDDIT_SEEDED_RUNS, 6);

export function ExamplePrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <span className="editorial-caps text-ink-muted">
          From r/WritingPrompts
        </span>
        <span className="hairline flex-1" />
      </div>
      <ul className="grid gap-px bg-rule/60 sm:grid-cols-2 lg:grid-cols-3">
        {PROMPTS.map((prompt, index) => (
          <li key={prompt.redditId} className="bg-paper">
            <button
              type="button"
              onClick={() => onPick(prompt.promptText)}
              className="group flex h-full w-full flex-col gap-3 p-5 text-left transition-colors hover:bg-paper-deep focus:outline-none focus-visible:bg-paper-deep"
            >
              <div className="flex items-baseline gap-3">
                <span className="font-display text-2xl italic font-normal leading-none text-oxblood group-hover:text-oxblood-deep">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="editorial-caps text-ink-muted">r/WritingPrompts</span>
              </div>
              <p className="font-serif text-[0.95rem] italic leading-snug text-ink">
                &ldquo;{prompt.promptText}&rdquo;
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

Update the archive comment/copy in `components/prompt-form.tsx`:

```tsx
      {/* ── Curated prompts from Reddit ─────────────────────────────── */}
      <ExamplePrompts onPick={(t) => setPrompt(t)} />
```

Optional copy refinement if desired:

```tsx
          placeholder="Write a fictional prompt — or borrow one from the Reddit archive below."
```

- [ ] **Step 4: Run the tests and a production build**

Run:
- `pnpm exec vitest run tests/unit/reddit-seed.test.ts`
- `pnpm build`

Expected:
- Vitest PASS
- Next.js build succeeds with the Reddit data imported into the client component.

- [ ] **Step 5: Commit**

```bash
git add components/example-prompts.tsx components/prompt-form.tsx tests/unit/reddit-seed.test.ts
git commit -m "feat: replace placeholder prompt archive"
```

### Task 5: Document the seed flow and verify end-to-end behavior against a real database

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add the failing documentation check manually**

Search for a seed command in the README.

Run: `rg -n "db:seed:reddit|seeded runs|WritingPrompts" README.md`

Expected: no matches yet, or incomplete matches.

- [ ] **Step 2: Update the README with the new seed command and judge bootstrap note**

Add these exact snippets to `README.md` near setup/testing:

```md
# 7. Seed the curated Reddit starter archive (optional locally, required for a fresh deployment that should have immediate judge content)
pnpm db:seed:reddit
```

```md
The deployed site can ship with a starter pool of 25 completed runs derived from r/WritingPrompts. They are committed in-repo and inserted with `pnpm db:seed:reddit`; `/judge` and voting work immediately once those rows exist.
```

- [ ] **Step 3: Run the seed script twice against the target database and verify the site behavior**

Run:
- `pnpm db:seed:reddit`
- `pnpm db:seed:reddit`
- `pnpm test`
- `pnpm exec tsc --noEmit`
- `pnpm build`

Manual verification:
- Open `/judge` and confirm it returns a seeded run instead of the empty state.
- Vote on one seeded run and confirm the reveal mapping appears.
- Open `/results` and confirm totals still render normally after voting.

Expected:
- First seed inserts missing rows
- Second seed skips all 25 rows
- Tests, type-check, and build all pass
- `/judge` is populated immediately

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add reddit seed workflow"
```

---

## Self-review

### Spec coverage
- Homepage placeholder archive replaced: **Task 4**
- Committed 25-prompt snapshot plus three stories each: **Task 2**
- Idempotent database seed script: **Task 3**
- Existing judge/vote pipeline reused unchanged: **Tasks 3 and 5 verification**
- Production-facing boilerplate removal only: **Task 4**
- Seed workflow documented: **Task 5**

### Placeholder scan
- The only intentionally open-ended work is the editorial curation of the 25 real prompt/story records in `data/reddit-seeded-runs.ts`; the exact schema, counts, and validation rules are specified so the implementation still has a deterministic target.
- No task says “add tests later” or “handle edge cases appropriately” without concrete code or verification commands.

### Type consistency
- `RedditSeedRun`, `buildRunInsert`, `buildStoryOutputInserts`, and `getHomepageArchivePrompts` are used consistently across all tasks.
- The seed script uses the same fixed constants and prompt-hash lookup helper defined in the shared helper module.
