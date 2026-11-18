# Kế hoạch xây dựng SmartClinic chạy thật

Ngày cập nhật: 04/11/2026. Đây là kế hoạch thực thi mới; các báo cáo thiết kế trước đó là tài liệu tham khảo, không phải bằng chứng tính năng đã hoàn thành.

## 1. Điểm xuất phát

Đã có: ASP.NET Core 8 phân lớp, EF Core SQL Server, JWT/password hash, API đăng ký/đăng nhập/me, API hồ sơ bệnh nhân và frontend tích hợp. Regression suite backend dùng repository giả; frontend dùng adapter HTTP giả.

Đã gỡ khỏi source ứng dụng: chuyển vai và hồ sơ demo, mockData, clinic store mô phỏng, chat theo từ khóa, màn hình nghiệp vụ phụ thuộc dữ liệu giả, script tạo/đổi tài khoản thử cố định. Giữ kiểm thử tự động và dữ liệu fixture nằm trong tests.

Không chỉnh sửa hoặc xóa tài khoản/dữ liệu trong SQL Server trong lần dọn source này. Cần kiểm kê dữ liệu thử và thực hiện kế hoạch làm sạch riêng trước khi vận hành.

Ứng dụng chỉ cho thao tác thật ở phần tài khoản và hồ sơ; các phân hệ còn lại hiển thị chưa khả dụng. Không fallback dữ liệu mẫu khi API lỗi. Không đặt phần trăm hoàn thành theo số lượng màn hình.

## 2. Nguyên tắc triển khai

- Mỗi lát cắt gồm schema, use case, API/DTO, quyền dữ liệu, UI, kiểm thử và hướng dẫn chạy.
- SQL Server là nguồn dữ liệu chuẩn; Zustand chỉ giữ trạng thái UI và dữ liệu tải từ API.
- Backend lấy người thao tác từ JWT; kiểm tra quyền trên từng hồ sơ, lịch hẹn, lượt khám và file.
- Giữ kiến trúc monolith phân lớp hiện có, chưa cần microservices.
- Lưu thời điểm theo UTC; hiển thị theo giờ Việt Nam. Ngày khám/ngày sinh có quy ước riêng trong hợp đồng API.
- Không cache bệnh án/token/response riêng tư bằng service worker; không ghi dữ liệu sức khỏe vào log thông thường.
- Chỉ thông báo lưu thành công sau khi server commit. Có trạng thái loading, lỗi, dữ liệu trống và retry.

## 3. Các giai đoạn và điều kiện nghiệm thu

| Giai đoạn | Công việc | Phụ thuộc | Điều kiện hoàn thành |
|---|---|---|---|
| 0. Baseline | Kiểm kê schema SQL thực tế; đối chiếu model; chốt migration có phiên bản, DB test, cấu hình dev/test/prod, root README và CI build/test | Hiện trạng | Tạo DB trống rồi nâng cấp được; thử trên bản sao DB hiện tại; chạy được API/PWA từ hướng dẫn; không dùng dữ liệu vận hành cho tests |
| 1. Danh tính và quyền | Account status, quy trình cấp tài khoản nhân viên, refresh rotation/logout server, current-user service, policy Receptionist, permission theo dữ liệu; hoàn thiện test hồ sơ | 0 | Khóa tài khoản/thu hồi phiên có hiệu lực theo thiết kế; patient không đọc/sửa người khác; không tự đổi role; HTTP + SQL integration đạt |
| 2. Danh mục và lịch | Specialty, DoctorProfile, ClinicRoom, MedicalService, Medicine, DoctorSchedule, ngày nghỉ, TimeSlot; API public/admin và UI từ API | 0–1 | Admin cập nhật được; public chỉ thấy dữ liệu active; không trùng lịch bác sĩ/phòng; không dùng ID cố định |
| 3. Đặt lịch | API xem giờ trống, đặt/đổi/hủy/xác nhận; capacity transaction, rowversion, idempotency; UI bệnh nhân/lễ tân | 1–2 | Nhiều request tranh chỗ cuối chỉ số chỗ hợp lệ thành công; hủy không trả chỗ hai lần; đổi thất bại giữ lịch cũ; patient chỉ xem lịch của mình |
| 4. Tiếp đón | PatientProfile độc lập, UserId nullable; Visit, check-in từ hẹn, walk-in, hàng chờ và phân công | 1–3 | Walk-in không cần tài khoản; check-in retry không tạo hai Visit; số thứ tự không trùng theo phạm vi; lễ tân không nhận nội dung lâm sàng |
| 5. Khám và đơn thuốc | MedicalRecord theo Visit, sinh tồn, chẩn đoán, Prescription/Items có snapshot; công bố kết quả và patient history | 4 | Chỉ bác sĩ được phân công sửa; hoàn tất có đủ dữ liệu; hồ sơ đã ký có revision thay vì sửa tự do; patient chỉ xem kết quả được công bố của mình |
| 6. Cận lâm sàng và liên khoa | ClinicalOrder, atomic claim, kết quả, file riêng tư, DepartmentReferral và trạng thái tổng hợp Visit | 5 | Hai bác sĩ không nhận cùng phiếu; kết quả quay đúng bác sĩ yêu cầu; file kiểm tra quyền; trạng thái tổng hợp đúng khi nhiều phiếu cập nhật |
| 7. Thông báo và quản trị | Outbox/job retry, inbox/SignalR, bài viết, thống kê theo định nghĩa và audit viewer | 3–6 | Không mất thông báo sau commit; retry không gửi trùng; thống kê đối chiếu SQL; audit có actor và thay đổi cần thiết |
| 8. RAG thật | Upload/duyệt/version tài liệu, extraction/chunk/index job, vector search, backend LLM, citations và tools tra lịch/giá | 2–3, 7 | Chỉ dùng tài liệu active/approved; trích dẫn truy ngược được; gỡ tài liệu loại khỏi retrieval; thiếu nguồn có fallback; tool được kiểm tra quyền; có bộ câu hỏi đánh giá |
| 9. Triển khai | Staging, HTTPS, secrets, backup/restore thử, monitoring, kiểm tra bảo mật, E2E và quy trình nâng cấp | Mọi lát cắt được chọn bàn giao | Khôi phục được DB; CI đạt; migration có dry-run/rollback hoặc roll-forward; chạy xuyên suốt bằng tài khoản và dữ liệu thật trên staging |

