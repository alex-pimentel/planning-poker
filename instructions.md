# Planning Poker 3D — Project Blueprint

This document captures the complete technical specification for the
**Serverless 3D Planning Poker** application.

## Architecture

- **Frontend**: Cloudflare Pages + Vite + React Three Fiber
- **Backend**: Supabase (PostgreSQL + Realtime Broadcast/Presence + Edge Functions)
- **State**: Zustand
- **CI/CD**: GitHub Actions (lint → test → security → audit → build → deploy)

## Key Design Decisions

- **Anonymous sessions**: UUID-based identity instead of auth — lowers friction
- **Single-table Realtime**: Votes and rooms both in `supabase_realtime` publication
- **Mediator-enforced workflow**: Only the room creator can reveal/reset
- **3D as primary interface**: Three.js for table, cards, and avatar presence
- **Edge Function for admin ops**: `manage-room` handles bulk reset/reveal/delete

## Data Flow

1. Room created → `INSERT rooms` → Realtime broadcasts to subscribers
2. User joins → Presence channel tracks online state
3. Vote → `UPSERT votes` → Postgres changes feed → all clients
4. Reveal → `UPDATE rooms SET status='revealed'` → cards flip in 3D
5. Reset → Edge Function deletes votes, resets status

## RLS Strategy

- Rooms: anyone can SELECT/INSERT; only mediator can UPDATE/DELETE
- Votes: anyone can SELECT/INSERT; only vote owner can UPDATE
- Auth check: `auth.uid() = mediator_id` / `auth.uid() = user_id`

## Deployment

1. Push to `main` triggers CI pipeline
2. Build produces `frontend/dist/` artifact
3. Wrangler deploys to Cloudflare Pages
4. Supabase migrations applied manually or via `supabase db push`

## Environment Variables

| Variable | Source |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project settings |
| `VITE_SUPABASE_ANON_KEY` | Supabase project settings (public, RLS-safe) |
| `CF_API_TOKEN` | GitHub secrets |
| `CF_ACCOUNT_ID` | GitHub secrets |
