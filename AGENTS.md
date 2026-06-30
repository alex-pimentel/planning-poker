# AGENTS.md

This repo is a **Serverless Planning Poker** app.

## Commands

| Context | Command |
|---|---|
| Dev server | `make dev` (or `cd frontend && npm run dev`) |
| Unit tests | `make test-unit` |
| E2E tests | `make test-e2e` (requires dev server) |
| Lint | `make lint` |
| Format | `cd frontend && npm run format` (check) or `npx prettier --write src/` (fix) |
| Everything | `make test` (unit only) |
| Build | `make build` |

> **Important**: Always run `npm run lint` and `npx prettier --write src/` before every commit.

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

## Progress & Decisions (session memory)

### Status
- Task groups, voting flow, mediator controls, and UI polish complete
- Active branch: `feature/task-list-and-groups`

### Latest changes
- **Voting status**: removed colored dot (`sidebar-dot`), now uses only ✓/— checkbox before participant name
- **Task reordering**: fixed 403/400 errors by including all NOT NULL columns in upsert
- **Radix Select**: replaced native `<select>` across all panels; added `compact` variant
- **Initial task creation**: `createRoom` now inserts the first task
- **Task sync**: switched to broadcast-based `tasks_changed` on room channel (more reliable than `postgres_changes`)
- **Mediator transfer**: modal with participant pick list + double confirm; DB updates `rooms.mediator_id`; sidebar shows transfer button + amber highlight for mediator
- **Mediator voting**: toggle in store (`mediatorVoting`) persisted locally; sidebar toggle button for mediator; GameTable shows deck conditionally
- **Hidden cards for mediator**: replaced with `mediator.svg` placeholder image
- **Vote count**: `voted/total` in VoteResults, group-aware
- **Min/max highlights**: 🐇 (lowest unique) and 🐢 (highest unique) emoji indicators in VoteResults and GameTable slots
- **Consensus confetti**: CSS-animated particle burst when all voters agree
- **Group task overlay**: now hidden when `isRevealed`
- **Bottom panel resizable**: drag handle, height saved to `localStorage`
- **Task sorting**: completed (with `final_score`) first, pending second
- **"Vote" button**: on each pending task to select it for voting
- **"Confirm & Next"**: disabled when score input is empty
- **`clearTable` on VOTING**: now only clears `localVote` (not `votes`) to avoid race with `dbVoteSub`
- **ESLint fix**: added `setLocalVote` to dependency array in `useSupabaseRoom.js`

### Key decisions
- Broadcast over `postgres_changes` for task updates (more reliable locally)
- Renamed accent palette from blue to amber across panels
- `.glass-panel` opacity: `bg-black/60`
- Min/max highlights only when exactly one participant holds that value
- Portuguese UI labels
- `bottomHeight` key in localStorage: `planning-poker-bottom-height`

### Relevant files
- `frontend/src/hooks/useRoomActions.js` — `transferMediator()`, `advanceRound()`, `kickParticipant()`
- `frontend/src/hooks/useSupabaseRoom.js` — Presence + DB subscriptions; `clearTable` on RESET
- `frontend/src/store/gameStore.js` — `mediatorVoting`, `toggleMediatorVoting`, `clearTable`
- `frontend/src/components/ui/ParticipantSidebar.jsx` — participant rows, mediator transfer button
- `frontend/src/components/ui/TransferMediatorModal.jsx` — mediator transfer modal
- `frontend/src/components/ui/ConfirmModal.jsx` — reusable confirm modal (danger variant)
- `frontend/src/components/ui/TaskListPanel.jsx` — Vote button, auto-sort, delete via ConfirmModal
- `frontend/src/components/ui/MediatorControls.jsx` — Confirm & Next disabled without score
- `frontend/src/components/ui/VoteResults.jsx` — 🐇/🐢 highlights, voted/total, group-aware
- `frontend/src/components/canvas/GameTable.jsx` — mediator voting, confetti, 🐇/🐢 on slots
- `frontend/src/components/canvas/ConsensusConfetti.jsx` — CSS-animated confetti particles
- `frontend/src/App.jsx` — bottom panel resizable drag handle
- `frontend/src/index.css` — `.glass-panel`, `.panel-title`, `.resize-handle`, confetti keyframes
- `frontend/public/images/cards/mediator.svg` — mediator card placeholder

## Gotchas

- `supabase db reset` reapplies all migrations — use when changing schema
- Anonymous auth must be enabled in Supabase project settings (`external_anonymous_users_enabled`)
- E2E tests use Playwright with `webServer` config that auto-starts Vite
- Supabase anon key is safe to expose (RLS enforces security)
- Service role key must never be in client code
- Run `cp frontend/.env.example frontend/.env.local` before first `make dev`
