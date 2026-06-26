# Smart ERP Next v0.2.2

## Quick Start
```bash
docker compose up -d
# Web: http://localhost:3457
# Login: admin@smarterp.vn / admin123
```

## What's new
- **One-click startup**: `docker compose up -d` dùng image GHCR có sẵn, không cần build
- **TDD coverage**: 966 tests, 216 suites, 93.1% coverage, 100% testable files
- **All modules wired**: 48 modules registered, Analytics/Chat/Settings/Socket/Ecommerce/AiCopilot
- **29+ bugs fixed**: POS negative discount, duplicate API calls, i18n hardcoded strings, race conditions
- **0 @ts-nocheck**, **0 type errors**: Toàn bộ codebase sạch TypeScript
- **i18n 4 locales**: vi, en, pt, ru

## Tech Stack
- **Backend**: NestJS + Drizzle ORM + PostgreSQL
- **Frontend**: Next.js 15 + Tailwind CSS + lucide-react
- **Auth**: JWT + bcrypt
- **i18n**: react-i18next (4 locales)
- **Deploy**: Docker, GitHub Container Registry
