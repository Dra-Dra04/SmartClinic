# SmartClinic – hồ sơ cá nhân và kiến trúc

## Trạng thái hồ sơ cá nhân

Luồng hồ sơ bệnh nhân hiện đã có:

```text
JWT (sub = User.Id)
        ↓
PatientProfileController
        ↓
PatientProfileService
        ↓
IUserRepository.FindByIdAsync (User + PatientProfile)
        ↓
User.PhoneNumber + PatientProfile
        ↓
UnitOfWork.SaveChangesAsync
```

Endpoint:

```text
GET  /api/patients/me
PUT  /api/patients/me
```

Endpoint yêu cầu policy `PatientOnly`, nên chỉ bệnh nhân được xem/sửa hồ sơ của chính mình. ID tài khoản lấy từ claim `sub`, không lấy từ request.

Các trường được nhận bởi `PUT /api/patients/me`:

| Dữ liệu giao diện | Nơi lưu |
|---|---|
| Họ và tên | `PatientProfile.FullName` |
| Số điện thoại | `User.PhoneNumber` |
| Email | `User.Email`, chỉ đọc trong response |
| Ngày sinh | `PatientProfile.Dob` |
| Giới tính | `PatientProfile.Gender` |
| CCCD/CMND | `PatientProfile.IdentityCard` |
| Mã BHYT | `PatientProfile.HealthInsuranceNumber` |
| Địa chỉ | `PatientProfile.Address` |
| Chiều cao | `PatientProfile.HeightCm` |
| Cân nặng | `PatientProfile.WeightKg` |
| Nhóm máu | `PatientProfile.BloodType` |
| Dị ứng/thuốc đang dùng | `PatientProfile.Allergies` |
| Bệnh nền/tiền sử | `PatientProfile.BackgroundDisease` |
| Ảnh đại diện | `PatientProfile.AvatarUrl` (cột/entity đã có; upload ảnh cần endpoint lưu file riêng) |

Hồ sơ được coi là hoàn tất khi có họ tên, điện thoại, ngày sinh, giới tính, địa chỉ và ít nhất một trong CCCD/BHYT.

## Đánh giá Clean Architecture

Project đang đi đúng hướng Clean Architecture theo kiểu monolith:

```text
SmartClinic.API
  Controllers, Program.cs, middleware, JWT bearer, DI, Swagger
        ↓
SmartClinic.Infrastructure
  EF Core DbContext, repositories, password hashing, JWT creation
        ↓
SmartClinic.Application
  AuthService, PatientProfileService, DTOs, interfaces
        ↓
SmartClinic.Domain
  Entities, role constants, business objects
```

`API` là composition root nên tham chiếu `Application` và `Infrastructure`. `Application` chỉ tham chiếu `Domain`; Infrastructure triển khai các interface do Application định nghĩa. Chiều phụ thuộc này phù hợp với Clean Architecture.

## Cây file và ý nghĩa

```text
SmartClinicProject/
├── ARCHITECTURE.md                         # Tài liệu này
└── SmartClinic.Backend/
    ├── SmartClinic.Domain/
    │   ├── Entities/
    │   │   ├── User.cs                     # Tài khoản, role, email, điện thoại
    │   │   ├── PatientProfile.cs           # Hồ sơ sức khỏe và thông tin cá nhân
    │   │   ├── DoctorProfile.cs            # Hồ sơ bác sĩ
    │   │   ├── Specialty.cs                # Chuyên khoa
    │   │   ├── TimeSlot.cs                 # Khung giờ khám
    │   │   ├── Appointment.cs              # Lịch hẹn
    │   │   ├── MedicalRecord.cs            # Chẩn đoán, ghi chú, đơn thuốc
    │   │   ├── Notification.cs             # Thông báo
    │   │   ├── RefreshToken.cs             # Mô hình refresh token
    │   │   └── KnowledgeDoc.cs             # Tài liệu kiến thức cho RAG
    │   ├── Constants/UserRole.cs           # Patient, Doctor, Admin
    │   └── SmartClinic.Domain.csproj
    ├── SmartClinic.Application/
    │   ├── Abstractions/                   # Interface để đảo ngược phụ thuộc
    │   ├── Auth/                           # Use case đăng ký, đăng nhập, /me
    │   ├── Patients/PatientProfileService.cs # Use case hồ sơ bệnh nhân
    │   └── SmartClinic.Application.csproj
    ├── SmartClinic.Infrastructure/
    │   ├── Data/ApplicationDbContext.cs     # DbSet và mapping SQL Server
    │   ├── Data/UnitOfWork.cs               # SaveChanges và lỗi unique email
    │   ├── Repositories/UserRepository.cs  # EF Core repository
    │   ├── Security/PasswordService.cs     # PasswordHasher<User>
    │   ├── Security/JwtOptions.cs           # Cấu hình JWT
    │   ├── Security/JwtTokenService.cs     # Tạo và ký JWT
    │   └── SmartClinic.Infrastructure.csproj
    ├── SmartClinic.API/
    │   ├── Controllers/AuthController.cs    # Register, login, /me
    │   ├── Controllers/PatientProfileController.cs # Hồ sơ bệnh nhân
    │   ├── Controllers/*Articles*.cs       # Nội dung bài viết
    │   ├── Controllers/AdminAccountsController.cs # Quản trị tài khoản
    │   ├── Program.cs                      # DI, JWT, policy, middleware
    │   ├── appsettings*.json               # Cấu hình không bí mật
    │   └── SmartClinic.API.csproj
    ├── SmartClinic.Auth.Tests/             # Regression checks cho Auth
    ├── SmartClinic.DevAccounts/            # Công cụ/tài khoản phát triển
    └── database/                           # Script hoặc tài liệu database
```

## Các điểm còn thiếu

- Chưa có API upload ảnh an toàn để cập nhật `AvatarUrl`.
- Chưa có endpoint riêng cho bác sĩ đọc profile bệnh nhân theo lịch hẹn.
- `RefreshToken` mới là entity; cần thêm rotation và revoke.
- Xác thực email, quên mật khẩu và xác minh OTP chưa hoàn thiện.
- Có thể tách các record trong `LoginRequest.cs` thành các file DTO riêng khi module lớn hơn.
