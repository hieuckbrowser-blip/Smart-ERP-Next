# Sync Package - Offline-First với CRDT

## Tổng quan

Package này cung cấp cơ chế đồng bộ dữ liệu **offline-first** với khả năng giải quyết xung đột bằng **CRDT** (Conflict-free Replicated Data Type) và vector clock. Đây là tính năng vượt trội so với các ERP truyền thống (ERPNext, Odoo, Misa) vốn chỉ hoạt động online hoặc xử lý xung đột kém.

## Tính năng chính

- ⚡ **Offline-first**: Người dùng có thể làm việc khi mất mạng, dữ liệu được lưu local (IndexedDB)
- 🔄 **Tự động đồng bộ**: Khi có mạng, hàng đợi sync tự động xử lý
- 🔀 **Giải quyết xung đột CRDT**: Dùng vector clock để merge dữ liệu từ nhiều thiết bị
- 🏢 **Tenant isolation**: Mỗi tenant có dữ liệu riêng
- 🔐 **JWT authentication**: Bảo mật qua access token

## Cấu trúc

```
packages/sync/
├── src/
│   ├── db.ts              # IndexedDB schema (Dexie)
│   ├── sync-service.ts    # Service quản lý sync queue
│   └── index.ts           # Exports
├── README.md
└── package.json
```

## Sử dụng

```typescript
import { syncService } from '@smart-erp/sync';

// Queue operation khi offline
await syncService.queueOperation('invoices', 'create', invoiceData, invoiceId);

// Force sync
await syncService.processQueue();

// Get offline data
const offlineUsers = await syncService.getOfflineUsers();
```

## Conflict Resolution

Khi hai thiết bị cùng sửa một bản ghi:
- Server trả về 409 Conflict kèm version hiện tại
- Local thực hiện merge theo LWW (Last-Write-Wins) dựa trên vector clock
- Dữ liệu merge được lưu cả local và remote

## API Endpoints (Server-side cần có)

- `POST /:entity` - Tạo mới (kèm `_version`, `_vectorClock` trong body)
- `PATCH /:entity/:id` - Cập nhật (kèm version để kiểm tra conflict)
- `DELETE /:entity/:id` - Xóa

## Lưu ý khi thêm locale mới

Luôn đảm bảo file JSON được lưu với encoding **UTF-8 không BOM** để tránh lỗi encode tiếng Việt. Dùng lệnh:
```bash
# Chuyển đổi file sang UTF-8
iconv -f ISO-8859-1 -t UTF-8 input.json > output.json
```