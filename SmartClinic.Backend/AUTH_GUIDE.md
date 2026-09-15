# Auth trong SmartClinic

## Phạm vi đã triển khai
- Đăng ký Patient: email chuẩn hóa, mật khẩu 15–128 ký tự, xác nhận mật khẩu,
  hash bằng PasswordHasher, lưu User và PatientProfile bằng một SaveChanges.
- Đăng nhập: thông báo chung khi sai email/mật khẩu, nâng cấp hash khi cần,
  cấp JWT có sub/email/role/jti, mặc định hết hạn sau 15 phút.
- GET /api/auth/me: lấy ID từ token đã được xác thực rồi đọc tài khoản hiện tại.
- Policy AdminOnly, DoctorOnly, PatientOnly; giới hạn tổng register/login 10 request/IP/phút.
- Chưa có refresh/logout phía server, xác minh email, quên mật khẩu hay API tạo bác sĩ/admin.
  Entity RefreshToken hiện tại chưa được sử dụng. Khi access token hết hạn, đăng nhập lại.
  Xóa token ở client không thu hồi token; thay role cũng không vô hiệu token đã cấp.
  Quyền trên từng lịch hẹn/hồ sơ phải được kiểm tra trong các use case tương ứng.

## Đọc code theo thứ tự
1. Application/Auth/RegisterRequest.cs: dữ liệu client gửi, không có Role.
2. Application/Auth/IAuthService.cs: các chức năng controller được gọi.
3. Application/Auth/AuthService.cs: toàn bộ luồng nghiệp vụ.
4. Application/Abstractions: hợp đồng cho database, mật khẩu và token.
5. Infrastructure/Repositories/UserRepository.cs và Data/UnitOfWork.cs: EF Core.
6. Infrastructure/Security: password hash và JWT.
7. SmartClinic.Backend/Controllers/AuthController.cs: đổi kết quả nghiệp vụ thành HTTP.
8. SmartClinic.Backend/Program.cs: DI, JWT bearer, role policy, Swagger và rate limit.

Application không tham chiếu Infrastructure hoặc ASP.NET Core.
Backend là composition root: nơi nối interface với implementation.

## 1. Cấu hình trước khi chạy
Project đã có tên SmartClinic.API.csproj; thư mục vật lý vẫn là SmartClinic.Backend.
Chạy PowerShell từ thư mục chứa file hướng dẫn này:

```powershell
$apiProject = '.\SmartClinic.Backend\SmartClinic.API.csproj'
$jwtSecret = [Convert]::ToBase64String([Security.Cryptography.RandomNumberGenerator]::GetBytes(48))
dotnet user-secrets set 'Jwt:SigningKey' $jwtSecret --project $apiProject
dotnet user-secrets set 'Jwt:Issuer' 'SmartClinic' --project $apiProject
dotnet user-secrets set 'Jwt:Audience' 'SmartClinic.Client' --project $apiProject
dotnet user-secrets set 'Jwt:AccessTokenMinutes' '15' --project $apiProject
dotnet run --project $apiProject --launch-profile https
```

User Secrets chỉ được tự nạp ở môi trường Development. Khi triển khai dùng biến môi trường
Jwt__SigningKey, Jwt__Issuer, Jwt__Audience, Jwt__AccessTokenMinutes.
Không dùng khóa ví dụ hoặc commit khóa vào source.
Ứng dụng cố ý dừng ngay khi thiếu/không hợp lệ cấu hình JWT.

Kiểm tra ConnectionStrings:DefaultConnection trong cấu hình ứng dụng hoặc User Secrets trỏ đúng
SQL Server và database đã tồn tại. Không có migration/schema change hoặc seed tài khoản được chạy tự động.
ApplicationDbContext đã bỏ OnConfiguring hardcode để dùng kết nối từ DI.

## 2. Thử bằng Swagger
Mở URL HTTPS ứng dụng in ra, thêm /swagger.
POST /api/auth/register:

```json
{
  "email": "patient@example.com",
  "password": "a-long-example-password",
  "confirmPassword": "a-long-example-password",
  "phoneNumber": "0912345678"
}
```

Kỳ vọng 201, role Patient. Gửi lại nhận 409; xác nhận sai nhận 400.
POST /api/auth/login:

```json
{
  "email": "patient@example.com",
  "password": "a-long-example-password"
}
```

Copy accessToken trong response, bấm Authorize của Swagger và dán token
(không thêm chữ Bearer vào ô này). Sau đó gọi GET /api/auth/me: kỳ vọng 200.
Không có token hoặc token hết hạn: 401. Sai mật khẩu: 401.
Sau quá nhiều lần thử trong một phút: 429.

