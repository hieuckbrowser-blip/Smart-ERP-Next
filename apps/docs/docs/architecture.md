# Kiášŋn trÃšc háŧ tháŧng

Smart ERP Next ÄÆ°áŧ£c xÃĒy dáŧąng theo kiášŋn trÃšc monorepo, chia sášŧ code giáŧŊa cÃĄc náŧn tášĢng.

## CášĨu trÃšc thÆ° máŧĨc

```
smart-erp-next/
âââ apps/
â   âââ api/          # Backend NestJS
â   âââ web/          # Web app Next.js
â   âââ mobile/       # Mobile app Expo
â   âââ desktop/      # Desktop app Tauri
âââ packages/
â   âââ database/     # Drizzle ORM schemas
â   âââ i18n/         # i18next translations
â   âââ types/        # Shared TypeScript types
â   âââ validation/   # Zod schemas
âââ packages/config-*/ # ESLint, TypeScript configs
```

## CÃīng ngháŧ

| ThÃ nh pháš§n | CÃīng ngháŧ |
|------------|-----------|
| Monorepo | pnpm + Turborepo |
| Backend | NestJS, JWT, bcrypt, Socket.IO |
| Database | PostgreSQL, Drizzle ORM |
| Web | Next.js 15, Tailwind CSS |
| Mobile | Expo 51, React Native |
| Desktop | Tauri (Rust + WebView) |
| I18n | i18next, react-i18next |
| Validation | Zod |

## Luáŧng dáŧŊ liáŧu

1. Client (web/mobile/desktop) gáŧ­i request Äášŋn backend API
2. JWT authentication middleware xÃĄc tháŧ±c
3. Tenant middleware inject tenantId vÃ o request context
4. Controller xáŧ­ lÃ―, gáŧi service
5. Service tÆ°ÆĄng tÃ¡c váŧi database qua Drizzle ORM
6. Real-time events ÄÆ°áŧ£c broadcast qua Socket.IO

## TÃ­nh nÄng náŧi bášt

- **Äa tenant** â Máŧi khÃĄch hÃ ng cÃģ khÃīng gian riÃªng
- **RBAC** â PhÃĒn quyáŧn admin/manager/user
- **Real-time** â ThÃīng bÃĄo ngay khi cÃģ sáŧą kiáŧn
- **Offline-first** (Äang phÃĄt triáŧn) â LÃ m viáŧc khÃīng mášĄng
