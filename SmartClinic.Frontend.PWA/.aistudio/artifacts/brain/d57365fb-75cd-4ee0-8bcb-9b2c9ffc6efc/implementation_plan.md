# SmartClinic - Kiến trúc Phân lập 2 Layout & Tối ưu Giao diện Y tế HIS Đa Role

Hệ thống được tái cấu trúc thành 2 Bố cục gốc (Root Layouts) tách biệt hoàn toàn nhằm xóa bỏ triệt để tình trạng giao diện lộn xộn giữa cổng thông tin người bệnh và phần mềm quản trị chuyên môn của nhân viên y tế:
1. **PORTAL LAYOUT (Khách vãng lai & Bệnh nhân):** Cổng thông tin y tế thanh lịch lấy cảm hứng từ `benhvienlaokhoa.vn`, thanh điều hướng ngang dính, quy trình đặt lịch 3 bước, theo dõi tiến trình ca khám liên khoa thời gian thực, và Khung chat Trợ lý AI RAG phong cách Facebook Messenger.
2. **WORKSPACE LAYOUT (Lễ tân, Bác sĩ, Quản trị viên):** Giao diện phần mềm quản trị y tế chuyên dụng với Sidebar cố định 260px, thanh breadcrumbs mỏng, bảng điều phối hàng chờ, bàn khám EMR chia cột 30/70, điều phối cận lâm sàng 2 chiều bảo mật theo `DoctorId` (`DOC-01` & `DOC-02`), và Nhật ký kiểm toán so sánh Old vs New values.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Quy tắc Phân lập Layout (Layout Isolation) tuyệt đối:**
> - Toàn bộ banner, thẻ quảng cáo, chân trang tin tức, và bong bóng Chat AI Messenger của bệnh nhân **chỉ xuất hiện ở Portal Layout** và sẽ **bị loại bỏ hoàn toàn khỏi Workspace Layout** của nhân viên y tế.
> - Thanh công cụ **Demo Role Switcher Bar** nằm cố định trên mép cao nhất màn hình với 6 nút chuyển nhanh 1-click: `[1. Khách (Guest)]`, `[2. Bệnh nhân (Mới - Chưa có hồ sơ)]`, `[3. Bệnh nhân (Đã đủ hồ sơ)]`, `[4. Lễ tân]`, `[5. Bác sĩ (Khám chính & CĐHA)]`, `[6. Quản trị viên]`.
> - Kèm theo kịch bản mẫu có sẵn (bệnh nhân *Trần Văn An* tại phòng `DOC-01`) để phục vụ chấm thi đồ án: Bác sĩ khám chính chỉ định X-Quang -> Chuyển sang Bác sĩ CĐHA trả kết quả -> Bác sĩ chính nhận đèn báo tím/xanh kê đơn thuốc -> Sửa đơn và sang Quản trị viên xem Audit Logs so sánh Old/New values.

---

## 1. Overview & Core Concept

- **Mục tiêu:** Cung cấp trải nghiệm chuẩn mực, sạch sẽ, không rối mắt cho cả 2 nhóm đối tượng: Người bệnh cần sự ân cần, minh bạch, dễ đặt lịch; Nhân viên y tế cần tốc độ xử lý nhanh, mật độ thông tin cao, bảo mật phân quyền (Data Masking) và phối hợp liên khoa không độ trễ.
- **Đối tượng sử dụng (Personas):**
  - *Khách vãng lai (Guest):* Tìm kiếm thông tin chuyên khoa, bảng giá, bác sĩ, đặt hẹn ban đầu.
  - *Bệnh nhân (Patient):* Bị chặn bởi Onboarding Gate nếu chưa có CCCD/BHYT; theo dõi live stepper 5 bước liên khoa; tra cứu đơn thuốc điện tử.
  - *Lễ tân (Receptionist):* Duyệt lịch từ xa, đón khách Walk-in, cấp STT vào phòng, điều phối hàng chờ mà không nhìn thấy bệnh án chi tiết.
  - *Bác sĩ Khám chính (DOC-01 - BS. Nguyễn Minh Tuấn):* Quản lý hàng chờ 3 tab (`Chờ khám`, `Đi Cận lâm sàng`, `Đã có kết quả`), đo sinh hiệu, chỉ định X-quang/xét nghiệm, kê đơn thuốc và chuyển khoa.
  - *Bác sĩ Cận lâm sàng (DOC-02 - BS. Lê Hoàng):* Tiếp nhận thực hiện phiếu, chụp chiếu, mô tả hình ảnh và trả kết quả về đúng `DOC-01`.
  - *Quản trị viên (Admin):* Giám sát KPI, duyệt/lập chỉ mục Vector Pinecone cho tài liệu RAG, tra cứu Audit Logs.

