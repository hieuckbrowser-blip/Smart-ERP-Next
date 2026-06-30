.PHONY: dev test lint typecheck build clean reset ci

# ─── Development ───────────────────────────────────────────
dev:
	pnpm dev

dev:api:
	pnpm --filter @smart-erp/api dev

dev:web:
	pnpm --filter @smart-erp/web dev

# ─── Testing ───────────────────────────────────────────────
test:
	pnpm test

test:cov:
	pnpm test:cov

test:e2e:
	pnpm test:e2e

test:watch:
	pnpm test -- --watch

# ─── Quality ───────────────────────────────────────────────
lint:
	pnpm lint

typecheck:
	pnpm type-check

# ─── Build ─────────────────────────────────────────────────
build:
	pnpm build

# ─── Database ──────────────────────────────────────────────
db:migrate:
	cd packages/database && pnpm exec drizzle-kit migrate

db:generate:
	cd packages/database && pnpm exec drizzle-kit generate

db:seed:
	cd packages/database && pnpm exec tsx src/seed.ts

# ─── Docker ────────────────────────────────────────────────
docker:build:
	docker compose build

docker:up:
	docker compose up -d

docker:down:
	docker compose down

# ─── Clean ─────────────────────────────────────────────────
clean:
	pnpm clean

reset:
	pnpm clean && pnpm install

# ─── CI ────────────────────────────────────────────────────
ci: lint typecheck test

# ─── Help ──────────────────────────────────────────────────
help:
	@echo "Targets: dev, test, lint, typecheck, build, clean, reset"
	@echo "  make dev          — Start all dev servers"
	@echo "  make test         — Run unit tests"
	@echo "  make lint         — Lint all files"
	@echo "  make typecheck    — TypeScript type checking"
	@echo "  make build        — Build all packages"
	@echo "  make docker:up    — Start Docker Compose"
	@echo "  make ci           — Full CI pipeline locally"
