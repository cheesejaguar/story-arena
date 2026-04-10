# Reddit WritingPrompts seed design

Date: 2026-04-10
Project: Story Arena

## Goal

Remove production-facing boilerplate or placeholder prompt content and seed the deployed site with a committed snapshot of 25 prompts derived from r/WritingPrompts so users can immediately rank and vote on them through the existing blind-comparison flow.

## Scope

In scope:
- Replace generic example/archive prompt cards on the homepage with a curated Reddit-derived prompt set
- Add a committed source-of-truth dataset for 25 prompts and their completed blind runs
- Seed the database with completed runs and story outputs so `/judge` works immediately after deployment
- Keep the current user-submission-first homepage and prompt generation flow intact
- Preserve the existing vote/reveal/judge mechanics where possible
- Remove production-facing placeholder/demo prompt content

Out of scope:
- Live fetching from Reddit at runtime or deploy time
- Building a recurring sync/import pipeline
- Seeding fake votes or manipulating rankings
- Reworking the core benchmark architecture
- Major visual redesign beyond replacing placeholder content and minor copy adjustments

## Product decisions

### Homepage behavior

The homepage remains centered on users submitting their own prompts. The existing prompt form stays primary. The current sample prompt/archive area changes from genre-based placeholder examples to real curated prompts sourced from a committed Reddit snapshot.

Users should be able to click one of these curated prompts to populate the form, exactly like the current example-prompt behavior.

### Judge behavior

`/judge` remains the main place to rank and vote on stories written from other people's prompts. The site will ship with a starter pool of 25 completed runs, each with three blinded story outputs already persisted. That means a newly deployed site has immediate content to judge without waiting for live AI generation.

### Data trust model

Seeded runs are real application rows, not a parallel demo system. They will use the same `runs`, `story_outputs`, and `votes` tables as normal user-created runs. Real users will generate real votes against them.

No votes are pre-seeded. Rankings and win shares remain entirely user-generated.

## Data model and persistence

### Existing schema reuse

The current schema is sufficient for the seeded content. No new tables are required if the seed script writes valid completed rows.

For each seeded item, the script will insert:

- one `runs` row with:
  - `status = complete`
  - `moderationStatus = allowed`
  - `sessionId = "seed:reddit"` (or equivalent fixed seed marker)
  - prompt text, normalized prompt, prompt hash, length bucket, system prompt version
  - a stable `completedAt`
- three `story_outputs` rows with:
  - slot labels `A`, `B`, `C`
  - committed story text
  - provider/model metadata matching the benchmark model registry
  - `generationStatus = success`
  - latency/token fields set to reasonable nullable or fixed values consistent with schema requirements

This keeps `/judge`, `/results`, `/api/votes`, and admin flows operating on one unified dataset.

### Idempotency

The seed process must be safe to run multiple times.

Preferred strategy:
- derive a stable unique identity per seeded run from the prompt hash plus the seed marker
- before inserting a seeded run, check whether a matching run already exists
- if it exists, skip or update deterministically
- if not, insert the run and its outputs

The seed script should never create duplicate seeded runs on repeated deploys.

### Slot handling

Because the app reveals models after vote, seeded outputs must already have a fixed slot assignment in the database. The committed dataset will therefore include explicit `A/B/C` output placement for each seeded run.

There is no need to reshuffle seeded rows at seed time. They are simply stored as completed benchmark runs.

## Source-of-truth files

Add committed content files under a repo-owned data location.

Recommended structure:

- `data/reddit-writing-prompts.ts`
  - 25 curated prompt records
  - source attribution metadata as needed for maintainers
- `data/reddit-seeded-runs.ts`
  - completed run payloads pairing each prompt with three committed stories and their model metadata
- `scripts/seed-reddit-prompts.ts`
  - idempotent database seed script for inserting/upserting completed rows

If a single combined file is simpler and clearer than two separate files, that is acceptable. The important requirement is that the snapshot is committed, auditable, and easy to edit.

## Content design

### Prompt snapshot

The repository will include a static curated snapshot of 25 prompts derived from r/WritingPrompts. These should be selected for variety and broad appeal, not for controversial edge-case testing. The final list should feel like strong showcase prompts for a public fiction-ranking site.

