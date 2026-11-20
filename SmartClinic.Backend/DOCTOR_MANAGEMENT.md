# Quản lý khoa, bác sĩ và lịch khám

## Sử dụng

1. Đăng nhập Admin, vào **Quản lý Khoa** để tạo hoặc tạm ngừng khoa.
2. Tạo tài khoản vai trò Bác sĩ tại **Quản lý Tài khoản & Phân quyền** nếu chưa có.
3. Vào **Quản lý Hồ sơ Bác sĩ**, chọn khoa chính, nhập giới thiệu, học vị, chuyên môn, đào tạo, công tác, chứng chỉ, phí khám và tải ảnh JPEG/PNG/WebP tối đa 5 MB.
4. Bật **Xuất bản công khai** để xuất hiện trong danh sách và bộ lọc theo khoa; bật **Nổi bật trang chủ** để hiện trên trang chủ Web. **Nhận đặt khám** là lựa chọn độc lập.
5. Vào **Phân lịch khám Bác sĩ**, chọn bác sĩ, giờ bắt đầu/kết thúc, phòng và số phút mỗi lượt. Phân ca sáng/chiều bằng hai khoảng giờ. Mỗi khung nhận một bệnh nhân; thời gian theo Việt Nam. Ca tối đa 12 giờ, phải chia hết cho thời lượng mỗi lượt và không trùng lịch cùng bác sĩ.
6. Bệnh nhân trên Web/mobile chọn bác sĩ, ngày và giờ trống. Tài khoản và hồ sơ cá nhân phải hoàn thiện trước khi xác nhận. Lịch hẹn được lưu với trạng thái `Pending`, hiển thị trong **Lịch khám của tôi**.

Khoa ngừng hoạt động, tài khoản bác sĩ bị khóa/xóa hoặc hồ sơ chưa xuất bản sẽ không hiển thị công khai và không nhận đặt lịch. Hồ sơ đã xuất bản nhưng chưa phân ca vẫn hiển thị, với thông báo không có giờ trống. Không hủy được ca có lịch hẹn chưa hủy. Dữ liệu khám cũ và khung giờ cũ được giữ lại; chỉ các khung thuộc ca đang hoạt động do Admin phân mới được mở đặt qua API mới.

Mỗi bác sĩ có một `DoctorProfiles.PrimaryDepartmentId`. Khi lưu hồ sơ, hệ thống đồng bộ `DoctorDepartments`, chỉ giữ liên kết khoa đã chọn ở trạng thái chính/hoạt động; các liên kết cũ được giữ để bảo toàn tham chiếu nghiệp vụ.

## CSDL và kiểm thử

Migration bổ sung, có thể chạy lại: `database/20261119_doctor_management.sql`. Dùng lại bảng `Departments`, `DoctorDepartments`, `DoctorProfiles`, `TimeSlots`, `Appointments`; thêm bảng `DoctorSchedules`. Lịch được lưu theo UTC và hiển thị theo Việt Nam.

Build kiểm thử từ thư mục gốc project:

```powershell
dotnet build SmartClinic.Backend/SmartClinic.API/SmartClinic.API.csproj --no-restore -m:1 -o .tmp-plan/clinic-build
./SmartClinic.Backend/scripts/test-clinic.ps1 -Server DESKTOP-I03QOJG -SourceDatabase SmartClinic
```

Script tạo CSDL tạm chỉ sao chép cấu trúc, dùng tài khoản giả, chạy migration hai lần, kiểm tra phân quyền, hồ sơ công khai/nháp, tải ảnh, trùng ca, tranh chấp đặt lịch đồng thời, dữ liệu riêng từng bệnh nhân và khóa khoa. CSDL tạm và tiến trình API kiểm thử được dọn trong `finally`; không khởi động lại hoặc sửa dữ liệu ứng dụng đang chạy.


## Quản lý chuyên khoa

Trong **Quản lý Khoa**, chọn tab **Chuyên khoa** để tìm kiếm, thêm, sửa, ngừng sử dụng hoặc kích hoạt lại chuyên khoa. Chuyên khoa dùng cho tài khoản bác sĩ; khoa là đơn vị công tác được quản lý tại tab riêng.