---

## 2. User Experience & Visual Design

### A. Hệ thống Màu sắc & Nhận diện (Trắng & Xanh lá mạ y tế)
- **Nền chính:** Trắng `#FFFFFF`, nền vùng làm việc phụ: `#F4F9F5` / `#F8FAFC`.
- **Màu chủ đạo (Primary):** Xanh lá mạ `#4CAF50` (hover `#43A047`), nền thẻ chọn `#E8F5E9`, chữ nhấn tiêu đề `#1B5E20`.
- **Màu trạng thái chuyên biệt:**
  - Chờ xử lý / Đang chờ gọi: Vàng cam `#F59E0B`
  - Đang khám / Đang thực hiện: Xanh dương `#2563EB`
  - Đã có kết quả cận lâm sàng gửi về: Tím nhấp nháy `#7C3AED`
  - Hoàn tất / Đã lưu: Xanh ngọc lục bảo `#10B981`
  - Cảnh báo dị ứng / Khẩn cấp: Đỏ tươi `#EF4444`

### B. Bố cục Phân khu A: Portal Layout (Guest & Patient)
- **Demo Switcher Bar:** Ghim trên cùng, màu đen/xanh navy tối giản, các nút chuyển vai trò rõ ràng kèm tooltip mô tả.
- **Top Utility Bar:** Hotline `1900 6868`, Giờ làm việc `07:30 - 17:00 (Thứ 2 - Thứ 7)`, Địa chỉ phòng khám, Đăng nhập/Đăng ký.
- **Sticky Navbar:** Logo SmartClinic + Menu ngang (`Trang chủ`, `Chuyên khoa`, `Đội ngũ Bác sĩ`, `Bảng giá dịch vụ`, `Hướng dẫn khám`, Menu cá nhân `Lịch hẹn & Hồ sơ của tôi` khi đã đăng nhập) + CTA `"Đặt lịch khám"`.
- **Hero & 4 Quick Cards:** Banner y tế trang nhã + 4 card nổi (`[Đặt khám theo bác sĩ]`, `[Tư vấn triệu chứng cùng AI]`, `[Tra cứu kết quả]`, `[Bảng giá niêm yết]`).
- **Booking Wizard (3 bước trên 1 màn hình):**
  - Chốt chặn: Nếu `isProfileCompleted === false`, hiển thị thẻ thông báo khóa lịch sự yêu cầu hoàn tất CCCD/BHYT.
  - Bước 1: Chọn Chuyên khoa -> Bác sĩ.
  - Bước 2: Chọn Ngày -> Lưới khung giờ chia Sáng/Chiều kèm chỉ báo sức chứa `(Còn 2/3 chỗ)` hoặc `(Hết chỗ - Disable)`.
  - Bước 3: Triệu chứng -> Bấm xác nhận sinh mã `APT-2026-XXXX`.
- **Theo dõi Tiến trình Ca khám (Live Stepper 5 bước):**
  `Đã Check-in (STT: A-012)` -> `Khám lâm sàng (Phòng 101)` -> `Cận lâm sàng (Phòng 204 - Chụp X-Quang)` -> `Đã có kết quả - Chờ BS kết luận` -> `Hoàn tất & Nhận đơn thuốc`.