Audit và bảo vệ dữ liệu triển khai xuyên suốt từ giai đoạn 1. PWA phát triển cùng API từng giai đoạn. Mobile riêng chỉ bắt đầu sau khi hợp đồng API và luồng bệnh nhân ổn định.

## 4. Các quyết định dữ liệu cần chốt trước khi viết nghiệp vụ

1. PatientProfile có Id riêng, PatientCode unique, UserId nullable; chuyển FK hiện có bằng migration/backfill, không tạo hai hồ sơ cho cùng danh tính mà không có quy trình hợp nhất.
2. Visit có PatientProfileId, AppointmentId nullable, PrimaryDoctorId, phòng, thời điểm và trạng thái. MedicalRecord gắn Visit thay vì bắt buộc Appointment.
3. TimeSlot có phạm vi bác sĩ/ngày/giờ/phòng và sức chứa; chọn chiến lược transaction/locking hoặc optimistic concurrency có retry. RowVersion đơn lẻ không đủ.
4. Prescription/PrescriptionItem và ClinicalOrder/Result là bảng có cấu trúc; không tiếp tục lưu toàn bộ đơn như chuỗi tùy ý.
5. Chốt state machine của Appointment, Visit, Order và Referral, người được chuyển trạng thái và điều kiện chuyển.
6. File lưu private storage, SQL chỉ metadata; URL truy cập ngắn hạn hoặc stream qua endpoint có authorization.
7. Chốt dữ liệu bắt buộc cho patient tự đăng ký và walk-in; CCCD/BHYT là thông tin khai báo đến khi có quy trình xác minh.

## 5. Sprint khởi động đề xuất

Sprint 1, dự kiến 1–2 tuần tùy schema thực tế và nhân lực:

- [ ] Lập inventory DB: bảng, cột, FK/index, collation email, dữ liệu role và password hash; không in secrets hoặc thông tin bệnh nhân vào báo cáo.
- [ ] Chọn baseline migration và chạy trên DB test trống/bản sao; ghi rõ thứ tự các script đã có.
- [ ] Chuẩn hóa lệnh build solution và console suite; tạo CI cho backend, frontend typecheck/test/build.
- [ ] Viết HTTP integration tests cho register/login/me/profile trên SQL Server test; thêm test token thiếu/hết hạn và quyền patient.
- [ ] Chốt mô hình tài khoản nhân viên, account status, session và quyền Receptionist; không khôi phục script tạo tài khoản thử cố định.
- [ ] Chốt DTO/schema danh mục/lịch và backlog sprint 2.

Đầu ra sprint 1: baseline tái lập được, bộ test tích hợp, sơ đồ/decision record dữ liệu và backlog có acceptance criteria. Chưa bắt đầu đặt lịch trước khi capacity và mô hình Patient/Visit được chốt.

## 6. Mốc dùng được đầu tiên

Đăng ký → đăng nhập → hoàn thiện hồ sơ → xem lịch thật → đặt lịch → lễ tân check-in → bác sĩ khám/kê đơn → bệnh nhân xem kết quả đã công bố.

Mốc này tương ứng giai đoạn 0–5. RAG, liên khoa, mobile và dashboard nâng cao có mốc nghiệm thu riêng. Không cam kết ngày hoàn thành toàn hệ thống trước khi kiểm kê DB và ước lượng backlog theo nguồn lực.

## 7. Rủi ro phải kiểm chứng

- Schema thật có thể khác entity và các script rời; migration phải được thử trên bản sao trước.
- Build solution mặc định từng thất bại không có diagnostic rõ; build API tuần tự và console suite đã chạy được, cần ổn định trong CI.
- Test giả hiện có không chứng minh transaction, constraint, concurrency, middleware hoặc CORS hoạt động với DB thật.
- Xóa token client chưa thu hồi JWT; cần định nghĩa thời gian hiệu lực sau logout/khóa/đổi quyền.
- Kiểm kê dữ liệu thử hiện hữu và tài khoản nhân viên là công việc riêng; không xóa tự động theo email/phỏng đoán.
