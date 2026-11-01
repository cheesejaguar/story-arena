# 📖 Story Arena

> Three frontier AIs. One prompt. You decide who writes best.

**Story Arena** is a blind comparison site for fiction-writing quality across the leading large language models. Users submit a writing prompt, read three independently generated stories side-by-side without knowing which model wrote which, then vote for the best one. Every vote becomes a human preference label — turning a fun reading experience into a benchmark dataset for narrative quality.

🌐 **Live:** [story-arena-black.vercel.app](https://story-arena-black.vercel.app)

---

## 🎯 Why this exists

Most LLM benchmarks measure things you can grade automatically: code that compiles, math that resolves, multiple choice. Fiction isn't that. The only honest way to know which model writes the best story is to ask people which one they prefer — repeatedly, at scale, with the model identities hidden.

Story Arena is that question, repeated. The visible product is entertainment; the hidden product is a clean human-preference dataset for narrative quality.

---

## 🤖 The contestants

The active season is **2026 Q4**:

| Slot (randomized) | Model | Provider | Input / output per 1M tokens |
| --- | --- | --- | --- |
| A / B / C | GPT-6.1 Sol | OpenAI | $2 / $10 |
| A / B / C | Claude Opus 5.5 | Anthropic | $4 / $20 |
| A / B / C | Gemini 4 Argon | Google | $2 / $10 |

Each prompt goes to all three models in parallel via the Vercel AI Gateway, with the same system prompt and the same length budget. Slot assignment is a cryptographically random shuffle, so model identity stays hidden until after the vote. Reasoning is pinned to each provider's lowest supported effort — fiction gains little from chain-of-thought, and reasoning tokens are billed as output. Prompt moderation uses a separate, much cheaper auxiliary model (`openai/gpt-6-luna`) with reasoning disabled.

Rosters are frozen per season. When the lineup rotates, runs keep the roster that actually wrote them, so historical results, votes, and seed data never get relabeled. The previous season (`legacy-2026-Q2`: GPT-5.4, Claude Opus 4.6, Gemini 3.1 Pro) remains fully resolvable in the archive and on `/results`.

---

## ✨ Features

- 📝 Single-field prompt input with short / medium / long length selector
- ⚡ Live streaming — all three stories fill in simultaneously as tokens arrive, with one React update per animation frame
- 🎲 Cryptographically random slot assignment (Fisher-Yates with `crypto.randomInt`)
- 🙈 Blind A/B/C comparison — model identity is never sent to the client pre-vote
- 🗳️ One-click voting with optional reason text
- 🎭 Post-vote reveal showing which model wrote which story
- 🧑‍⚖️ **The Bench** (`/judge`) — vote on prompts other people submitted
- 🏆 Public standings with season filtering, slot-bias distribution, and win rates by length
- 📚 Season archive — historical runs resolve against the roster that produced them
- 🔁 Cross-session replay — an identical prompt/length/roster reuses existing stories with a fresh shuffle instead of paying twice
- 🔒 Cookie-gated admin dashboard with per-run drill-down, spend, cost, roster, and replay columns
- 🛡️ DB-enforced integrity (unique votes, composite FK from votes → story_outputs)
- 💸 Hard daily AI-spend ceiling with atomic reservations and 10% headroom
- 🚦 Global concurrency gate and per-run timeouts
- 🎨 Literary typography (Cormorant Garamond display, Fraunces body, IBM Plex Mono labels)
- ♿ Keyboard-selectable story cards, reduced-motion support, mobile-first layout

---

## 🧱 Architecture

```
                    ┌──────────────────────────┐
                    │  Next.js 16 App Router   │
                    │  React 19 · Fluid Compute│
                    └────────────┬─────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐      ┌──────────────────┐      ┌────────────────┐
│ Neon Postgres │      │ Vercel AI Gateway│      │ Upstash Redis  │
│ (Drizzle ORM) │      │ (OIDC, no keys)  │      │ limits · cache │
└───────────────┘      └────────┬─────────┘      │ spend · idem   │
                                │                └────────────────┘
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
        ┌────────────┐   ┌─────────────┐   ┌────────────┐
        │  OpenAI    │   │  Anthropic  │   │  Google    │
        │ GPT-6.1 Sol│   │ Opus 5.5    │   │ Gemini 4   │
        └────────────┘   └─────────────┘   └────────────┘
```

### Request flow (the happy path)

1. User submits a prompt to `POST /api/runs`.
2. Server checks same-origin, session + IP rate limits, Zod validation, and prompt moderation (cached in Redis for 7 days).
3. Optional `Idempotency-Key` short-circuits retries: a completed run is replayed, an in-flight one returns `409 RUN_IN_PROGRESS`.
4. **Replay lookup** — if another session already generated the same prompt, length, roster, and system-prompt version, the stored outputs are copied into a new run with a fresh slot shuffle. No model spend.
5. Otherwise the server reserves a conservative daily-spend estimate, acquires a global concurrency slot, and inserts a `pending` run.
6. The three models stream in parallel; the response is newline-delimited JSON (`init`, `slot_delta`, `slot_done`, `done`). Slot identities are shuffled before any call and never included in per-slot events.
7. All three outputs are persisted with their slot mapping and cost, the run is marked complete, and the spend reservation is reconciled to actual cost.
8. The client shows the vote panel in place. `POST /api/votes` resolves the chosen slot to the real model slug, writes the vote, and returns the reveal mapping.
9. `/compare/<runId>` renders a persisted run later; `/judge` serves random completed runs the session has not voted on.
10. Aggregate stats are cached for 60 seconds and invalidated on every vote/run via a shared `"stats"` tag.

Failure is strict: if any of the three models fails, times out, returns empty/truncated output, or the client disconnects, the run is marked `failed` and no partial stories enter the dataset.

### Seasons and replay

`runs.roster_id` records the exact trio that produced a run. The active roster is `2026-Q4`; runs created before the rotation (including the committed Reddit seed data) are backfilled to `legacy-2026-Q2` by the migration. Stats, results, and the admin dashboard filter by roster, so a model's historical wins are never attributed to its successor.

Replay is deliberately conservative: the dedupe key includes the normalized prompt, length bucket, roster, and `SYSTEM_PROMPT_VERSION`. A session that already voted on the source run is skipped, so replay cannot manufacture a duplicate preference label from the same judge.

---

## 🛠️ Tech stack

| Layer | Choice |
| --- | --- |
| **Runtime** | Node.js 22+ on Vercel Fluid Compute |
| **Framework** | Next.js 16.4 (App Router, Turbopack, RSCs) |
| **Language** | TypeScript (strict) |
| **UI** | React 19.3, Tailwind CSS 4.3, Base UI primitives |
| **Fonts** | Cormorant Garamond (display), Fraunces (body), IBM Plex Mono (labels) via `next/font` |
| **AI** | Vercel AI SDK 6 + Vercel AI Gateway |
| **AI auth** | `VERCEL_OIDC_TOKEN` (auto-injected, auto-rotated, no static provider keys) |
| **Database** | Neon Postgres via Vercel Marketplace |
| **ORM** | Drizzle ORM 0.45 + drizzle-kit migrations |
| **Cache / limits** | Upstash Redis + `@upstash/ratelimit` (sliding window) |
| **Validation** | Zod 4 |
| **Logging** | Pino structured JSON (Vercel ingests natively) |
| **Analytics** | `@vercel/analytics` |
| **Tests** | Vitest 4 (unit + integration) + Playwright (E2E) |
| **Package manager** | pnpm 12 (pinned via `packageManager`, run through Corepack) |

---

## 📦 Project structure

```
story-arena/
├── app/
│   ├── page.tsx                       # 🏠 Landing + live prompt form
│   ├── judge/                         # 🧑‍⚖️ The Bench — vote on existing runs
│   ├── compare/[runId]/               # 🗳️ Persisted blind comparison
│   ├── results/                       # 📊 Season leaderboard + archive
│   ├── about/                         # 📜 Methodology + privacy
│   ├── admin/                         # 🔒 Cookie-gated dashboard + run detail
│   └── api/
│       ├── runs/                      # POST stream/create + GET blinded run
│       ├── votes/                     # POST submit + reveal
│       ├── judge/next/                # GET next unvoted run
│       ├── results/                   # Public aggregate
│       └── admin/                     # Admin stats + run list
├── components/
│   ├── prompt-form.tsx                # NDJSON reader, rAF batching, abort
│   ├── live-compare.tsx               # In-place streaming view
│   ├── compare-grid.tsx               # Single responsive 3-up grid
│   ├── story-card.tsx                 # Reading card + scroll tracking
│   ├── story-markdown-lazy.tsx        # Lazy Markdown after streaming
│   ├── judge-client.tsx
│   ├── vote-panel.tsx
│   ├── reveal-panel.tsx
│   └── ui/                            # Base UI primitives
├── lib/
│   ├── ai/
│   │   ├── models.ts                  # Seasons, rosters, pricing, reasoning, cost
│   │   ├── prompts.ts                 # Versioned system prompt
│   │   ├── generate-story.ts          # Single-model stream (timeout, abort, cost)
│   │   ├── benchmark-run.ts           # 3-way orchestrator
│   │   └── spend-cap.ts               # Daily reservation / reconciliation
│   ├── db/
│   │   ├── schema.ts                  # 3 tables, enums, integrity constraints
│   │   ├── queries.ts                 # Runs, outputs, votes, stats, cleanup
│   │   ├── cached-stats.ts            # unstable_cache wrappers
│   │   ├── stats-cache.ts             # Shared tag + best-effort invalidation
│   │   └── client.ts / migrate.ts
│   ├── moderation/                    # Luna-based prompt review + verdict cache
│   ├── security/                      # Signed cookies, limits, idempotency, origin
│   ├── seed/                          # Reddit archive types + seed validation
│   └── utils/                         # hash, slots, length, cost, fraud, streams
├── data/reddit-seeded-runs.ts         # Committed 25-run starter archive
├── drizzle/migrations/                # Generated SQL migrations
├── tests/
│   ├── unit/                          # Pure functions and registries
│   ├── integration/                   # Mocked AI/db route tests
│   └── e2e/                           # Playwright happy path (MOCK_AI=1)
└── vercel.ts                          # Typed Vercel project config
```

---

## 🏁 Getting started

### Prerequisites

- 🟢 Node.js 22 or newer
- 📦 pnpm 12 via Corepack (`corepack enable`)
- ▲ Vercel CLI (`npm i -g vercel`)
- 🔗 A Vercel project linked to this repo (`vercel link`)

### One-time setup

```bash
# 1. Clone and install
git clone git@github.com:cheesejaguar/story-arena.git
cd story-arena
corepack enable
pnpm install

# 2. Link to your Vercel project
vercel link

# 3. Provision the marketplace integrations (once per project)
vercel install neon
vercel install upstash

# 4. Add the manual secrets (generate with `openssl rand -hex 32`)
vercel env add ADMIN_SECRET
vercel env add SESSION_COOKIE_SECRET
vercel env add SYSTEM_PROMPT_VERSION   # value: v1

# 5. Pull all envs to .env.local (also writes a fresh OIDC token)
vercel env pull .env.local

# 6. Run the database migration
pnpm db:migrate

# 7. Seed the curated Reddit starter archive (optional locally, required for a
#    fresh deployment that should have immediate judge content)
pnpm db:seed:reddit
```

The deployed site can ship with a starter pool of 25 completed runs derived from r/WritingPrompts. They are committed in-repo and inserted with `pnpm db:seed:reddit`; `/judge` and voting work immediately once those rows exist.

### Develop

```bash
pnpm dev
# → http://localhost:3000
```

> ⏱️ Real model fan-out takes 20–60 seconds per submission. To work without AI cost, set `MOCK_AI=1` to short-circuit every SDK call with deterministic canned text. Playwright sets this automatically. Never enable it in production.

If `pnpm` is not on your `PATH`, prefix commands with `corepack pnpm` (this is what CI does).

---

## 🧪 Testing

```bash
pnpm test                    # Vitest unit + integration (59 tests, 13 files)
pnpm exec tsc --noEmit       # Type-check
pnpm lint                    # ESLint
pnpm build                   # Next.js production build
pnpm db:seed:reddit          # insert / verify the 25 Reddit starter runs
MOCK_AI=1 pnpm test:e2e      # Playwright happy path
```

The build and test suite validate env shape at module load, so local runs need the variables below (dummy values are fine for `tsc`, lint, test, and build).

The test pyramid:

- 🔺 **Unit** — pure functions and registries: prompt hashing, length helper, slot randomizer, validation schemas, system prompt, model seasons/pricing/cost, fraud scoring, spend-cap math, moderation pre-checks, seed validation
- 🔷 **Integration** — route handlers with mocked AI/db/Redis: run creation guards, replay/idempotency, vote submission and fraud paths
- 🟦 **E2E** — full browser flow (homepage → prompt → live stream → vote → reveal) under `MOCK_AI=1`

CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests, and a production build on every push and pull request using Corepack-pinned pnpm.

---

## 🔐 Environment variables

```bash
# 🐘 Postgres — provisioned by `vercel install neon`
DATABASE_URL=

# ⚡ Upstash Redis — provisioned by `vercel install upstash`
# (Stored under the legacy Vercel KV names for backward compatibility.)
KV_REST_API_URL=
KV_REST_API_TOKEN=

# 🤖 AI Gateway — auto-injected on Vercel, refreshed locally by `vercel env pull`
VERCEL_OIDC_TOKEN=

# 🔑 Secrets — generate with `openssl rand -hex 32`
ADMIN_SECRET=
SESSION_COOKIE_SECRET=

# 🏷️ System prompt version tag
SYSTEM_PROMPT_VERSION=v1

# ── Cost and capacity controls ────────────────────────────────────────
DAILY_SPEND_CAP_USD=25          # hard daily AI-spend ceiling
GLOBAL_MAX_CONCURRENT_RUNS=6    # max simultaneous 3-model fan-outs
GENERATION_TIMEOUT_MS=150000    # per-story wall-clock ceiling
MOCK_AI=0                       # 1 = deterministic canned text, no spend
```

`lib/env.ts` validates all of these via Zod at module load and refuses to boot on missing keys. `import "server-only"` prevents the env module from leaking into the client bundle. An empty `VERCEL_OIDC_TOKEN` in `.env.local` is treated as unset, so non-AI routes still boot.

---

## 💸 Cost and capacity

The active roster costs roughly **$0.05 per standard (medium) run**, with short runs around $0.02 and long runs around $0.09 at list prices. A $25/day cap therefore supports roughly 450–500 standard runs per day, depending on prompt length and actual output.

Guardrails, in order:

- **Replay** — an identical prompt/length/roster/version is copied from an existing run for free (fresh shuffle, new run).
- **Reservation** — each new generation atomically reserves its conservative upper-bound estimate plus 10% headroom before any provider call.
- **Reconciliation** — on completion the reservation is replaced with the actual cost; on failure or abort it is released in full.
- **Hard cap** — once today's reserved spend would exceed `DAILY_SPEND_CAP_USD`, new runs return `429 DAILY_SPEND_CAP`.
- **Concurrency gate** — at most `GLOBAL_MAX_CONCURRENT_RUNS` fan-outs run at once; excess requests get `503 AT_CAPACITY` and release their reservation.
- **Timeouts** — each story has `GENERATION_TIMEOUT_MS`; the route itself has a 300s ceiling.
- **Cheap moderation** — prompt review uses Luna with reasoning off and a 7-day Redis verdict cache.

Redis failures fail **open** for rate limits, concurrency, and spend reservations so a cache outage cannot take the site down; provider-side budgets and the admin cost dashboard remain the financial backstop.

---

## 🛡️ Benchmark integrity guarantees

Story Arena is a benchmark dataset disguised as a comparison site. The data layer enforces the guarantees that make the benchmark trustworthy:

- ✅ **One vote per `(runId, sessionId)`** — UNIQUE index on votes; races return `409` instead of overwriting
- ✅ **One output per `(runId, slotLabel)`** — UNIQUE index on story_outputs; no double-mapping
- ✅ **Votes can only reference real generated outputs** — composite FK `votes(run_id, chosen_slot)` → `story_outputs(run_id, slot_label)` enforced at the database level
- ✅ **Slot mapping is captured at write time** — the chosen slug is read from the same row used for slot lookup, so mapping drift is impossible
- ✅ **Roster is frozen per run** — every run stores `roster_id`; historical labels never follow a model rotation
- ✅ **Replay cannot double-count a judge** — runs a session already voted on are never offered as replay sources, and the dedupe key includes prompt, length, roster, and prompt version
- ✅ **Idempotent retries** — a browser retry returns the same run instead of starting a second paid generation
- ✅ **Length CHECK constraints** on free-form text (`prompt_text ≤ 4000`, `reason_text ≤ 1000`)
- ✅ **Strict failure mode** — if any of the three models fails, the whole run fails (no silent fallback that would pollute the dataset)
- ✅ **Versioned system prompt** — every run records `SYSTEM_PROMPT_VERSION` so historical data stays comparable
- ✅ **Signed session/admin cookies** — HMAC-signed, `httpOnly`, `sameSite=lax`, `secure`; admin cookies carry an expiry + signature, never the raw secret
- ✅ **Same-origin mutation checks** and layered session/IP rate limits on runs, votes, and admin login

---

## 🚀 Deployment

The repo is connected to a Vercel project at [vercel.com/cheesejaguar-2353s-projects/story-arena](https://vercel.com/cheesejaguar-2353s-projects/story-arena). Pushes to `main` auto-deploy to production via Vercel's GitHub integration.

Manual deploys:

```bash
vercel deploy           # preview
vercel deploy --prod    # production
```

Run `pnpm db:migrate` against the production database before the first deploy that includes a new migration. The migration adds roster, replay, cost, and failure columns and backfills existing runs to `legacy-2026-Q2`.

---

## 🧠 Methodology notes

The benchmark measures **human preference for fiction prompts on Story Arena**, not objective literary quality. A model that wins here is winning at being preferred by people who use this site, which is a useful signal but isn't the same as being the best fiction writer in the world. Read aggregate results with that caveat.

The system prompt is versioned (`SYSTEM_PROMPT_VERSION`) so historical data slices can be filtered to "comparable conditions" if the prompt template ever changes. Season boundaries and roster IDs provide the same guarantee for model lineups.

---

## 📄 License

Internal project. Not currently licensed for redistribution.