- **Floating Messenger-style AI Chat Widget:**
  - Thu gọn: Nút tròn xanh lá mạ có badge và chấm xanh online.
  - Cửa sổ nổi 390px x 580px bo góc, 3 chip gợi ý câu hỏi nhanh.
  - **3 Kiểu bong bóng phản hồi:**
    1. *RAG Answer:* Kèm thẻ trích dẫn nguồn `📄 Nguồn: Hướng dẫn Nội soi (v2.1) • Trang 4, Mục 2.2` + nút 👍/👎.
    2. *Interactive Function Calling Card:* Thẻ gợi ý chuyên khoa + Bác sĩ + Hàng nút giờ dạng viên thuốc (`[08:30]`, `[09:30 • Còn 1 chỗ]`). Bấm giờ -> highlight xanh đậm -> Hiện nút `"Đặt nhanh 09:30 với BS. Tuấn"` ngay trong khung chat!
    3. *Safe Fallback:* Cảnh báo từ chối kê đơn khi hỏi mua thuốc, hướng dẫn khám trực tiếp.

### C. Bố cục Phân khu B: Workspace Layout (Receptionist, Doctor, Admin)
- **Cấu trúc:** Sidebar cố định bên trái 260px (Menu active nền xanh nhạt `#E8F5E9`, viền trái xanh mạ `#4CAF50`) + Topbar mỏng hiển thị Breadcrumb, thông tin Bác sĩ/Nhân viên, Phòng trực và Trạng thái kết nối Gateway .NET 8.
- **Lễ tân (`/receptionist/*`):**
  - *Duyệt lịch hẹn:* Lọc Ngày/Bác sĩ, nút `"Check-in Tiếp đón"` (sinh STT `A-01`, chuyển thành `Visit`).
  - *Đón khách Walk-in:* Form 2 cột (Tra cứu/Nhập hành chính + Chọn khoa/phòng -> Cấp số ngay).
  - *Queue Board:* Cột theo từng phòng khám (Đang khám, Đang chờ, nút Gọi số tiếp theo, Vắng mặt).
  - *Data Masking:* Không hiển thị chẩn đoán, kết quả cận lâm sàng hay đơn thuốc.
- **Bác sĩ Khám chính (`DOC-01` - BS. Nguyễn Minh Tuấn):**
  - Bộ chuyển đổi nhanh danh tính Bác sĩ trên Sidebar (`DOC-01` vs `DOC-02`).
  - Cột trái 30%: Hàng chờ 3 tab (`Chờ khám mới`, `Đang đi Cận lâm sàng`, `Đã có kết quả` với badge tím nhấp nháy ưu tiên).
  - Cột phải 70%: Bệnh án EMR (Header dị ứng đỏ nổi bật, Sub-tab 1: Sinh hiệu tự tính BMI & Lâm sàng; Sub-tab 2: Chỉ định CLS liên khoa; Sub-tab 3: Chẩn đoán ICD-10, Kê đơn thuốc có bản in QR code, Chuyển khoa).
  - Chốt chặn Audit: Khi sửa ca đã hoàn tất, bắt buộc nhập lý do và ghi vào `AuditLogs`.
- **Bác sĩ Cận lâm sàng (`DOC-02` - BS. Lê Hoàng):**
  - Hàng chờ phiếu chỉ định gửi đến Khoa Chẩn đoán hình ảnh.
  - Nút `"Tiếp nhận thực hiện"` (gán `AssignedDoctorId = DOC-02`, hiển thị thông tin chỉ định).
  - Nhập mô tả tổn thương, kết luận, đính kèm ảnh X-quang mẫu -> Bấm `"Hoàn tất & Trả kết quả về BS. Tuấn (DOC-01)"` -> Kích hoạt ngay đèn báo `ResultsReady` bên màn hình `DOC-01`.
- **Quản trị viên (`/admin/*`):**
  - KPI Dashboard & Biểu đồ lưu lượng.
  - Quản trị Kho tri thức RAG: Tải PDF/DOCX, Phê duyệt & Lập chỉ mục Vector Pinecone, Gỡ hiệu lực.
  - Quản lý Danh mục & Ma trận khung giờ trực (`TimeSlots` + `MaxCapacity`).
  - Bảng Audit Logs: Nút xem chi tiết mở Modal so sánh JSON 2 cột: `OldValues` (đỏ) vs `NewValues` (xanh).

