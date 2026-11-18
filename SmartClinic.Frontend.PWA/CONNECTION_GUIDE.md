# Kết nối PWA với API — 02/11/2026

## Trước khi chạy

1. Trong SQL Server, chọn đúng database SmartClinic và áp dụng thủ công:
   `SmartClinic.Backend/database/20261102_patient_profile_measurements.sql`.
   Script chỉ thêm HeightCm/WeightKg nullable vào dbo.PatientProfiles, có thể chạy lại.
   Không tự chạy migration hay thay khóa UserId trong đợt này. API cần hai cột trước khi đọc hồ sơ.
2. Giữ ConnectionStrings:DefaultConnection và Jwt đã cấu hình phía API. Không đưa chúng vào frontend.
3. Frontend `.env.local`: `VITE_API_URL=https://localhost:7295/api`.
   Thay đổi env cần restart Vite. CORS hiện cho phép đúng `http://localhost:3000`.

Từ thư mục gốc, terminal backend:

```powershell
dotnet dev-certs https --trust
dotnet run --project .\SmartClinic.Backend\SmartClinic.API\SmartClinic.API.csproj --launch-profile https
```

Terminal frontend:

```powershell
cd E:\DATN\SmartClinicProject\SmartClinic.Frontend.PWA
npm run dev
```

## Luồng đã nối

- Bắt đầu Guest; đăng ký email, phone, password, confirmPassword.
- Đăng ký thành công quay về đăng nhập, không tự cấp phiên.
- Đăng nhập bằng email/password; token lưu sessionStorage của tab, không có refresh giả.
- Tải lại trang gọi GET /api/auth/me, sau đó GET /api/patients/me cho Patient.
- PUT /api/patients/me lưu hồ sơ; userId lấy từ JWT, không nhận ID/role/completion flag từ form.
- Bắt buộc họ tên, điện thoại, ngày sinh, giới tính, địa chỉ và CCCD hoặc BHYT.
- Chiều cao/cân nặng tùy chọn, tối đa hai chữ số thập phân; giới hạn số theo kiểu decimal(6,2), không phải tiêu chí đánh giá sức khỏe.
- Nhóm máu/dị ứng/bệnh nền tùy chọn. CCCD/BHYT là thông tin khai báo; chưa có xác minh giấy tờ, OTP hay account linking.
- Email không được đổi bằng API hồ sơ. Trạng thái hoàn thiện tính tại server, không đồng nghĩa xác minh danh tính.
- Logout xóa token trong tab; backend chưa có thu hồi JWT/refresh API.
- Lỗi mạng giữ token để thử lại; 401 trên request có token xóa phiên và yêu cầu đăng nhập.

## Chế độ demo

Nút trên đầu trang chuyển qua lại thật/demo, có nhãn rõ. Demo không gọi API auth/hồ sơ.
Phiên thật giữ trong tab và được xác thực lại khi thoát demo. Vai trò/ID demo không thay đổi tài khoản server.
Đặt lịch, lịch sử khám, chat và các workspace chỉ tương tác trong demo; ở chế độ thật hiển thị chưa kết nối.
Doctor từ server được giữ đúng là Doctor, không suy đoán bác sĩ khám chính/cận lâm sàng.
Admin workspace cũng chỉ có dữ liệu demo; không có API quản trị thật trong đợt này.
Danh mục, bác sĩ, giá và bài viết công khai vẫn là dữ liệu mẫu, được nêu trên thanh chế độ.
PWA chưa cấu hình runtime cache API hồ sơ; không thêm cache dữ liệu y tế.

## Quản lý bài viết

Đăng nhập với vai trò Admin, vào **Quản lý Tin tức & Bài báo** và tạo bản nháp. Sau khi lưu,
có thể tải ảnh bìa JPEG, PNG hoặc WebP tối đa 5 MB. Bài cần có tóm tắt và nội dung trước khi
xuất bản. Mục **Tin tức hoạt động** trên trang chủ ưu tiên bài được ghim và cho phép xem toàn bộ
bài đã xuất bản. Mỗi lần mở chi tiết công khai được tính một lượt xem.

Chức năng dùng các bảng và cột từ `20261103_article_management.sql` và
`20261109_admin_basics.sql`. API lưu ảnh trong thư mục `article-uploads` tại content root.
Khi triển khai, có thể đặt `ArticleMedia__Directory` trỏ tới thư mục lưu trữ bền vững có quyền
ghi cho API. Sao lưu thư mục này cùng database để giữ ảnh bìa.

## Kiểm tra

```powershell
# Trong frontend
npm run lint
npm run build
npm run test:auth
# Từ thư mục gốc
dotnet build .\SmartClinic.Backend\SmartClinic.API\SmartClinic.API.csproj --no-restore -m:1 /p:BuildInParallel=false
dotnet run --project .\SmartClinic.Backend\SmartClinic.Auth.Tests\SmartClinic.Auth.Tests.csproj --no-restore --no-launch-profile -p:BuildInParallel=false
```

Backend regression dùng fake repository; frontend regression dùng Axios adapter giả.
Các kiểm tra này không thay thế test SQL thật. Sau khi áp dụng script, thử đăng ký → đăng nhập → lưu hồ sơ → tải lại trang → logout/login và kiểm tra dữ liệu giữ nguyên.
Kiểm tra thêm: thiếu cả CCCD/BHYT bị chặn, ngày sinh tương lai bị chặn, chiều cao/cân nặng trống vẫn lưu được, demo không thay đổi hồ sơ thật.

Kết quả trong môi trường Codex: build API, 43 kiểm tra backend, TypeScript, build PWA và regression frontend đều đạt. Build PWA còn cảnh báo bundle lớn hơn 500 kB. Chưa xác nhận HTTP/CORS thực tế: môi trường sandbox chặn socket localhost khi gọi thử API. Không thay cấu hình hệ thống để vượt hạn chế này; cần kiểm tra lại bằng trình duyệt trên máy bạn sau khi áp dụng SQL.
