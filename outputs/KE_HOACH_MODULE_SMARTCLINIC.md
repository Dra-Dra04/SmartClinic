# Kế hoạch xây dựng SmartClinic theo hiện trạng mã nguồn

Ngày rà soát: 31/10/2026. Căn cứ: mô tả hệ thống người dùng cung cấp và mã nguồn trong checkout hiện tại. Đây là kế hoạch triển khai, không phải xác nhận hệ thống đã vận hành thực tế.

## 1. Kết luận hiện trạng

Project đang ở giai đoạn nền tảng backend + xác thực cơ bản. Không nên tính một module đã hoàn thành chỉ vì đã có entity hoặc bảng mapping.

| Phần | Đã có trong source | Chưa có / cần bổ sung |
|---|---|---|
| Kiến trúc | 4 project Domain, Application, Infrastructure, API; phụ thuộc Application → Domain, Infrastructure → Application/Domain | Quy ước feature, xử lý lỗi nghiệp vụ thống nhất, current-user abstraction, kiểm tra quyền dữ liệu |
| Xác thực | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`; chuẩn hóa email; kiểm tra điện thoại; tạo PatientProfile cùng User; access JWT | Refresh/logout, thu hồi phiên, tài khoản bị khóa, Receptionist, đăng nhập bằng điện thoại, quản trị tài khoản |
| Mật khẩu | ASP.NET Core PasswordHasher, hỗ trợ rehash, kiểm tra dummy hash khi không tìm thấy user | Khác mô tả BCrypt; cần thống nhất tài liệu hoặc có kế hoạch chuyển định dạng hash |
| Bảo vệ API | JWT issuer/audience/lifetime/signature; 3 policy Admin/Doctor/Patient; rate limit auth; ProblemDetails; Swagger | Policy lễ tân; quyền theo PatientId/DoctorId; masking; audit; mã hóa trường |
| Hồ sơ | PatientProfile có hành chính, BHYT, CCCD, dị ứng, bệnh nền; DoctorProfile có chuyên khoa, giới thiệu, phí | API cập nhật; IsProfileCompleted; kiểm tra bắt buộc phía server; hồ sơ tên bác sĩ đầy đủ |
| Đặt lịch | Appointment, TimeSlot; RowVersion được map concurrency token | Use case đặt/đổi/hủy; MaxCapacity; bộ đếm chỗ; lịch trực, phòng khám; transaction; kiểm thử đồng thời |
| Khám bệnh | MedicalRecord có diagnosis/notes và prescription dạng chuỗi, FK AppointmentId | Visit, chỉ số sinh tồn, phân công bác sĩ, ClinicalOrder, Referral, đơn thuốc có cấu trúc |
| Tri thức AI | KnowledgeDoc có title/file URL/upload time/IsVectorized | Phiên bản, phê duyệt, is_active, extraction, chunks, vector index, RAG, function calling, hội thoại |
| Thông báo | Notification và User.DeviceToken | API, realtime, push, nhắc hẹn, xử lý gửi lại |
| Dữ liệu | EF Core SQL Server, 10 entity và mapping; UserRepository, UnitOfWork | Không thấy migration/SQL tạo schema hoặc seed có phiên bản trong repository |
| Kiểm thử | Console regression suite `SmartClinic.Auth.Tests` dùng fake repository, hash/JWT thật | HTTP integration, SQL Server integration, concurrency, quyền dữ liệu, toàn bộ luồng khám |
| Clients | Không thấy source web/mobile trong checkout | Web portal/PWA và Expo mobile |

### Bằng chứng chính

- `SmartClinic.Backend/SmartClinic.API/Controllers/AuthController.cs`: controller duy nhất tìm thấy.
- `SmartClinic.Backend/SmartClinic.Application/Auth/AuthService.cs`: use case hiện có chỉ thuộc auth; đăng ký yêu cầu cả email và điện thoại, đăng nhập dùng email.
- `SmartClinic.Backend/SmartClinic.Infrastructure/Data/ApplicationDbContext.cs`: 10 DbSet; TimeSlot có RowVersion nhưng chưa có thuật toán giữ chỗ.
- `SmartClinic.Backend/SmartClinic.Domain/Entities/MedicalRecord.cs`: bệnh án bắt buộc AppointmentId; chưa hỗ trợ Visit độc lập.
- `SmartClinic.Backend/SmartClinic.Domain/Constants/UserRole.cs`: chỉ Patient, Doctor, Admin.
- `AUTH_GUIDE.md` có nội dung cũ: mật khẩu ghi 15 ký tự nhưng code là 10; đường dẫn API vẫn trỏ thư mục cũ. Khi triển khai dùng code hiện tại làm căn cứ và cập nhật hướng dẫn.

### Giới hạn kiểm chứng

Đã thử build solution, build API riêng và chạy console regression suite bằng `--no-restore`. Lệnh đều thất bại; MSBuild chỉ in Build FAILED, 0 warning, 0 error, không có chẩn đoán cụ thể trong output. Vì vậy chưa xác nhận build/test đang xanh và chưa kết luận nguyên nhân. Chưa kết nối SQL Server, chưa chạy HTTP API, chưa kiểm tra schema/dữ liệu thật. Cần thu log diagnostic và kiểm tra restore/SDK/build environment ở bước đầu.

Working tree hiện có thay đổi chuyển thư mục API, file bị xóa và file chưa track từ trước; kế hoạch này không chỉnh sửa hoặc hoàn tác các thay đổi đó.

## 2. Các quyết định thiết kế phải chốt sớm

1. **PatientProfile độc lập tài khoản (đã chốt theo bổ sung Walk-in):** giữ bảng PatientProfiles, thêm Id làm khóa chính, PatientCode duy nhất và UserId nullable. Tạo unique filtered index trên UserId khi khác NULL cho mô hình một tài khoản liên kết một hồ sơ. Các FK bệnh nhân dùng PatientProfileId trỏ tới Id. Không tạo email/mật khẩu giả cho khách vãng lai. Liên kết hồ sơ cũ qua quy trình xác minh, không tự gắn chỉ bằng số điện thoại trùng.
2. **Visit là trung tâm điều trị:** Appointment mô tả đặt trước; Visit mô tả một lượt khám thực tế. Visit có PatientId, AppointmentId nullable, PrimaryDoctorId, ClinicRoomId, trạng thái, thời điểm check-in và số thứ tự. Nếu mỗi lịch hẹn chỉ được check-in một lần, đặt unique filtered index cho Visit.AppointmentId.
3. **Bệnh án chuyển sang VisitId:** nếu có dữ liệu cũ, backfill Visit và liên kết trước khi bỏ FK cũ. Không drop bảng để làm lại. Chốt một bệnh án chính cho một Visit, còn kết quả phối hợp nằm trong orders/results.
4. **Sức chứa lịch:** thay IsBooked bằng MaxCapacity và ReservedCount; mọi đặt/đổi/hủy phải cập nhật TimeSlot trong cùng transaction với Appointment. RowVersion chỉ giúp chống tranh chấp nếu slot thực sự bị UPDATE. Đổi lịch khóa/cập nhật cả slot cũ và mới theo thứ tự ổn định; thất bại phải rollback toàn bộ.
5. **Quyền theo ngữ cảnh:** kiểm tra ở Application cho cả đọc, ghi và download file. Không tin PatientId/DoctorId do client gửi để xác định người đang thao tác. Lễ tân dùng DTO riêng không chứa kết luận lâm sàng.
6. **Bệnh án hoàn tất:** khóa sửa thông thường; sửa qua use case bổ sung/hiệu chỉnh có lý do và revision/audit. Bác sĩ thực hiện order không được tự mở lại kết quả đã trả.
7. **Thu hồi tức thời:** thu hồi refresh token chỉ ngăn cấp JWT mới. Muốn chặn access JWT đã cấp ngay, cần kiểm tra session/security version hoặc danh sách thu hồi ở mỗi request thích hợp.
8. **Audit bất biến:** interceptor là điểm ghi nhận, không tự bảo đảm bất biến. Dùng quyền database hạn chế update/delete audit và đường ghi cùng transaction; không đưa mật khẩu, token, khóa mã hóa vào audit JSON. Phân quyền đọc và bảo vệ payload chứa dữ liệu sức khỏe.
9. **RAG gỡ tài liệu:** lọc is_active trong vector index chưa đủ bảo đảm tức thời khi đồng bộ lỗi. Kiểm tra lại trạng thái/phê duyệt/version trong SQL trước khi đưa chunk vào prompt; job đồng bộ có retry và dấu trạng thái.
10. **Phạm vi:** thanh toán/kho thuốc/dược sĩ đầy đủ không phải module lõi trong mô tả 5 vai trò. Giữ ngoài phạm vi đầu tiên; Prescription dùng danh mục thuốc và in đơn.

## 3. Danh mục module và tiêu chí hoàn thành

| ID | Module và công việc | Phụ thuộc | Tiêu chí nghiệm thu chính |
|---|---|---|---|
| M00 | Nền tảng: sửa build, cấu hình môi trường, migration/baseline schema, seed dev, lỗi nghiệp vụ, current user, logging có loại dữ liệu nhạy cảm, CORS, file storage abstraction | — | Clone/setup có hướng dẫn; build và auth suite chạy được; tạo DB thử có thể lặp lại |
| M01 | Tài khoản và phiên: bổ sung Receptionist, quản trị tài khoản, khóa tài khoản, refresh rotation, lưu hash refresh token, logout/revoke, thống nhất email/phone login | M00 | Public register chỉ tạo Patient; reuse refresh bị chặn; role/lock/session được kiểm tra đúng |
| M02 | Hồ sơ bệnh nhân và onboarding: CRUD hồ sơ bản thân, validator, trạng thái hoàn thiện do server tính, hồ sơ walk-in và liên kết User | M01 | Thiếu trường hành chính bắt buộc bị chặn đặt lịch; không đọc/sửa hồ sơ người khác; không bắt bệnh nhân tự đoán nhóm máu |
| M03 | Danh mục và thông tin công khai: Specialty, DoctorProfile, ClinicRoom, MedicalService, Medicine, giờ mở cửa; CRUD admin và read public có cache/invalidation | M01 | Guest chỉ thấy thông tin công khai; cập nhật giá/danh mục làm mới cache; danh mục đang dùng được ngừng hoạt động thay vì xóa gây mất lịch sử |
| M04 | Lịch làm việc và TimeSlot: DoctorSchedule, ngày nghỉ, phòng, sinh slot, công suất, chống chồng lịch bác sĩ/phòng | M03 | Không sinh lịch trùng; không giảm sức chứa dưới số đã đặt; không xóa slot có lịch hẹn |
| M05 | Lịch hẹn: xem giờ trống, đặt hộ/bản thân, xác nhận, đổi, hủy, no-show, idempotency và transaction capacity | M02, M04 | Nhiều yêu cầu cùng tranh chỗ cuối chỉ một thành công; đổi thất bại giữ lịch cũ; hủy không trả chỗ hai lần |
| M06 | Lễ tân, Visit, hàng chờ: check-in lịch hẹn, walk-in, cấp số, phân phòng/bác sĩ, gọi lại/no-show | M02, M03, M05 | Check-in lặp không tạo hai Visit; số thứ tự unique theo phạm vi đã chốt; lễ tân không nhận dữ liệu lâm sàng trong response |
| M07 | Khám chính và EMR: tiếp nhận Visit, sinh tồn/BMI, triệu chứng, tiền sử/dị ứng, chẩn đoán, lời dặn, tái khám, hoàn tất | M06 | Chỉ bác sĩ được phân công sửa; chuyển trạng thái hợp lệ; bệnh án gắn Visit kể cả walk-in |
| M08 | Cận lâm sàng và kết quả: ClinicalOrder, queue theo khoa, atomic claim AssignedDoctorId, kết quả, upload file riêng tư, trả kết quả | M07 | Hai bác sĩ nhận cùng phiếu chỉ một thành công; bác sĩ phối hợp chỉ thấy dữ liệu cần thiết; đủ kết quả mới ResultsReady |
| M09 | Chuyển chuyên khoa: DepartmentReferral, lý do, khoa/bác sĩ nhận, chấp nhận/từ chối/hoàn tất; phân biệt chuyển khám với phiếu xét nghiệm | M07, M08 | Lưu được bác sĩ yêu cầu/tiếp nhận và lịch sử; không làm mất chủ thể chịu trách nhiệm Visit; đề nghị nhập viện chỉ ghi nhận/điều phối ngoài hệ thống |
| M10 | Đơn thuốc: Prescription/PrescriptionItem, thuốc, hàm lượng, liều, đường dùng, tần suất, số ngày/số lượng, cảnh báo dị ứng, in đơn | M03, M07 | Lưu snapshot thông tin thuốc; đơn đã ký không bị thay đổi khi sửa danh mục; bệnh nhân chỉ thấy đơn của mình được công bố |
| M11 | Thông báo: inbox/đọc, SignalR, push mobile, nhắc hẹn, outbox/job retry và chống gửi trùng | M05–M08, M10 | Chỉ đúng người nhận được sự kiện; mất kết nối tải lại trạng thái chuẩn từ API; không mất sự kiện sau commit |
| M12 | Bảo mật và audit: record authorization, masking, interceptor, encryption/key version/rotation, file ACL, audit viewer | Bắt đầu M00–M02; tích hợp mọi module | Test truy cập chéo Patient/Doctor/Receptionist bị từ chối; dữ liệu nhạy cảm không lộ qua log/file; sửa sau hoàn tất có lý do và revision |
| M13 | Kho tri thức: upload PDF/DOCX, nguồn/version, duyệt/từ chối/gỡ, extract/chunk có page/section, index job và retry | M01, M12 | Chỉ tài liệu được duyệt/active được truy xuất; index lặp không nhân đôi; lỗi hiển thị và chạy lại được |
| M14 | Chat AI RAG: conversation/message/citation, retrieval, trả lời dựa nguồn, fallback, công cụ tra slot/giá từ SQL có validation | M03, M04, M13 | Có trích dẫn truy ngược; tài liệu bị gỡ không dùng lại; thiếu nguồn thì fallback; tool không vượt quyền; lịch sử hội thoại tách theo user |
| M15 | Dashboard/admin: quản trị tài khoản/danh mục, quản lý tài liệu, thống kê lịch hẹn/Visit và audit search | M01, M03, M06, M12, M13 | Chốt định nghĩa chỉ số và đối chiếu dữ liệu; không cộng lịch hẹn thành lượt khám |
| M16 | Web portal/PWA: guest, onboarding, patient, receptionist, doctor chính/phối hợp và admin | Bắt đầu M01, mở rộng theo API | Hoàn thành một luồng xuyên suốt; route guard phản ánh quyền server; không cache offline bệnh án trên máy dùng chung |
| M17 | Expo mobile cho Patient: auth/session, onboarding, lịch hẹn, tiến trình Visit, bệnh án/đơn, chat, push | M01, M02, M05, M11, M14 | Dùng cùng API/DTO và quy tắc; refresh khi reconnect; token lưu an toàn; Web/Mobile nhìn cùng dữ liệu |
| M18 | Tích hợp và đóng gói: test end-to-end, migration dry run, backup/restore thử, deploy config, demo dataset, tài liệu | Tất cả module thuộc phạm vi bàn giao | Tái hiện được demo từ DB thử; test cạnh tranh và phân quyền đạt; không có secrets trong repo |

M12 và kiểm thử là công việc xuyên suốt, không đợi hết tính năng mới bổ sung.

## 4. Mô hình dữ liệu đích và vòng đời

### Nhóm thực thể

- Identity: User, Session/RefreshToken; bổ sung trạng thái hoạt động và security version khi áp dụng.
- Người bệnh: PatientProfiles có Id độc lập, PatientCode và UserId nullable; chứa hành chính và sức khỏe nền. Không tạo thêm bảng Patient song song cho cùng danh tính.
- Danh mục: Specialty, ClinicRoom, MedicalService, Medicine, DoctorProfile, DoctorSchedule, TimeSlot.
- Vận hành: Appointment, Visit, ClinicalOrder, ClinicalResult/Attachment, DepartmentReferral.
- Lâm sàng: MedicalRecord, VitalSigns (có thể là nhóm trường của record trong bản đầu), Prescription, PrescriptionItem, amendment/revision.
- AI: KnowledgeDoc, KnowledgeDocVersion hoặc version trên từng bản ghi, KnowledgeChunk, IndexJob, ChatConversation, ChatMessage, ChatCitation.
- Hạ tầng nghiệp vụ: Notification, OutboxMessage, AuditLog.

### Trạng thái đề xuất để chốt thành enum/state machine

- Appointment: Pending → Confirmed → CheckedIn; Pending/Confirmed → Cancelled hoặc NoShow. Không trộn trạng thái điều trị vào Appointment.
- Visit: Waiting → InConsultation → AwaitingSubClinical → ResultsReady → InConsultation → Completed; thêm Cancelled theo quy tắc được chốt. Khi tạo thêm order, tính lại điều kiện đủ kết quả.
- ClinicalOrder: Pending → InProgress → Completed; có Cancelled theo quyền và điều kiện. Chốt cách xử lý order bị hủy khi tính ResultsReady.
- Referral: Requested → Accepted → InProgress → Completed; nhánh Rejected/Cancelled.
- KnowledgeDoc: Draft → PendingApproval → Approved → Indexing → Ready; Failed cho lỗi index; Inactive khi gỡ. Tách approval/active/index state nếu một enum gây tổ hợp trạng thái khó quản lý.

Mọi chuyển trạng thái thực hiện qua use case, kiểm tra phiên bản bản ghi và quyền. Không cung cấp API sửa tùy ý trường Status.

## 5. Các nhóm API dự kiến

Tên dưới đây là hợp đồng đề xuất, chưa tồn tại ngoài ba endpoint auth đã nêu.

- Auth: `/api/auth/refresh`, `/logout`, `/me`; profile `/api/patients/me`.
- Public: `/api/public/specialties`, `/doctors`, `/services`, `/clinic-info`.
- Schedules: `/api/doctor-schedules`, `/api/time-slots`.
- Appointments: `/api/appointments`, `/{id}/reschedule`, `/{id}/cancel`, `/{id}/confirm`.
- Reception: `/api/reception/patients`, `/api/appointments/{id}/check-in`, `/api/visits/walk-in`, `/api/queues`.
- Clinical: `/api/visits/{id}/start`, `/medical-record`, `/complete`, `/clinical-orders`, `/referrals`, `/prescriptions`.
- Orders: `/api/clinical-orders/{id}/claim`, `/result`, `/complete`; files qua endpoint có kiểm tra quyền.
- Patient history: `/api/patients/me/visits`, `/visits/{id}` với DTO dành riêng bệnh nhân.
- AI: `/api/admin/knowledge-docs` và action approve/deactivate/reindex; `/api/chat/conversations`, `/{id}/messages`.
- Operations: `/api/notifications`, `/api/admin/dashboard`, `/api/admin/audit-logs`.

Command nhạy cảm có idempotency, lỗi 409 khi xung đột; list có phân trang; ngày giờ có quy ước UTC lưu trữ và Asia/Ho_Chi_Minh hiển thị. API của bác sĩ lấy người thao tác từ phiên; ID yêu cầu chỉ xác định đối tượng và vẫn phải qua authorization.

## 6. Lộ trình triển khai theo lát cắt dùng được

Ước lượng tham khảo cho một người làm chính, chưa có deadline và chưa kiểm chứng DB thật: khoảng 18–24 tuần gồm tích hợp và dự phòng. Đánh giá lại sau hai tuần đầu; không coi đây là cam kết tiến độ.

| Đợt | Thời lượng | Đầu ra |
|---|---|---|
| 0 | 1–2 tuần | M00; chốt schema Patient/Visit/capacity; ổn định auth hiện có, bổ sung Receptionist và nền tảng quyền/audit |
| 1 | 2–3 tuần | M01–M04; Web auth/onboarding, admin danh mục/lịch; hồ sơ đủ điều kiện và xem giờ trống |
| 2 | 2–3 tuần | M05–M06; Web patient đặt/đổi/hủy và lễ tân check-in/walk-in/hàng chờ |
| 3 | 2–3 tuần | M07, M10; bác sĩ khám, ghi bệnh án, kê đơn; patient xem kết quả đã công bố |
| 4 | 2–3 tuần | M08–M09, mở rộng M11; liên khoa, trả kết quả, gọi lại và hoàn tất |
| 5 | 3–4 tuần | M13–M14; admin duyệt tri thức và chatbot RAG/function calling; bộ câu hỏi đánh giá |
| 6 | 2–3 tuần | M17; mobile tái sử dụng API; M15 và hoàn thiện PWA/realtime |
| 7 | 2–3 tuần | M18; bảo mật, end-to-end, triển khai thử, tài liệu và kịch bản bảo vệ |

M16 được làm từng phần ngay từ đợt 1; không chờ backend hoàn tất. M11 bắt đầu bằng inbox/sự kiện sau đặt lịch rồi mở rộng push. Cộng thời lượng từng đợt cho khoảng 16–24 tuần; nên giữ kế hoạch 18–24 tuần để có khoảng dự phòng tối thiểu.

Nếu cần bàn giao sớm, mốc demo đầu tiên là đợt 3: đăng ký → hoàn thiện hồ sơ → đặt lịch → check-in → khám → đơn thuốc → xem bệnh án. Mốc này chưa đáp ứng đầy đủ đề tài; tiếp tục đợt 4–7 để có liên khoa, RAG và đa nền tảng.

## 7. Kiểm thử bắt buộc theo rủi ro

1. SQL Server thật trong môi trường test: nhiều request tranh slot cuối, đổi/hủy đồng thời, capacity không âm/không vượt giới hạn; không dùng EF InMemory để kết luận RowVersion hoạt động.
2. Check-in và hàng chờ: gửi lặp/retry không tạo Visit hoặc số thứ tự trùng.
3. Quyền dữ liệu: patient A không xem B; bác sĩ ngoài ca bị chặn; bác sĩ nhận order chỉ thấy phạm vi cần thiết; lễ tân không có lâm sàng ngay trong JSON trả về; kiểm tra cả file và realtime group.
4. Liên khoa: nhiều order hoàn thành đồng thời, order hủy, order mới tạo; ResultsReady phản ánh đúng trạng thái và trả về RequestingDoctorId.
5. Bệnh án/đơn thuốc hoàn tất: sửa thường bị chặn, amendment có người thực hiện/lý do/giá trị trước sau, transaction lỗi không để audit và dữ liệu lệch nhau.
6. Phiên: refresh rotation, reuse, logout, khóa/đổi quyền và hiệu lực access token theo thiết kế đã chốt.
7. RAG: câu hỏi có nguồn, không có nguồn, tiếng Việt, yêu cầu chẩn đoán/kê đơn, prompt injection từ tài liệu, tài liệu bị gỡ, truy vấn giá/slot qua công cụ; nguồn/version/page/section khớp nội dung thật.
8. End-to-end: guest, patient web/mobile, receptionist, primary doctor, executing doctor, admin; thêm nhánh walk-in và refresh/reconnect.

## 8. Backlog nên thực hiện ngay

1. Thu log build diagnostic, kiểm tra restore và chạy lại console auth suite; cập nhật AUTH_GUIDE theo source.
2. Xác minh schema SQL thật và dữ liệu cũ; chọn baseline migration hoặc SQL migration có phiên bản. Tránh scaffold `-Force` ghi đè logic domain đang phát triển.
3. Chuyển PatientProfiles sang Id độc lập/UserId nullable, bổ sung Visit và ClinicalOrder; viết migration/backfill có phương án rollback.
4. Bổ sung Receptionist, trạng thái tài khoản, current-user service và kiểm tra quyền nền tảng.
5. Làm API cập nhật hồ sơ và trạng thái hoàn thiện do backend quản lý; kiểm thử trường bắt buộc.
6. Làm danh mục phòng/dịch vụ/bác sĩ/lịch trực và seed dữ liệu demo.
7. Làm booking transaction + SQL concurrency test trước khi phát triển hàng chờ và khám.

## 9. Quy ước tổ chức code

Giữ bốn project hiện có; tổ chức Application theo feature (`Patients`, `Scheduling`, `Appointments`, `Visits`, `ClinicalOrders`, `Prescriptions`, `Knowledge`, `Chat`). Controller mỏng, gọi use case; Infrastructure triển khai persistence/storage/AI/push. Domain chứa quan hệ, enum và quy tắc trạng thái, không phụ thuộc EF/HTTP/SDK bên ngoài. Không cần tách microservices cho phạm vi hiện tại.

Mỗi module bàn giao gồm: schema có phiên bản, use case + DTO/validator, authorization, API có tài liệu, giao diện tương ứng, kiểm thử rủi ro, seed/demo và hướng dẫn chạy. Model AI, kích thước embedding và phiên bản thư viện được kiểm tra lại với tài liệu chính thức khi triển khai; kế hoạch này giữ chúng theo mô tả đầu vào, chưa xác minh khả dụng/giá hiện hành.

## 10. Bổ sung đã chốt: Walk-in, trả kết quả và liên kết tài khoản

### Cùng một cấu trúc lưu trữ

- Lễ tân tìm hồ sơ theo điện thoại/CCCD/BHYT, đối chiếu thông tin trước khi chọn. Điện thoại là tiêu chí tìm kiếm, không phải khóa duy nhất; nếu có nhiều kết quả phải chọn đúng bệnh nhân, không tự gộp lịch sử.
- Khách mới: tạo PatientProfiles với Id riêng, PatientCode duy nhất, UserId = NULL và các trường hành chính cần thiết. Khách cũ: dùng lại Id hiện có.
- Tạo Visit với PatientProfileId, AppointmentId = NULL, PrimaryDoctorId, phòng, thời gian đến và số thứ tự. Khách có hẹn cũng dùng cấu trúc Visit này, chỉ có thêm AppointmentId.
- MedicalRecord gắn VisitId duy nhất: một Visit có tối đa một bệnh án chính, bắt buộc có trước khi hoàn tất. ClinicalOrders là 1-N; Prescriptions và PrescriptionItems lưu đơn có cấu trúc. Không tạo bảng bệnh án riêng cho walk-in.
- ClinicalOrder luôn giữ RequestingDoctorId và AssignedDoctorId. Trả kết quả theo người chỉ định; tổng hợp vào Visit để bác sĩ chính theo dõi. Không mặc định thay RequestingDoctorId bằng PrimaryDoctorId nếu hai người khác nhau.

### Tệp cận lâm sàng

Lưu tệp ở object storage/private server storage; SQL lưu metadata. Đề xuất ClinicalOrderAttachments gồm Id, ClinicalOrderId, StorageKey, OriginalFileName, ContentType, Size, UploadedBy, CreatedAt và trạng thái kiểm tra tệp. Không lưu URL ký sẵn như dữ liệu lâu dài; phát URL có thời hạn ngắn sau khi kiểm tra quyền, hoặc stream qua endpoint được bảo vệ nếu storage nội bộ không hỗ trợ ký URL. Bucket/thư mục không public. Kiểm tra quyền phải bao phủ cả xem trước, tải xuống và in.

### Ba kênh trả kết quả

1. **Bản in bắt buộc cho walk-in:** phiếu khám, kết quả cận lâm sàng và đơn thuốc từ dữ liệu đã ký/công bố. In PatientCode và QR tra cứu. PatientCode dùng định danh, không phải mật khẩu truy cập. QR không chứa thông tin bệnh án hay URL object storage lâu dài.
2. **Tra cứu xác thực:** QR chứa token ngẫu nhiên, có thời hạn, lưu hash phía server và có thể thu hồi; yêu cầu OTP gửi tới thông tin liên hệ đã xác minh. Giới hạn lượt thử/gửi lại và phạm vi từng Visit. SMS/email chỉ thông báo tối thiểu, không đính kèm dữ liệu lâm sàng mặc định.
3. **Liên kết tài khoản:** sau khi xác minh hồ sơ, cập nhật PatientProfiles.UserId; mọi Visit cũ tự xuất hiện qua cùng PatientProfileId, không sao chép bệnh án sang tài khoản mới.

### Điều kiện liên kết tài khoản

OTP chỉ chứng minh người thao tác đang kiểm soát số điện thoại; mã PatientCode chỉ giúp tìm hồ sơ. Không dùng riêng một trong hai để tự động nhận toàn bộ lịch sử. Quy trình tự phục vụ cần thêm bằng chứng gắn với hồ sơ, chẳng hạn mã liên kết bí mật cấp tại quầy kết hợp OTP. Trường hợp số dùng chung, hồ sơ đã liên kết, không khớp danh tính hoặc có nhiều hồ sơ chuyển sang xác minh tại quầy. Không tự gộp các hồ sơ chỉ vì trùng số điện thoại.

Việc claim hồ sơ phải atomic, chỉ thành công khi UserId còn NULL và tài khoản chưa liên kết hồ sơ khác, có thời hạn/chống dùng lại mã và ghi audit. Nếu hệ thống đã tạo hồ sơ rỗng lúc đăng ký, use case liên kết phải xử lý hồ sơ rỗng trong cùng transaction; không bỏ rơi hồ sơ hoặc tự gộp hồ sơ đã có lịch sử. Mô hình phụ huynh quản lý nhiều bệnh nhân là tính năng ủy quyền riêng, không giải quyết bằng cách liên kết tùy ý nhiều hồ sơ theo số điện thoại.

### Quyền in và công bố

Yêu cầu cho lễ tân in kết quả cần được triển khai như quyền xuất bản in có kiểm soát riêng: chỉ tài liệu đã công bố, đúng Visit, có nhật ký người in/thời gian/in lại. Lễ tân không được sửa hoặc duyệt chuyên môn. Quyền in này là ngoại lệ có chủ đích đối với masking: bản in có dữ liệu chuyên môn nên không thể coi thao tác in là không tiếp cận dữ liệu. Nếu không cấp quyền này, bác sĩ/bộ phận được phân quyền trực tiếp in và bàn giao.

### Bổ sung backlog và nghiệm thu

- M02/M06: tìm hồ sơ, chống tạo nhầm/trùng và chuyển khóa PatientProfile có migration bảo toàn FK.
- M08/M12: attachment metadata, private storage, cấp quyền tải có thời hạn, hết hạn/thu hồi và từ chối truy cập chéo.
- M10/M16: mẫu in phiếu khám/kết quả/đơn thuốc, QR và ghi nhận bàn giao walk-in.
- M01/M02: OTP, claim/link có kiểm chứng và giải quyết hồ sơ rỗng đã tạo khi đăng ký.
- M11: SMS/email qua provider và cơ chế retry; theo dõi trạng thái gửi, không coi gửi thông báo thành công là bệnh nhân đã nhận kết quả.
- Nghiệm thu: walk-in chưa có User vẫn hoàn thành toàn bộ luồng khám; liên kết đúng làm hiện lịch sử cũ; trùng điện thoại không tự gắn nhầm; hai tài khoản claim đồng thời chỉ một thành công; PatientCode đơn lẻ không mở bệnh án; lễ tân không in được bản nháp; mọi lần in và claim đều có audit.

Tra cứu OTP/SMS/email và bản in là phần mở rộng phạm vi đã bổ sung sau ước lượng ban đầu. Cần ước lượng lại sau khi chọn provider, mẫu in và chính sách xác minh; chưa cộng ngầm vào mốc 18–24 tuần.
