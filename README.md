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

| Slot (randomized) | Model | Provider |
| --- | --- | --- |
| A / B / C | GPT-5.4 | OpenAI |
| A / B / C | Claude Opus 4.6 | Anthropic |
| A / B / C | Gemini 3.1 Pro | Google |

Each prompt goes to all three models in parallel via the Vercel AI Gateway, with the same system prompt and the same length budget. Slot assignment is a cryptographically random shuffle so model identity stays hidden until after the vote.

---

## ✨ Features

- 📝 Single-field prompt input with short / medium / long length selector
- 🎲 Cryptographically random slot assignment (Fisher-Yates with `crypto.randomInt`)
- 🙈 Blind A/B/C comparison — model identity is never sent to the client pre-vote
- 🗳️ One-click voting with optional reason text
- 🎭 Post-vote reveal showing which model wrote which story
- 📊 Public aggregate results page
- 🔒 Admin dashboard with per-run drill-down
- 🛡️ DB-enforced integrity (UNIQUE on votes, composite FK from votes → story_outputs)
- ⚡ Sub-300s function timeout for the 3-way LLM fan-out via Vercel Fluid Compute
- 🎨 Literary typography (Fraunces serif body, Inter UI) — reads like a slim hardback

---

## 🧱 Architecture

```
                    ┌─────────────────────┐
                    │  Next.js 16 App     │
                    │  (Fluid Compute)    │
                    └──────────┬──────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌───────────────┐
│ Neon Postgres │    │ Vercel AI       │    │ Upstash Redis │
│ (Drizzle ORM) │    │ Gateway (OIDC)  │    │ (rate limit)  │
└───────────────┘    └────────┬────────┘    └───────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         ┌────────┐     ┌─────────┐     ┌─────────┐
         │ OpenAI │     │Anthropic│     │ Google  │
         │GPT-5.4 │     │Opus 4.6 │     │Gemini3.1│
         └────────┘     └─────────┘     └─────────┘
```

### Request flow (the happy path)

1. User submits a prompt to `POST /api/runs`
2. Server-side rate limit, prompt validation, prompt moderation
3. Run row inserted with `status: "pending"`
4. `Promise.allSettled` fan-out to all three models in parallel via the AI Gateway
5. Cryptographic Fisher-Yates shuffle assigns each output to slot A, B, or C
6. All three `story_outputs` rows persisted with the slot mapping
7. Run marked complete; user redirected to `/compare/<runId>`
8. Compare page server-fetches the run, projects only `{ slot, text }` for the client (no model identity)
9. User reads, picks a slot, submits vote
10. `POST /api/votes` resolves the slot → real model slug from the same row, persists the vote, returns the reveal mapping
11. Reveal panel renders with the model labels

---

## 🛠️ Tech stack

| Layer | Choice |
| --- | --- |
| **Runtime** | Node.js 24 LTS on Vercel Fluid Compute |
| **Framework** | Next.js 16 (App Router, Turbopack, RSCs) |
| **Language** | TypeScript (strict) |
| **Styling** | Tailwind CSS v4 + shadcn/ui (`@base-ui/react`) |
| **Fonts** | Inter (UI) + Fraunces (story body) via `next/font` |
| **AI** | Vercel AI SDK v6 + Vercel AI Gateway |
| **AI auth** | `VERCEL_OIDC_TOKEN` (auto-injected, auto-rotated, no static keys) |
| **Database** | Neon Postgres via Vercel Marketplace |
| **ORM** | Drizzle ORM 0.45 + drizzle-kit migrations |
| **Cache / limits** | Upstash Redis + `@upstash/ratelimit` (sliding window) |
| **Validation** | Zod v4 (`safeParse` + `treeifyError`) |
| **Logging** | Pino structured JSON (Vercel ingests natively) |
| **Analytics** | `@vercel/analytics` |
| **Tests** | Vitest 4 (unit + integration) + Playwright (e2e) |
| **Package manager** | pnpm 10 |

---

## 📦 Project structure

```
story-arena/
├── app/
│   ├── page.tsx                       # 🏠 Landing
│   ├── compare/[runId]/               # 🗳️ Blind 3-way comparison
│   ├── results/                       # 📊 Public aggregate stats
│   ├── about/                         # 📜 Methodology + privacy
│   ├── admin/                         # 🔒 Cookie-gated dashboard
│   └── api/
│       ├── runs/                      # POST create + GET blinded
│       ├── votes/                     # POST submit + reveal
│       ├── results/                   # Public aggregate
│       └── admin/                     # Admin endpoints
├── components/
│   ├── prompt-form.tsx
│   ├── compare-grid.tsx               # 3-col desktop / tabs mobile
│   ├── story-card.tsx                 # Serif reading card with scroll tracking
│   ├── vote-panel.tsx
│   ├── reveal-panel.tsx
│   └── ui/                            # shadcn primitives
├── lib/
│   ├── ai/
│   │   ├── models.ts                  # Single source of truth for model slugs
│   │   ├── prompts.ts                 # Versioned system prompt
│   │   ├── generate-story.ts          # Single-model wrapper (with MOCK_AI short-circuit)
│   │   └── benchmark-run.ts           # Parallel orchestrator
│   ├── db/
│   │   ├── schema.ts                  # Drizzle schema (3 tables, 4 enums, integrity constraints)
│   │   ├── client.ts
│   │   ├── queries.ts
│   │   └── migrate.ts
│   ├── moderation/                    # AI-SDK-powered content review
│   ├── security/                      # Session cookie, rate limit, admin auth
│   └── utils/                         # hash, slot randomizer, length, validation, logger
├── drizzle/migrations/                # Generated SQL migrations
├── tests/
│   ├── unit/                          # Pure-function tests
│   ├── integration/                   # Mocked AI/db tests
│   └── e2e/                           # Playwright happy path
└── vercel.ts                          # Typed Vercel project config
```

