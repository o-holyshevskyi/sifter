# CLAUDE.md — Sifter Codebase Guide

## Project Overview

**Sifter** is an AI-powered RSS feed filtering system for senior developers and tech entrepreneurs. It has no UI — all user interaction is via a Telegram bot. The backend is built on Next.js API routes, deployed on Vercel with scheduled cron jobs.

**Core pipeline:**
1. Users manage RSS subscriptions through Telegram bot commands
2. Hourly cron fetches new posts from all subscribed RSS sources
3. Hourly cron scores unprocessed posts with GPT-4o-mini (score 1–10)
4. Daily cron sends posts with score ≥ 8 to subscribed users via Telegram

---

## Repository Structure

```
sifter/
├── app/
│   ├── api/
│   │   ├── bot/route.ts          # Telegram webhook handler (Grammy)
│   │   ├── ping/route.ts         # Health check endpoint
│   │   └── cron/
│   │       ├── fetch/route.ts    # Hourly: fetch RSS posts
│   │       ├── process/route.ts  # Hourly +15min: AI-score posts
│   │       └── digest/route.ts   # Daily 08:00 UTC: send digest
│   ├── layout.tsx                # Root Next.js layout (metadata only)
│   └── globals.css               # Tailwind CSS + CSS variables
├── src/lib/
│   ├── ai.ts                     # OpenAI scoring (GPT-4o-mini)
│   ├── db.ts                     # Supabase client singleton
│   └── rss.ts                    # RSS feed fetcher/parser
├── vercel_postponed.json         # Cron schedule config (rename to vercel.json to activate)
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, API routes only) |
| Language | TypeScript 5 (strict mode) |
| Database | Supabase (PostgreSQL) |
| Bot | Grammy 1.41 (Telegram) |
| AI | OpenAI GPT-4o-mini |
| RSS | rss-parser |
| Styling | Tailwind CSS 4 (unused — no UI) |
| Deployment | Vercel |

---

## Database Schema

Inferred from API route code — there is no migration file in this repo.

| Table | Key Columns |
|-------|-------------|
| `users` | `telegram_id` (unique), `username`, `tier` |
| `sources` | `id`, `url` (unique), `type` ('rss') |
| `posts` | `id`, `source_id`, `url` (unique), `title`, `content`, `published_at`, `ai_score`, `ai_summary`, `created_at` |
| `user_subscriptions` | `user_id`, `source_id` (composite key) |

---

## Environment Variables

All required — the app will throw at startup if missing:

```bash
OPEN_AI_KEY                  # OpenAI API key (GPT-4o-mini)
NEXT_PUBLIC_SUPABASE_URL     # Supabase project URL (public)
SUPABASE_SERVICE_ROLE_KEY    # Supabase service role secret
TELEGRAM_BOT_TOKEN           # Telegram bot API token
CRON_SECRET                  # Bearer token for cron endpoint auth
```

---

## Development Commands

```bash
npm run dev      # Start local dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## API Routes

### `POST /api/bot`
Telegram webhook. Handles bot commands via Grammy:
- `/start` — Upserts user into `users` table
- `/add <url>` — Validates URL, inserts into `sources`, creates `user_subscriptions` row
- `/list` — Returns user's active feed subscriptions
- `/remove <url>` — Removes subscription for the user

### `GET /api/ping`
Health check. Returns `{ message: 'ok' }`.

### `GET /api/cron/fetch`
Fetches the latest 10 posts per RSS source and upserts them into `posts` (deduplicated by URL). Requires `Authorization: Bearer <CRON_SECRET>`.

### `GET /api/cron/process`
Takes up to 5 unprocessed posts (`ai_score IS NULL`) and scores them with GPT-4o-mini. Updates `ai_score` and `ai_summary` on each. Requires `Authorization: Bearer <CRON_SECRET>`.

### `GET /api/cron/digest`
For each user, queries their subscribed sources for posts with `ai_score >= 8` published in the last 24 hours. Sends an HTML-formatted Telegram message if any qualifying posts exist. Requires `Authorization: Bearer <CRON_SECRET>`.

---

## AI Scoring Logic (`src/lib/ai.ts`)

GPT-4o-mini scores posts 1–10 for relevance to senior devs/tech entrepreneurs:

- **8–10**: Paradigm shifts, major releases, zero-days, funding news, AI research breakthroughs
- **1–3**: Tutorials, pet projects, clickbait, local news
- **Intentionally avoids scores 4–7** (bimodal distribution)

Returns `{ score: number, summary: string }` where summary is ≤ 15 words.
Temperature is set to 0.2 for deterministic output. On error, returns `{ score: 1, summary: "Failed to score" }`.

---

## Cron Schedule

Defined in `vercel_postponed.json` (rename to `vercel.json` to activate on Vercel):

| Job | Schedule | Description |
|-----|----------|-------------|
| `/api/cron/fetch` | `0 * * * *` | Fetch new posts every hour |
| `/api/cron/process` | `15 * * * *` | Score unprocessed posts at :15 each hour |
| `/api/cron/digest` | `0 8 * * *` | Send daily digest at 08:00 UTC |

---

## Key Conventions

### Authentication
- Cron endpoints use `Authorization: Bearer <CRON_SECRET>` header validation
- Return `401` if token is missing or incorrect

### Error Handling
- All cron routes: log errors but continue processing (don't abort on partial failure)
- `rss.ts`: returns empty array on fetch/parse failure
- `ai.ts`: returns `score: 1` on OpenAI failure

### Database Access
- Always use the Supabase client from `src/lib/db.ts` (singleton, service role)
- Import: `import { supabase } from '@/lib/db'`

### Path Aliases
- `@/*` maps to the repository root (configured in `tsconfig.json`)

### TypeScript
- Strict mode enabled — no implicit `any`
- Target: ES2017, module resolution: `bundler`

---

## No Tests

There are currently no tests in this repository. When adding tests, consider:
- Jest or Vitest with `ts-jest` for unit tests
- Testing `src/lib/ai.ts`, `src/lib/rss.ts` utilities directly
- Mocking Supabase and OpenAI clients

---

## Deployment

**Platform**: Vercel

1. Set all environment variables in Vercel project settings
2. Rename `vercel_postponed.json` → `vercel.json` to enable cron jobs
3. Configure the Telegram bot webhook to point to `https://<your-domain>/api/bot`
4. Push to `master` — Vercel deploys automatically