Chọn loại hoạt động **Khám bệnh** (`Consultation`) hoặc **Cận lâm sàng** (`ClinicalService`). Nếu đổi loại hoạt động, bác sĩ cần đăng nhập lại để cập nhật giao diện. Tên chuyên khoa không được trùng. Chỉ Admin được gọi API `/api/admin/specialties`.

Chỉ được xóa chuyên khoa chưa gắn hồ sơ bác sĩ. Chuyên khoa đã sử dụng có thể ngừng hoạt động và vẫn giữ liên kết cũ; không thể chọn cho tài khoản mới hoặc chuyển bác sĩ khác sang chuyên khoa đó. Tài khoản bác sĩ đang thuộc chuyên khoa ngừng sử dụng được phép giữ nguyên lựa chọn hiện tại khi lưu quyền.

Chạy `database/20261120_specialty_management.sql` **trước khi chạy backend mới** ở mỗi môi trường. Migration có thể chạy lại và giữ các chuyên khoa hiện có ở trạng thái hoạt động; không tự thêm chuyên khoa mẫu.

Kiểm thử chuyên khoa và hồi quy luồng quản lý khoa/lịch khám trên database tạm:

```powershell
dotnet build SmartClinic.Backend/SmartClinic.API/SmartClinic.API.csproj --no-restore -m:1 -o .tmp-plan/specialty-build
pwsh -NoProfile -File SmartClinic.Backend/scripts/test-specialties.ps1 -Server DESKTOP-I03QOJG -SourceDatabase SmartClinic
```


## Quản lý ca khám

Admin vào **Quản lý Ca khám** để tạo ca, lọc theo ngày/bác sĩ/trạng thái, tìm phòng khám, xem số chỗ còn trống và danh sách bệnh nhân (gồm lịch hẹn đã hủy). Thời gian nhập và hiển thị theo giờ Việt Nam. Mỗi khung nhận một bệnh nhân, mặc định 30 phút; ca tối đa 12 giờ và phải chia hết theo thời lượng mỗi lượt.

Không được trùng thời gian của bác sĩ hoặc cùng phòng khám đang sử dụng. Chỉ sửa ca chưa bắt đầu, chưa hủy và chưa từng có lịch hẹn. Khi sửa, giữ bác sĩ của ca và tạo lại các khung giờ. Ca có lịch sử đặt khám kể cả đã hủy không được sửa để bảo toàn lịch sử. Hủy ca chỉ được thực hiện trước giờ bắt đầu và khi không còn lịch hẹn chưa hủy; lịch sử cũ được giữ nguyên.

API bổ sung: `PUT /api/clinic/admin/schedules/{id}` và `GET /api/clinic/admin/schedules/{id}/appointments`, chỉ dành cho Admin. Danh sách ca bổ sung tổng khung giờ và cờ có lịch sử đặt khám. Không cần migration mới ngoài các migration quản lý khoa và chuyên khoa đã có.

Để giờ trống xuất hiện trên trang bệnh nhân, bác sĩ phải thuộc khoa hoạt động, tài khoản hoạt động, hồ sơ được xuất bản và bật nhận đặt khám.

Kiểm thử trên database tạm:

```powershell
dotnet build SmartClinic.Backend/SmartClinic.API/SmartClinic.API.csproj --no-restore -m:1 -o .tmp-plan/specialty-build
pwsh -NoProfile -File SmartClinic.Backend/scripts/test-schedules.ps1
```


## Xác nhận lịch hẹn thật

Lễ tân hoặc Admin vào **Quản lý & Duyệt lịch hẹn** để xem lịch đặt từ web/mobile, lọc theo ngày, trạng thái, bác sĩ và tìm tên/số điện thoại bệnh nhân. Mặc định hiển thị các lịch chờ xác nhận ở tất cả ngày. Admin cũng có thể vào **Quản lý Ca khám → Bệnh nhân → Xác nhận**.

`GET /api/clinic/staff/appointments` và `PUT /api/clinic/staff/appointments/{id}/confirm` chỉ cho phép vai trò Admin, Receptionist. Xác nhận chuyển Pending thành Confirmed bằng cập nhật có điều kiện, không ghi đè trạng thái khác. Xác nhận lại lịch đã Confirmed không làm thay đổi dữ liệu. Không xác nhận lịch quá giờ kết thúc hoặc thuộc ca đã hủy. Không cần migration mới.