---

## 3. Key Product Decisions & Trade-Offs

- **Tách biệt 2 Root Layouts hoàn toàn:** Thay vì nhồi nhét chung 1 thanh Navbar cho cả bệnh nhân lẫn bác sĩ, hệ thống kiểm tra `activeRole` để hiển thị `PortalLayout` (cho `guest`, `patient`) hoặc `WorkspaceLayout` (cho `receptionist`, `doctor_primary`, `doctor_imaging`, `admin`). Điều này giải quyết tận gốc vấn đề giao diện quá tải.
- **Bộ chuyển đổi Demo Role Switcher Bar cố định:** Giúp người xem/giảng viên chuyển qua lại giữa 6 trạng thái ngay tức thì mà không cần đăng xuất/đăng nhập lại.
- **Kịch bản mẫu liên kết xuyên suốt (State persistence):** Dữ liệu ca khám của *Trần Văn An* được lưu đồng bộ trong Zustand. Khi `DOC-01` gửi chỉ định và chuyển sang `DOC-02`, kết quả trả về lập tức kích hoạt thông báo badge tím bên `DOC-01`.

---

## 4. Technical Architecture & Data Strategy

### Component & Layout Hierarchy Diagram

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                      DEMO ROLE SWITCHER BAR (Sticky at Top Edge)                       │
│  [1. Guest] | [2. Patient (Chưa hồ sơ)] | [3. Patient (Đủ hồ sơ)] | [4. Lễ tân] | ... │
└────────────────────────────────────────────────────────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────────────────────┐
│       PORTAL ROOT LAYOUT             │  │            WORKSPACE ROOT LAYOUT             │
│  (For Guest & Patient)               │  │  (For Receptionist, Doctor & Admin)         │
├──────────────────────────────────────┤  ├───────────────────────────────┬──────────────┤
│ 1. Top Utility Bar (Hotline/Hours)   │  │ Fixed Left Sidebar (260px)    │ Thin Topbar  │
│ 2. Sticky Horizontal Navbar          │  │ - Logo SmartClinic Workspace │ - Breadcrumb │
│ 3. Main Portal Viewport:             │  │ - Role Context Switcher       │ - User badge │
│    - Home (Hero + 4 Quick Cards)     │  │ - Navigation Menu Items       │ - Gateway ok │
│    - Specialties / Doctors / Pricing │  │ - Logout / System Info        ├──────────────┤
│    - Profile & Onboarding Gate       │  │                               │ Active Desk  │
│    - Booking Wizard (3 Steps)        │  │                               │ Workspace    │
│    - Live Visit Stepper (5 Steps)    │  │                               │ (EMR, Queue, │
│ 4. Hospital Regulatory Footer        │  │                               │  RAG, Audit) │
│ 5. Floating Messenger AI Chat Widget │  │                               │              │
│    (RAG Citation / Interactive Card) │  │ [NO Banner, NO Public Footer, │              │
└──────────────────────────────────────┘  │  NO Messenger Chat Widget]   │              │
                                          └───────────────────────────────┴──────────────┘
```

### Data Flow & Mock Seed Scenario
```
[Bệnh nhân Trần Văn An] ──(Lễ tân Check-in)──> [Visit: STT A-01]
                                                      │
                                                      ▼
                      [BS Khám chính DOC-01: BS. Nguyễn Minh Tuấn]
                                                      │
                           (Tạo phiếu ClinicalOrder ORD-XRAY-01)
                                                      │
                                                      ▼
                      [Khoa CĐHA DOC-02: BS. Lê Hoàng Tiếp nhận]
                                                      │
                                      (Nhập kết luận & Trả kết quả)
                                                      │
                                                      ▼
                      [DOC-01 nhận Badge tím ResultsReady & Kê đơn RX]
                                                      │
                                           (Chỉnh sửa lại đơn thuốc)
                                                      │
                                                      ▼
                      [Admin: AuditLogs ghi nhận OldValues vs NewValues]
```
