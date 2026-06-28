.PHONY: dev dev-build dev-down lint test test-unit test-e2e build clean setup

# ─── Development (Docker) ──────────────────────────────────────────────────
dev:
	docker compose up --build

dev-down:
	docker compose down

dev-logs:
	docker compose logs -f

# ─── Development (Local) ───────────────────────────────────────────────────
dev-local:
	cd frontend && npm run dev

# ─── Supabase ──────────────────────────────────────────────────────────────
supabase-start:
	supabase start

supabase-stop:
	supabase stop

supabase-reset:
	supabase db reset

# ─── Quality ───────────────────────────────────────────────────────────────
lint:
	docker compose run --rm frontend npm run lint

format:
	docker compose run --rm frontend npm run format

format-fix:
	docker compose run --rm frontend npm run format:fix

# ─── Test ──────────────────────────────────────────────────────────────────
test-unit:
	docker compose run --rm frontend npm run test:unit

test-e2e:
	docker compose run --rm frontend npm run test:e2e

test: test-unit

# ─── Build ─────────────────────────────────────────────────────────────────
build:
	docker compose run --rm frontend npm run build

# ─── Utilities ─────────────────────────────────────────────────────────────
setup:
	cp -n frontend/.env.example frontend/.env.local || true
	@echo "Setup complete. Edit frontend/.env.local with your Supabase credentials."

shell:
	docker compose run --rm frontend sh

clean:
	docker compose down -v
	rm -rf frontend/node_modules frontend/dist frontend/.wrangler frontend/coverage
