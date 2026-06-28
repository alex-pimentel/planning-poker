# AGENTS.md

This repo is a **Serverless 3D Planning Poker** app.

## Commands

| Context | Command |
|---|---|
| Dev server | `make dev` (or `cd frontend && npm run dev`) |
| Unit tests | `make test-unit` |
| E2E tests | `make test-e2e` (requires dev server) |
| Lint | `make lint` |
| Everything | `make test` (unit only) |
| Build | `make build` |

## Project layout

- `frontend/` — Vite + React 19 SPA (the entire application)
- `supabase/` — migrations, Edge Functions, `config.toml`
- `.github/workflows/` — CI/CD pipeline (lint → test → security → audit → build → deploy)

## Key points

- **No authentication**: anonymous Sup Auth (`signInAnonymously`) + RLS
- **Supabase Realtime**: Broadcast + Presence for live sync; Postgres changes for vote/card updates
- **Mediator is the room creator**: only they can reveal/reset via RLS
- **Pure 2D/CSS rendering** (no Three.js). Green felt table via CSS gradients.
- **Card flip animation**: CSS `rotateY` with `backface-visibility`
- **Shareable room links**: URL param `?join=ROOMCODE` pre-fills Join screen
- **Dev requires `supabase start`** (Docker) + `cp .env.example .env.local`
- **Deploy**: push to `main` → GitHub Actions builds → Wrangler deploys to Cloudflare Pages
- **Edge Function** at `supabase/functions/manage-room/` for admin ops
- **Makefile** is the single entry for dev/lint/test/build

## Gotchas

- `supabase db reset` reapplies all migrations — use when changing schema
- Anonymous auth must be enabled in Supabase project settings (`external_anonymous_users_enabled`)
- E2E tests use Playwright with `webServer` config that auto-starts Vite
- Supabase anon key is safe to expose (RLS enforces security)
- Service role key must never be in client code
- Run `cp frontend/.env.example frontend/.env.local` before first `make dev`
