<div align="center">
  <h1>🎯 Planning Poker</h1>
  <p><strong>Real-time sprint planning — serverless, multiplayer, beautifully simple</strong></p>
  <p>React 19 · Supabase Realtime · Cloudflare Pages · Zustand</p>

  <p>
    <img src="https://img.shields.io/badge/react-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React">
    <img src="https://img.shields.io/badge/supabase-2.45-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
    <img src="https://img.shields.io/badge/zustand-5-593D88?style=for-the-badge" alt="Zustand">
    <img src="https://img.shields.io/badge/cloudflare%20pages-latest-F38020?style=for-the-badge&logo=cloudflare&logoColor=white" alt="Cloudflare Pages">
    <img src="https://img.shields.io/badge/vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite">
    <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
  </p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-architecture">Architecture</a> •
    <a href="#-quick-start">Quick Start</a> •
    <a href="#-project-structure">Structure</a> •
    <a href="#-testing">Testing</a> •
    <a href="#-deployment">Deployment</a>
  </p>
</div>

---

## ✨ Features

- **Real-time Multiplayer** — Powered by Supabase Realtime (Broadcast + Presence) for instant vote sync across all participants
- **Card Flip Animation** — CSS `rotateY` with `backface-visibility` for smooth flip reveals
- **Mediator Workflow** — Create rooms, reveal votes, reset rounds, and track task history with full mediator controls
- **Multiple Deck Types** — Fibonacci, T-Shirt sizes, or Powers of 2 — choose what fits your team
- **Serverless Architecture** — Zero servers to manage. Frontend on Cloudflare Pages global CDN, backend on Supabase
- **Secure by Default** — Row-Level Security (RLS) policies on every table, anonymous auth with UUID-based sessions
- **Comprehensive CI/CD** — GitHub Actions pipeline with lint, test, security audit, build, and automatic Cloudflare deployment
- **Edge Function Admin** — Supabase Edge Function (Deno) for administrative operations like bulk vote reset

---

## 🏗️ Architecture

```
                     ┌─────────────────────────────────┐
                     │      Cloudflare Pages CDN        │
                     │   (Global Edge, ~300 locations)  │
                     │        planning-poker            │
                     └──────────────┬──────────────────┘
                                    │ HTTPS / WSS
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Supabase Backend                            │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │    Realtime       │  │  Edge Functions  │                        │
│  │  Broadcast/Pres.  │  │  (Deno runtime)  │                        │
│  └────────┬─────────┘  └────────┬─────────┘                        │
│           │                      │                                  │
│           ▼                      ▼                                  │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    PostgreSQL (via pgcrypto)                 │    │
│  │  • rooms — RLS-enforced planning sessions                   │    │
│  │  • votes — per-user-per-room with unique constraint         │    │
│  │  • tasks — persistent task history across rounds            │    │
│  │  • supabase_realtime publication for instant streaming      │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Mediator creates room** → `INSERT rooms` → row broadcast via Realtime
2. **Participant joins** → `SELECT rooms by code` → Presence channel tracks online users
3. **Vote cast** → `UPSERT votes` → Postgres changes feed → all clients receive update
4. **Reveal** → `UPDATE rooms SET status = 'revealed'` → cards flip with CSS animation
5. **Reset** → Edge Function `DELETE votes` + `UPDATE rooms` → table clears, new round begins

---

## ⚡ Quick Start

### Prerequisites

- Node.js 22+
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)
- Docker (for local Supabase)
- A [Supabase project](https://supabase.com) (free tier)

### Local Setup

```bash
# 1. Clone and install
git clone https://github.com/your-username/planning-poker.git
cd planning-poker
make setup

# 2. Start local Supabase
supabase start

# 3. Copy environment variables
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your Supabase URL and anon key
# (get these from `supabase start` output or Supabase dashboard)

# 4. Run migrations
supabase db reset