Selection guidelines:
- recognizable WritingPrompts-style framing
- varied genres and tones
- concise enough to read comfortably in the homepage archive cards and judge header
- no obvious duplicates
- no low-effort, confusing, or extremely context-dependent prompts

### Story content

Each seeded prompt gets three committed LLM-generated stories so the site preserves its central product idea: blind comparison of model-written fiction.

Constraints:
- stories should be complete, readable, and non-placeholder
- stories should not explicitly name their generating model in the text
- formatting should be compatible with the current compare/judge rendering
- all three stories for a prompt should respond to the same prompt faithfully

## Production-facing boilerplate removal

### Replace placeholder prompt cards

`components/example-prompts.tsx` currently contains generic handcrafted sample prompts categorized by genre. This is production-facing placeholder content and should be replaced with the curated Reddit prompt dataset.

### Keep dev/test scaffolding

Do not remove:
- `MOCK_AI`
- test mocks under `tests/`
- internal comments describing placeholder styles or mocked behavior in development-only contexts

These are legitimate engineering scaffolds, not user-facing boilerplate.

### Minor copy cleanup

Review homepage and judge page copy for any language that implies the prompt archive is fictional or generic. Update only where needed so the curated archive feels intentional and real, while keeping the current editorial tone.

## Execution plan

### Step 1: add curated data

Create committed data modules containing the 25 selected prompts and their 75 total seeded stories.

### Step 2: add seed script

Implement an idempotent script that writes completed runs into the database using the existing schema and query helpers where practical.

### Step 3: integrate homepage archive

Replace the hardcoded example prompts UI so it renders from the curated dataset rather than generic sample strings.

### Step 4: remove lingering production placeholder content

Audit the production UI for any remaining prompt-related placeholder/demo copy and update it.

### Step 5: verify seeded judge flow

Confirm that a seeded deployment has immediately available `/judge` items, that vote submission works against seeded runs, and that results pages aggregate those votes normally.

## Testing strategy

Follow the existing test setup and add the smallest useful tests around the new behavior.

Recommended coverage:
- unit test for any seed-data normalization helper if one is introduced
- integration test for seed script idempotency logic if feasible without excessive DB harness overhead
- component-level or rendering test coverage is optional if the prompt archive component remains simple
- existing vote-flow integration tests should continue to pass unchanged

Minimum verification before claiming completion:
- run targeted tests for new seed logic
- run the relevant existing test suite
- run type-check and build
- manually confirm seeded runs appear in `/judge`

## Error handling

Seed script behavior should be explicit and fail fast:
- invalid prompt or story records should throw with enough context to identify the bad dataset item
- missing model metadata for seeded outputs should throw
- partial seed writes should be avoided where practical; use clear logging and deterministic checks

Homepage prompt archive behavior should degrade safely:
- if data import fails during development, the page should fail loudly rather than silently render broken cards

## Risks and mitigations

### Risk: duplicate seed rows
Mitigation: deterministic lookup and idempotent insertion based on stable identifiers.

### Risk: content drift between committed data and benchmark model registry
Mitigation: validate seeded model slugs against `BENCHMARK_MODELS` during seed execution.

### Risk: placeholder removal accidentally touches legitimate test scaffolding
Mitigation: restrict cleanup to production-facing UI and copy.

### Risk: seeded stories create licensing/provenance ambiguity
Mitigation: keep the snapshot repo-owned, committed, and clearly documented as curated prompts derived from Reddit plus locally committed model outputs.

## Success criteria

The work is successful when:
- the homepage no longer shows generic sample prompt boilerplate
- the homepage archive shows curated Reddit-derived prompts
- a fresh deployment can serve voteable content in `/judge` immediately
- seeded runs use the existing blind-comparison and vote pipeline without a special-case codepath
- no fake votes are inserted
- the site still supports normal user-submitted prompts

## Recommended implementation notes

- Prefer a seed marker like `seed:reddit` so seeded rows are easy to identify operationally
- Prefer a committed TypeScript data module over raw JSON if it improves schema validation and editor tooling
- Keep changes narrow: reuse existing queries and UI patterns rather than introducing a second content system

## Spec self-review

- No placeholders or TBDs remain
- Scope is limited to static snapshot seeding plus UI cleanup
- The design uses existing schema and product flows consistently
- Ambiguity has been reduced by explicitly choosing committed snapshot data, completed seeded runs, and homepage submission as the primary interaction
