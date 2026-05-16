# Smart ERP Next - New Modules Documentation

This document specifies the APIs and internal structures for the newly engineered modules.

## CRM & Sales Pipeline `/crm`
Manages the end-to-end sales lifecycle, from initial contact to closed deals, utilizing a drag-and-drop Kanban interface and AI-driven scoring.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/crm/leads` | List all pipeline leads |
| POST   | `/crm/leads` | Create a new lead |
| PATCH  | `/crm/leads/:id/status` | Move lead to a different stage (new/contacted/won) |

**Schema (`leads` table):**
- `status`: ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']
- `score`: AI computed or manual probability score (0-100)

---

## E-Invoice `/e-invoice`
Hệ thống xử lý hóa đơn điện tử tuân thủ hoàn toàn Thông tư 78 và Nghị định 123/2020/NĐ-CP. Kết nối trực tiếp với các nhà cung cấp (VNPT, Misa, Viettel) thông qua cấu hình provider.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/e-invoice` | Liệt kê danh sách hóa đơn (nháp và đã phát hành) |
| POST   | `/e-invoice` | Tạo nháp hóa đơn từ Đơn hàng (Sales Order) |
| PATCH  | `/e-invoice/:id/issue` | Ký số và gửi dữ liệu lên Cơ quan Thuế (CQT) |

---

## Hợp đồng Điện tử `/e-contracts`
Phân hệ e-Contract cho phép doanh nghiệp B2B tạo, gửi và ký số hợp đồng ngay trên nền tảng Smart ERP mà không cần bên thứ ba.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET    | `/e-contracts` | Liệt kê các hợp đồng điện tử |
| POST   | `/e-contracts` | Khởi tạo hợp đồng mới từ CRM Lead hoặc Customer |
| PATCH  | `/e-contracts/:id/sign` | Thực hiện ký số (Xác thực OTP/Token/Chữ ký ảnh) |

**Cấu trúc dữ liệu:**
- `signature_data`: Lưu trữ tọa độ chữ ký, IP người ký và log bằng chứng pháp lý.

**Hỗ trợ Mobile Native:**
- Người dùng có thể xem danh sách hợp đồng và thực hiện ký số trực tiếp trên ứng dụng di động thông qua màn hình `EContractScreen`.
- Hỗ trợ ký bằng chữ ký ảnh hoặc xác thực OTP trực tiếp trên thiết bị cầm tay.

---

## HR & Payroll `/hr`
Hệ thống nhân sự thế hệ mới, tích hợp chấm công GPS và tự động hóa bảng lương.

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST   | `/hr/attendance/shifts` | Thiết lập ca làm việc và khung giờ |
| POST   | `/hr/attendance/check-in` | Chấm công qua App (GPS + Xác thực vị trí) |
| POST   | `/hr/payroll/boards/generate` | Tự động tính toán lương thực nhận dựa trên công và OT |
| GET    | `/hr/payroll/my-payslips` | Xem phiếu lương trực tiếp trên Mobile App |

---

## Workflow Automation Engine `/automations` (Lõi hệ thống)
Cỗ máy No-code cho phép người dùng tự định nghĩa các quy trình tự động hóa mà không cần can thiệp vào mã nguồn.

**Cơ chế hoạt động:**
- `triggerEvent`: Sự kiện kích hoạt (Ví dụ: `invoice.issued`, `employee.late`).
- `conditions`: Điều kiện lọc theo định dạng JSONB (Ví dụ: `{"totalAmount": { ">": 10000000 } }`).
- `actions`: Mảng các hành động thực thi (Gửi Email, Thông báo App, Cập nhật trạng thái CRM).

*Lưu ý: Engine thực thi được tích hợp sâu vào lifecycle của NestJS và Drizzle ORM.*