Nếu gọi bằng HTTP client khác, header là:
Authorization: Bearer <accessToken>

## 3. Sử dụng phân quyền
Trên controller/action quản trị, thêm:
```csharp
[Authorize(Policy = "AdminOnly")]
```
Hoặc:
```csharp
[Authorize(Roles = UserRole.Doctor)]
```
Thêm using Microsoft.AspNetCore.Authorization và SmartClinic.Domain.Constants nếu dùng UserRole.
Người đã đăng nhập nhưng sai role nhận 403. Public register luôn tạo Patient.
Admin/Doctor phải được cấp bằng quy trình quản trị tin cậy; chưa có endpoint đổi role công khai.

Role không thay thế kiểm tra quyền trên dữ liệu: bệnh nhân chỉ được đọc lịch của chính họ,
bác sĩ chỉ được đọc dữ liệu trong phạm vi công việc đã được cho phép.

## 4. Kiểm tra tự động
```powershell
dotnet build .\SmartClinic.Backend.slnx
dotnet run --project .\SmartClinic.Auth.Tests\SmartClinic.Auth.Tests.csproj
```

Tests là console regression suite, chạy bằng dotnet run (không phải dotnet test).
Dùng repository giả để không ghi tài khoản vào SQL Server thật; kiểm tra password hash và JWT thật.
Chưa xác minh transaction, unique constraint, collation và HTTP qua SQL Server thật.

## Các điểm cần biết với database hiện tại
- Email mới được trim và lowercase theo chính sách tài khoản của ứng dụng.
  Nếu có dữ liệu cũ, kiểm tra chuẩn hóa và trùng email trước khi vận hành.
- Lỗi duplicate được nhận diện theo unique index email hiện có:
  UQ__Users__A9D10534AE710E00. Nếu đổi tên constraint, cập nhật UnitOfWork tương ứng.
- Không tự ý hash lại dữ liệu mật khẩu không rõ định dạng. Tài khoản cũ phải có hash tương thích
  hoặc được reset qua quy trình riêng.
- Role lưu trong database cần đúng Patient, Doctor hoặc Admin.
- Rate limit hiện theo IP của kết nối và trong bộ nhớ một instance. Khi chạy qua reverse proxy
  cần cấu hình forwarded headers với proxy tin cậy; nhiều instance cần chiến lược giới hạn chung.

## Nếu đổi cả tên thư mục web thành SmartClinic.API
Dừng ứng dụng/Visual Studio trước khi đổi thư mục. Cập nhật đường dẫn project trong .slnx từ
SmartClinic.Backend/SmartClinic.API.csproj thành SmartClinic.API/SmartClinic.API.csproj,
và cập nhật các lệnh bên trên. Tên namespace controller đã là SmartClinic.API.Controllers.

## Tài liệu đối chiếu
- https://learn.microsoft.com/en-us/aspnet/core/security/authentication/configure-jwt-bearer-authentication
- https://learn.microsoft.com/en-us/aspnet/core/performance/rate-limit


## Cập nhật đăng ký có số điện thoại
RegisterRequest hiện yêu cầu PhoneNumber. Số điện thoại được trim hai đầu, gồm 9–15 chữ số ASCII,
có thể có dấu + ở đầu; không nhận dấu cách bên trong, dấu chấm hoặc dấu gạch ngang.
Đây là kiểm tra cú pháp, chưa xác minh quyền sở hữu bằng OTP. Đăng nhập vẫn dùng email/password.
Không áp đặt số điện thoại duy nhất vì tài khoản bệnh nhân nhi có thể dùng số phụ huynh.
Entity User.PhoneNumber đã đồng bộ non-nullable với kết quả scaffold mới.

Lệnh scaffold cho cấu trúc hiện tại (Package Manager Console):
```powershell
Scaffold-DbContext "Name=ConnectionStrings:DefaultConnection" Microsoft.EntityFrameworkCore.SqlServer -Project SmartClinic.Infrastructure -StartupProject SmartClinic.API -OutputDir "..\SmartClinic.Domain\Entities" -ContextDir Data -Context ApplicationDbContext -Namespace SmartClinic.Domain.Entities -ContextNamespace SmartClinic.Infrastructure.Data -NoOnConfiguring -Force
```
Sao lưu/commit trước khi scaffold với -Force. Entity nằm trong Domain; DbContext ở Infrastructure/Data.
Kết quả scaffold hiện dùng tên IdentityCard (không phải CitizenId). Mapping PhoneNumber/IdentityCard
hiện không có IsUnicode(false), nên chưa thể kết luận database đang là VARCHAR như thiết kế ban đầu;
kiểm tra kiểu cột SQL nếu cần, không tự sửa mapping trái với schema thực tế.