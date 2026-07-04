# ADR 0002: API Versioning and Domain Boundaries

## Status
Accepted

## Context
Smart ERP Next exposes a single API used by the Next.js web app, potential mobile clients and future integration partners. We need a versioning strategy that lets us evolve endpoints without breaking consumers, and clear domain boundaries so the monorepo does not become a flat ball of mud.

## Decision
1. **Header-based versioning** using `X-API-Version` with a default of `1` when the header is absent.
   - This keeps URLs stable and avoids URL path pollution (`/v1/...`, `/v2/...`).
   - A middleware injects the default header so existing clients do not need to change.
2. **Domain modules grouped into 12 bounded contexts** under `apps/api/src`:
   - Core (auth, users, tenants, api-keys, health)
   - Finance (accounting, payments, invoices, payroll)
   - Inventory (products, warehouses, transfers)
   - Sales (orders, customers, pos)
   - Procurement (purchasing, suppliers)
   - Manufacturing
   - HR
   - Quality
   - CRM
   - E-invoice
   - Forecast & Analytics
   - Platform (webhooks, feature flags, telemetry, audit logs)
3. **Shared packages** (`@smart-erp/database`, `@smart-erp/shared`, `@smart-erp/utils`, `@smart-erp/accounting`) contain cross-domain concerns and must not depend on app-level modules.

## Consequences
- Consumers can opt into new API versions by sending a different `X-API-Version` header.
- Internal code is organized by business capability, making ownership and testing clearer.
- Adding a new bounded context requires adding a domain module and updating the ownership matrix, preventing ad-hoc flat imports.

## Alternatives considered
- **URL path versioning**: simpler for public docs but harder for web/mobile clients that share base URLs.
- **No versioning**: faster initially but blocks backward-compatible evolution once external integrations exist.
