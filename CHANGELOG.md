# Changelog

All notable changes to Smart ERP Next are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.2.2] — 2026-06-26

### Fixed
- One-click startup: main docker-compose.yml uses pre-built GHCR image
- Docker entrypoint standalone path for web server
- drizzle-kit moved to production dependencies (migration works in Docker image)
- Dynamic API version from package.json (was hardcoded 0.4.0)
- Missing @Controller() decorator on AnalyticsController
- POS negative discount could increase total (Math.max(0, discount))
- Search duplicate API calls on 5 list pages
- Hardcoded Vietnamese strings replaced with i18n t() on POS, invoice, warehouses, purchasing, dashboard
- CI E2E tests: HR employee, accounting, inventory workflows
- 13 web locale mojibake files fixed

### Added
- 48 modules registered (AnalyticsModule, ChatModule, SettingsModule, SocketModule, EcommerceModule, AiCopilotModule)
- CI fully green: 162/162 web E2E tests pass
- i18n 4 locales: vi, en, pt, ru with expanded translations
- docker-compose.dev.yml for building from source

## [0.2.0] — 2026-06-25

- TDD for all controllers + services (100% coverage)
- Removed 62 @ts-nocheck files
- Fixed 29+ end-user bugs from exploratory testing
- Windows pnpm workspace fix: node-linker=hoisted
- Docker unified image with auto-migration + seed
- E2E tests: HR, inventory, accounting workflows
- i18n 4 locales with expanded translations
- Dead code cleanup: removed 34 unused files
- DevOps simplified: removed mobile/desktop builds, monitoring services

## [0.1.0] — 2026-06-15

Initial release with core ERP modules.