---

## 🏁 Getting started

### Prerequisites

- 🟢 Node.js 24 LTS
- 📦 pnpm 10 (`corepack enable` will set it up)
- ▲ Vercel CLI 50.41+ (`npm i -g vercel`)
- 🔗 A Vercel project linked to this repo (`vercel link`)

### One-time setup

```bash
# 1. Clone and install
git clone git@github.com:cheesejaguar/story-arena.git
cd story-arena
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
pnpm tsx --env-file .env.local lib/db/migrate.ts

# 7. Seed the curated Reddit starter archive (optional locally, required for a fresh deployment that should have immediate judge content)
pnpm db:seed:reddit
```

The deployed site can ship with a starter pool of 25 completed runs derived from r/WritingPrompts. They are committed in-repo and inserted with `pnpm db:seed:reddit`; `/judge` and voting work immediately once those rows exist.

### Develop

```bash
pnpm dev
# → http://localhost:3000
```

> ⏱️ Real model fan-out takes 20–60 seconds per submission. To work without AI cost, set `MOCK_AI=1` in your environment to short-circuit the SDK calls with deterministic canned text.

---

## 🧪 Testing

```bash
pnpm test                    # Vitest unit + integration (35 tests)
pnpm exec tsc --noEmit       # Type-check
pnpm lint                    # ESLint
pnpm build                   # Next.js production build
pnpm db:seed:reddit          # insert / verify the 25 Reddit starter runs
MOCK_AI=1 pnpm test:e2e      # Playwright happy path
```

The test pyramid:

- 🔺 **Unit** — pure functions: prompt hash, length helper, slot randomizer, validation schemas, system prompt, moderation length pre-checks
- 🔷 **Integration** — `generateBenchmarkStories` with mocked single-model generator, `POST /api/votes` with mocked DB and rate limit
- 🟦 **E2E** — full browser flow (homepage → prompt → compare → vote → reveal) under `MOCK_AI=1`

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
```

`lib/env.ts` validates all of these via Zod at module load and refuses to boot on missing keys. `import "server-only"` prevents the env module from leaking into the client bundle.

---

## 🛡️ Benchmark integrity guarantees

Story Arena is a benchmark dataset disguised as a comparison site. The data layer enforces the guarantees that make the benchmark trustworthy:

- ✅ **One vote per `(runId, sessionId)`** — UNIQUE index on votes; no race condition
- ✅ **One output per `(runId, slotLabel)`** — UNIQUE index on story_outputs; no double-mapping
- ✅ **Votes can only reference real generated outputs** — composite FK `votes(run_id, chosen_slot)` → `story_outputs(run_id, slot_label)` enforced at the database level
- ✅ **Slot mapping is captured at write time** — the chosen slug is read from the same row used for slot lookup, so mapping drift is impossible
- ✅ **Length CHECK constraints** on free-form text (`prompt_text ≤ 4000`, `reason_text ≤ 1000`)
- ✅ **Strict failure mode** — if any of the three models fails, the whole run fails (no silent fallback that would pollute the dataset)
- ✅ **Versioned system prompt** — every run records the `SYSTEM_PROMPT_VERSION` so historical data stays comparable

---

## 🚀 Deployment

The repo is connected to a Vercel project at [vercel.com/cheesejaguar-2353s-projects/story-arena](https://vercel.com/cheesejaguar-2353s-projects/story-arena). Pushes to `main` auto-deploy to production via Vercel's GitHub integration.

Manual deploys:

```bash
vercel deploy           # preview
vercel deploy --prod    # production
```

---

## 🧠 Methodology notes

The benchmark measures **human preference for fiction prompts on Story Arena**, not objective literary quality. A model that wins here is winning at being preferred by people who use this site, which is a useful signal but isn't the same as being the best fiction writer in the world. Read aggregate results with that caveat.

The system prompt is versioned (`SYSTEM_PROMPT_VERSION`) so historical data slices can be filtered to "comparable conditions" if the prompt template ever changes.

---

## 📄 License

Internal project. Not currently licensed for redistribution.