Bệnh nhân xem **Đã xác nhận** sau khi tải lại danh sách; mobile có kéo xuống làm mới và tự tải lại khi ứng dụng trở lại foreground, web tải lại khi cửa sổ được focus. Chưa có push notification hoặc cập nhật thời gian thực. Màn hình điều phối gọi số dùng dữ liệu mẫu vẫn chỉ nằm trong chế độ demo; tiếp nhận thật được bổ sung theo mục bên dưới.

Kiểm thử: build API vào `.tmp-plan/specialty-build`, chạy `pwsh -NoProfile -File SmartClinic.Backend/scripts/test-appointment-confirmation.ps1` trên database tạm. Bộ kiểm thử gồm phân quyền, xác nhận của cả hai vai trò, bộ lọc, lịch hết giờ/đã hủy, trạng thái bệnh nhân và hồi quy đặt lịch/phân ca.


## Tiếp nhận tại quầy

Lễ tân có ba mục dùng dữ liệu thật: **Quản lý & Duyệt lịch hẹn**, **Tiếp nhận & Check-in**, **Khách đến trực tiếp**. Admin cũng có thể dùng các tab tương ứng trong màn hình duyệt lịch. Hộp thoại xác nhận trong màn hình duyệt và danh sách bệnh nhân theo ca đã thay popup trình duyệt.

Check-in chuyển Pending hoặc Confirmed thành CheckedIn, chỉ áp dụng cho lịch hôm nay theo giờ Việt Nam chưa hết giờ kết thúc và thuộc ca đang hoạt động. Thao tác lặp lại không tạo lịch trùng. Danh sách trạng thái Đã tiếp nhận dùng để xem bệnh nhân đã đến; chưa có cấp số thứ tự hoặc gọi bệnh nhân tự động.

Bệnh nhân đến trực tiếp: tìm hồ sơ theo tên/số điện thoại, chọn đúng người; hoặc nhập họ tên, số điện thoại, ngày sinh và giới tính để tạo hồ sơ mới. Chọn bác sĩ và khung giờ còn trống hôm nay; lưu tạo lịch CheckedIn và chiếm cùng chỗ đặt với web/mobile. Không vượt sức chứa hoặc tự thêm khung giờ ngoài ca. Hồ sơ mới tại quầy có tài khoản kỹ thuật bị vô hiệu hóa đăng nhập, không cấp mật khẩu cho bệnh nhân. Việc liên kết/cấp quyền đăng nhập sau này cần luồng riêng.

API chỉ cho Admin và Receptionist: `PUT /api/clinic/staff/appointments/{id}/check-in`, `GET /api/clinic/staff/patients?search=...`, `GET /api/clinic/staff/walk-in/slots`, `POST /api/clinic/staff/walk-in`. Chưa cần migration mới. Kiểm thử `scripts/test-reception.ps1` trên database tạm.


## Bệnh nhân đổi và hủy lịch

Web: **Lịch khám của tôi** ở đầu trang khi đăng nhập bệnh nhân. Mobile: **Lịch & EMR**. Thẻ lịch Pending hoặc Confirmed chưa đến giờ khám có nút **Đổi lịch**, **Hủy lịch**, kèm hộp xác nhận.

Đổi lịch chọn ngày và giờ khác của cùng bác sĩ. Lịch mới cần xác nhận lại. Giữ lịch cũ trong lịch sử với trạng thái Cancelled, tạo lịch mới Pending và giữ lý do khám. Nếu giờ mới bị chiếm hoặc không còn hợp lệ, toàn bộ thao tác được rollback, lịch cũ giữ nguyên. Hủy trả chỗ về danh sách giờ trống; không xóa lịch sử. Không đổi/hủy lịch đã đến giờ, đã check-in hoặc các trạng thái điều trị khác.

API PatientOnly: `PUT /api/clinic/appointments/{id}/cancel`, `PUT /api/clinic/appointments/{id}/reschedule` với body `{ "timeSlotId": "..." }`. Kiểm tra quyền sở hữu, trùng giờ bệnh nhân và khóa cùng dữ liệu với luồng đặt lịch/check-in. Không cần migration mới. Kiểm thử `scripts/test-patient-appointment-changes.ps1` trên database tạm.
