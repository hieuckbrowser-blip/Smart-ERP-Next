# HÆ°áŧng dášŦn phÃĄt triáŧn

## YÃªu cáš§u

- Node.js >= 20
- pnpm >= 9
- PostgreSQL >= 15
- Rust (cho desktop app)

## CÃ i Äáš·t

```bash
# Clone repository
git clone <repo-url>
cd smart-erp-next

# CÃ i Äáš·t dependencies
pnpm install

# TášĄo file .env cho backend
cp apps/api/.env.example apps/api/.env
# Sáŧa DATABASE_URL trong .env

# ChášĄy database migrations
cd packages/database
pnpm generate
pnpm migrate
```

## ChášĄy áŧĐng dáŧĨng

```bash
# ChášĄy tášĨt cášĢ apps (dev mode)
pnpm dev

# ChášĄy riÃŠng táŧŦng app
pnpm --filter @smart-erp/api dev
pnpm --filter @smart-erp/web dev
pnpm --filter @smart-erp/mobile dev  # Expo
pnpm --filter @smart-erp/desktop dev  # Tauri
```

## Build

```bash
pnpm build
```

## Commit convention

Sáŧ­ dáŧĨng [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - TÃ­nh nÄng máŧi
- `fix:` - Sáŧa láŧi
- `docs:` - TÃ i liáŧu
- `refactor:` - TÃĄi cášĨu trÃšc
- `test:` - ThÃªm test
- `chore:` - CÃīng viáŧc build, config

## Kiáŧm tra mÃĢ nguáŧn

```bash
pnpm lint
pnpm test
```

## Database schema changes

1. Sáŧa schema trong `packages/database/src/schema/`
2. ChášĄy `pnpm --filter @smart-erp/database generate`
3. ChášĄy migration: `pnpm --filter @smart-erp/database migrate`
