# Chiến lược nền tảng

Smart ERP Next phát triển theo hướng native đa nền tảng: mỗi app có trải nghiệm riêng cho môi trường của nó, nhưng cùng dùng chung product core trong `packages/*`.

## Nguyên tắc

1. **Apps compose, packages own logic** — app chỉ phụ trách điều hướng, UI native, storage adapter và lifecycle.
2. **Vietnam-first** — tiếng Việt, VND, múi giờ Việt Nam, mã số thuế, hóa đơn điện tử và phương thức thanh toán nội địa là mặc định.
3. **Offline-first ở nghiệp vụ vận hành** — POS, đơn hàng, sản phẩm, kho, khách hàng, mua hàng và thu chi phải hoạt động được khi mạng yếu.
4. **Tenant-safe by design** — API, realtime room, sync queue và report đều phải scope bằng `tenantId`.
5. **No hardcoded user-facing text** — mọi chuỗi hiển thị phải có key trong `@smart-erp/i18n` cho cả `vi` và `en`.

## Native Targets

| Target   | Package             | Runtime                      | Trách nhiệm                                              |
| -------- | ------------------- | ---------------------------- | -------------------------------------------------------- |
| API      | `@smart-erp/api`    | NestJS                       | Business rules, auth, realtime, reporting, integrations  |
| Web      | `@smart-erp/web`    | Next.js 15                   | Office ERP, admin, reporting, POS                         |
| Mobile   | `@smart-erp/mobile`  | Expo 52 + React Native 0.76   | Field sales, warehouse, customer workflows, offline ops    |
| Desktop  | `@smart-erp/desktop` | Tauri 2 + Vite + React       | Local POS, kiosk, hardware-adjacent workflows           |
| Docs     | `@smart-erp/docs`   | Docusaurus 3                  | Developer, operator, API, architecture docs              |

## Shared Package Contract

`@smart-erp/shared` là contract không phụ thuộc framework cho:

- `NATIVE_PLATFORMS` — danh sách target native và trách nhiệm từng app.
- `ERP_MODULES` — module catalog kèm trạng thái core/growth/planned, offline, realtime, target app.
- `LOCALIZATION_PROFILES` — locale `vi`/`en`, currency, timezone, date format, tax label, invoice profile, payment methods.
- `DIFFERENTIATION_PILLARS` — các trụ cột giúp quyết định ưu tiên khi cạnh tranh với ERPNext, Odoo, VietERP, KiotViet, Nhanhvn, MISA.

## Competitive Direction

| Pillar                     | Ý nghĩa kỹ thuật                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------- |
| Native everywhere          | Web (Next.js), Mobile (Expo/RN), Desktop (Tauri); mỗi app native nhưng dùng chung packages |
| Offline-first              | Dexie + CRDT/vector clock; resolve conflict tự động hoặc manual resolution           |
| Vietnam-first localization | `vi` fallback, `en` required; VND, 10% VAT, hóa đơn điện tử, MoMo/VNPay/ZaloPay  |
| Tenant-safe realtime      | Socket.IO + JWT tenant isolation; không bao giờ lộ cross-tenant data                  |
| AI-powered CRM             | Next Best Action algorithm; lead scoring; churn prediction; CLV analysis              |
| Multi-entity sync         | Đồng bộ real-time giữa POS, kho, khách hàng, đơn hàng trên mọi thiết bị             |

## Advantage vs Competitors

| Đối thủ      | Smart ERP Next Advantage                                                        |
| ------------- | ------------------------------------------------------------------------------ |
| ERPNext/Odoo | Native mobile app, offline-first, Vietnam localization, modern React stack        |
| KiotViet      | Full ERP (không chỉ POS), CRM, accounting, reporting tích hợp                 |
| Nhanh.vn      | Multi-tenant, real-time sync, cross-platform (web/mobile/desktop)              |
| MISA          | Open architecture, developer-friendly, API-first design                        |
| Sapo          | Offline-first với Dexie, modern stack (Next.js 15, React 19)                    |
| Knote         | Professional ERP với enterprise features: RBAC, multi-tenant, audit log          |

## Definition of Done

Một module mới chỉ được coi là sẵn sàng khi:

- Có API tenant-scoped hoặc contract rõ nếu là client-only.
- Có route/screen native phù hợp cho target đã công bố.
- Có loading, empty, error state trên client.
- Có i18n key trong cả `vi/common.json` và `en/common.json`.
- Có validation/schema dùng chung nếu có form hoặc payload.
- Có sync strategy nếu module nằm trong nhóm offline-first.
- Có tài liệu cập nhật trong docs khi thay đổi behavior hoặc architecture.