# 5. Start development server
make dev
```

Open **http://localhost:5173** — create a room, share the code, and start planning!

### Services

| Service | URL | Description |
|---|---|---|
| **Frontend** | http://localhost:5173 | React SPA with real-time game table |
| **Supabase Studio** | http://localhost:54323 | Database management UI |
| **Supabase API** | http://localhost:54321 | REST + Realtime endpoints |
| **SMTP (fake)** | http://localhost:54324 | Local email testing |

---

## 📁 Project Structure

```
planning-poker/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Orchestrator — chains all checks
│       ├── lint.yml        # ESLint + Prettier
│       ├── test.yml        # Vitest unit tests
│       ├── security.yml    # npm audit + secret scanning
│       ├── audit.yml       # Dependency freshness + bundle size
│       ├── build.yml       # Production build artifact
│       └── deploy.yml      # Cloudflare Pages deployment
│
├── supabase/
│   ├── config.toml              # Local Supabase configuration
│   ├── migrations/
│   │   └── 20260627000000_init.sql  # Schema + RLS + Realtime
│   └── functions/
│       └── manage-room/            # Edge Function (Deno)
│           └── index.ts
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── canvas/            # Game table (CSS green felt)
│   │   │   │   └── GameTable.jsx       # Participant slots + deck row
│   │   │   └── ui/                # 2D interface panels
│   │   │       ├── CreateRoom.jsx
│   │   │       ├── JoinRoom.jsx
│   │   │       ├── RoomInfo.jsx
│   │   │       ├── VoteResults.jsx
│   │   │       ├── MediatorControls.jsx
│   │   │       ├── ParticipantSidebar.jsx
│   │   │       ├── Card2D.jsx
│   │   │       └── Select.jsx
│   │   ├── hooks/
│   │   │   ├── useSupabaseRoom.js  # Realtime + Presence orchestration
│   │   │   └── useRoomActions.js   # CRUD operations for rooms
│   │   ├── store/
│   │   │   └── gameStore.js        # Zustand state machine
│   │   ├── lib/
│   │   │   ├── supabase.js         # Supabase client singleton
│   │   │   ├── constants.js        # Deck definitions, config
│   │   │   └── utils.js            # Helpers (room codes, math)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css               # Tailwind + glass effects
│   ├── tests/
│   │   ├── gameStore.test.js       # State machine unit tests
│   │   ├── utils.test.js           # Utility function tests
│   │   └── e2e/
│   │       └── room.spec.js        # Playwright multi-user E2E
│   ├── package.json
│   ├── vite.config.js
│   ├── vitest.config.js
│   ├── playwright.config.js
│   ├── wrangler.json               # Cloudflare Pages config
│   ├── tailwind.config.js
│   └── .env.example
│
├── Makefile           # Unified command interface
├── AGENTS.md          # OpenCode/Claude agent instructions
├── instructions.md    # Project blueprint reference
└── README.md
```

---

## 🧪 Testing

```bash
# Unit tests (Vitest)
make test-unit          # npm run test:unit

# E2E tests (Playwright)
make test-e2e           # npx playwright test

# Run all
make test

# Watch mode
npm run test:watch      # frontend/
```

### E2E Test Requirements

E2E tests require the dev server running. The Playwright config auto-starts it via `webServer`.

```bash
# Install Playwright browsers once
npx playwright install chromium

# Run E2E suite
make test-e2e
```

---

## 🚀 Deployment

### Cloudflare Pages

The project is designed for Cloudflare Pages with automatic CI/CD.

```bash
# Manual deployment (requires wrangler CLI)
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=planning-poker
```

### Automatic CI/CD

Push to `main` triggers:

1. **Lint** — ESLint + Prettier check
2. **Test** — Vitest unit tests
3. **Security** — npm audit + dependency check
4. **Audit** — Bundle size + dependency freshness
5. **Build** — Production bundle
6. **Deploy** → Cloudflare Pages (main only)

### Required Secrets

Configure these in your GitHub repository settings (`Settings → Secrets and variables → Actions`):

| Secret | Description |
|---|---|
| `CF_API_TOKEN` | Cloudflare API token with Pages permissions |
| `CF_ACCOUNT_ID` | Cloudflare account ID |

---

## 🔐 Security

- **Row-Level Security (RLS)** enforced on all tables
- **Anonymous sessions** via UUID — no passwords required
- **Mediator-only controls** enforced via database-level checks
- **Service Role Key** restricted to Edge Functions only (never exposed to client)
- **npm audit** runs in CI to catch vulnerable dependencies

---

## 🧰 Commands

```bash
make setup           # Install deps + copy .env.example
make dev             # Start Vite dev server
make dev-build       # Install + start dev
make lint            # ESLint check
make format          # Prettier check
make format-fix      # Prettier write
make test            # Run unit tests
make test-e2e        # Run Playwright E2E
make build           # Production build
make clean           # Remove node_modules, dist, coverage

# Supabase
supabase start       # Start local Supabase stack
supabase stop        # Stop local Supabase
supabase db reset    # Reset database + run migrations

# CI simulation (requires act)
make act-lint        # Simulate lint workflow
make act-test        # Simulate test workflow
make act-all         # Simulate full CI pipeline
```

---

## 🛠️ Stack

| Layer | Technology |
|---|---|
| **State** | [Zustand](https://github.com/pmndrs/zustand) |
| **Backend** | [Supabase](https://supabase.com) (PostgreSQL + Realtime + Edge Functions) |
| **Frontend** | [React 19](https://react.dev) + [Vite 6](https://vite.dev) |
| **UI** | [Tailwind CSS 3](https://tailwindcss.com) (glassmorphism design) |
| **Animation** | CSS transitions (`rotateY`, `backface-visibility`) |
| **Hosting** | [Cloudflare Pages](https://pages.cloudflare.com) |
| **Testing** | [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev) |
| **CI/CD** | [GitHub Actions](https://github.com/features/actions) |

---

## 📄 License

MIT © 2026

---

<div align="center">
  <sub>Built with ❤️ using React, Supabase, and Cloudflare Pages</sub>
</div>
