# SmartClinic.Frontend.PWA - Hướng dẫn Frontend

## 1. Tổng quan

Dự án này là giao diện frontend của hệ thống SmartClinic, xây dựng bằng React + Vite + TypeScript + Tailwind CSS. Nó hỗ trợ:

- Giao diện bệnh nhân / portal khám bệnh
- Quản lý đặt lịch khám
- Bảng điều khiển cho lễ tân, bác sĩ, quản trị viên
- Trợ lý AI y tế / chat widget
- Chế độ PWA (cài đặt trên màn hình, offline indicator, fast install)

Frontend này chạy độc lập và có thể được mở trên trình duyệt ở cổng 3000.

---

## 2. Cấu trúc thư mục chính

```text
SmartClinic.Frontend.PWA/
├── public/                       # Tài nguyên công khai, icon PWA, hình ảnh
├── scripts/                      # Script hỗ trợ như tạo icon PWA
├── src/                          # Mã nguồn chính của frontend
│   ├── components/              # Tất cả UI component theo chức năng
│   ├── hooks/                    # Custom hooks
│   ├── services/                 # Kết nối API / mock service
│   ├── store/                    # State management bằng Zustand
│   ├── types/                    # Type definitions
│   ├── App.tsx                   # Root component điều hướng màn hình
│   ├── index.css                 # CSS chung và style Tailwind
│   ├── main.tsx                  # Entry point render app
│   └── ...
├── .env.local                    # Biến môi trường local (nếu cần)
├── index.html                    # File HTML gốc của Vite
├── package.json                  # Dependency và scripts
├── vite.config.ts                # Cấu hình Vite, React, Tailwind, PWA
├── tsconfig.json                 # Cấu hình TypeScript
├── README.md                     # Tài liệu mặc định từ project template
├── FRONTEND_GUIDE.md             # Tài liệu hướng dẫn frontend này
└── ...
```

---

## 3. Công nghệ xây dựng phần frontend

Dự án SmartClinic.Frontend.PWA được xây dựng trên nền tảng hiện đại, tập trung vào trải nghiệm người dùng nhanh, dễ mở rộng và thân thiện với ứng dụng web trên điện thoại.

### 3.1 React + TypeScript
- React là thư viện chính để xây dựng giao diện người dùng theo component.
- TypeScript giúp tăng độ an toàn cho code, giảm lỗi khi làm việc với props, state và dữ liệu mock/API.
- Mỗi phần như portal bệnh nhân, đợt chat AI, workspace bác sĩ đều được tách thành component riêng.

### 3.2 Vite
- Vite được dùng làm build tool và dev server.
- Tốc độ dev nhanh hơn nhiều so với Webpack truyền thống.
- Hỗ trợ hot reload và tối ưu build production.

### 3.3 Tailwind CSS
- Tailwind giúp xây dựng giao diện nhanh nhờ utility classes như `flex`, `bg-*`, `text-*`, `rounded-*`, `shadow-*`.
- Dễ chỉnh layout, màu sắc, spacing, typography, responsive.
- Tập trung vào UI clean, consistent và nhanh triển khai.

### 3.4 Zustand
- Zustand được dùng để quản lý state toàn ứng dụng.
- Phù hợp với project này vì có các state như:
  - vai trò người dùng (`guest`, `patient`, `doctor`, `admin`)
  - trạng thái portal navigation
  - trạng thái chat AI
- Giúp tránh việc truyền props quá nhiều giữa các component.

### 3.5 Axios
- Sử dụng để gọi API backend khi hệ thống đã có server thật.
- File `src/services/axiosClient.ts` đóng vai trò như layer trung gian cho các request HTTP.

### 3.6 PWA (Progressive Web App)
- Dự án dùng `vite-plugin-pwa` để tạo:
  - manifest cho app có thể cài đặt
  - service worker cho cache / offline
  - giao diện app có thể dùng như native app trên màn hình chính điện thoại
- Đây là điểm mạnh của frontend vì người dùng có thể cài đặt như app mobile ngay trên browser.

### 3.7 Lucide React
- Dùng cho icon của menu, hotline, badge, chatbot, workflow khám bệnh.
- Giúp giao diện dễ nhìn và chuyên nghiệp hơn.

### 3.8 Mock Data + Data Model
- Dữ liệu bệnh viện, bác sĩ, chuyên khoa, dịch vụ được mô phỏng trong `src/services/mockData.ts`.
- Kiểu dữ liệu nằm trong `src/types/index.ts` để tăng tính đồng nhất và kiểm tra dữ liệu.

### 3.9 Tổ chức UI theo role-based layout
- App không chỉ là một trang đơn; nó chia theo vai trò:
  - portal bệnh nhân
  - doctor workspace
  - receptionist desk
  - admin dashboard
- Giúp frontend mô phỏng đúng luồng chức năng của một bệnh viện hiện đại.

---

## 4. Giải thích tác dụng từng file / thư mục

### 3.1 File gốc

#### package.json
- Chứa danh sách dependency cần thiết.
- Có các script chính:
  - `npm install`: cài đặt whole project
  - `npm run dev`: chạy app ở môi trường phát triển
  - `npm run build`: build production bundle
  - `npm run preview`: xem bản build đã tạo
  - `npm run lint`: kiểm tra TypeScript

#### vite.config.ts
- Cấu hình Vite cho React.
- Bật plugin React và Tailwind.
- Cấu hình PWA với `vite-plugin-pwa`:
  - `manifest` cho ứng dụng installable
  - `theme_color`, `display`, `icons`, `start_url`
  - `registerType: 'autoUpdate'`
- Cấu hình localhost port 3000 và host 0.0.0.0 để chạy được trên máy ảo hoặc container.

#### tsconfig.json
- Thiết lập compiler options cho TypeScript.
- Giúp project hiểu đúng JSX, module, type checking.

#### index.html
- File HTML gốc để Vite mount app vào thẻ `#root`.
- Cũng chứa metadata bootstrapping cho app web/PWA.

---

### 3.2 Thư mục public và script hỗ trợ

#### public/
- Chứa tài nguyên công khai như icon / ảnh / favicon.
- Dùng cho PWA: icon 192x192, 512x512, maskable, apple-touch-icon, ...
- Được phục vụ trực tiếp bởi Vite mà không cần build qua bundler.

#### scripts/generate-icons.mjs
- Script tạo icon PWA cho app.
- Hữu ích khi cần sinh lại icon kích thước khác nhau từ một file nguồn.

---

### 3.3 Thư mục src/

#### src/main.tsx
- Là entry point của React app.
- Render `<App />` vào root DOM.
- Import file CSS chính `index.css`.

#### src/App.tsx
- Là component root của ứng dụng.
- Quyết định layout hiện thị theo vai trò người dùng:
  - `guest` / `patient` → Portal layout
  - `receptionist` / `doctor_*` / `admin` → Workspace layout
- Quản lý điều hướng của portal, auth modal, onboarding guard, booking wizard.
- Đây là file quan trọng nhất để hiểu luồng nghiệp vụ chính.

#### src/index.css
- Chứa CSS global và style tích hợp Tailwind.
- Thiết lập nền, typography, spacing, animation, theme chung.

---

### 3.4 Thư mục store/

#### src/store/useAuthStore.ts
- State quản lý authentication / role hiện tại của người dùng.
- Dùng để chuyển đổi giữa các vai trò demo: guest, patient, receptionist, doctor, admin.

#### src/store/useClinicStore.ts
- State quản lý thông tin bệnh viện / portal navigation.
- Ví dụ: `currentPortalNav`, page hiện tại trong portal, dữ liệu khám bệnh, booking state.

#### src/store/useChatStore.ts
- State cho chat AI / widget hội thoại.
- Có thể lưu lịch sử hội thoại và trạng thái chat.

---

### 3.5 Thư mục services/

#### src/services/axiosClient.ts
- Khởi tạo client HTTP dựa trên axios.
- Có thể dùng để gọi API backend nếu project nối với server thực tế.
- Dùng để cấu hình baseURL, interceptors, token auth.

#### src/services/mockData.ts
- Chứa dữ liệu mẫu như:
  - chuyên khoa
  - bác sĩ
  - dịch vụ
  - giá khám
- Dùng để mock UI khi chưa có API thật.

---

### 3.6 Thư mục types/

#### src/types/index.ts
- Định nghĩa type như `Doctor`, `Specialty`, `Patient`, `Booking`, ...
- Giúp TypeScript kiểm tra dữ liệu chặt chẽ hơn.

---

### 3.7 Thư mục hooks/

#### src/hooks/usePWAInstall.ts
- Hook giúp app nhận biết khả năng cài đặt PWA.
- Mở ra các phương thức install cho trình duyệt hỗ trợ.
- Dùng trong thành phần `PWAInstallButton` nếu cần hiện nút “Cài đặt app”.

---

### 3.8 Thư mục components/

#### components/common/
- Chứa component dùng chung:
  - `OfflineIndicator.tsx`: hiển thị trạng thái online/offline
  - `PWAInstallButton.tsx`: nút cài đặt app PWA

#### components/layout/
- Chứa layout tổng thể:
  - `PortalLayout.tsx`: giao diện bệnh nhân / portal
  - `WorkspaceLayout.tsx`: giao diện nhân sự / bác sĩ / admin
  - `DemoRoleSwitcherBar.tsx`: nút chuyển đổi vai trò demo
  - `Footer.tsx`: footer của portal

#### components/modals/
- Chứa modal popup:
  - `BookingModal.tsx`: modal đặt lịch
  - `OnboardingGuardModal.tsx`: modal buộc onboarding / chặn luồng nếu thiếu thông tin

#### components/portal/
- Chứa trang dành cho bệnh nhân:
  - `PortalHome.tsx`: trang chủ portal
  - `BookingWizardPage.tsx`: Wizard đặt lịch khám
  - `OnboardingProfilePage.tsx`: trang onboarding hồ sơ bệnh nhân
  - `PatientVisitsPage.tsx`: trang xem lịch khám / bệnh án
  - `AuthModal.tsx`: modal đăng nhập / đăng ký

- Thư mục `templates/` có các template con:
  - `DoctorsDirectoryTemplate.tsx`: danh sách bác sĩ
  - `PricingServicesTemplate.tsx`: bảng giá dịch vụ
  - `SpecialtyDetailTemplate.tsx`: chi tiết chuyên khoa

#### components/workspace/
- Chứa màn hình nghiệp vụ nội bộ:
  - `ReceptionistDesk.tsx`: sân làm việc lễ tân
  - `DoctorWorkspace.tsx`: workspace bác sĩ
  - `AdminWorkspace.tsx`: dashboard quản trị

#### components/chat/
- Chứa AI chat widget:
  - `MessengerAIChatWidget.tsx`: khung chat AI hỗ trợ bệnh nhân / nhân sự
  - `DoctorSlotChatCard.tsx`: card chat / slot tư vấn bác sĩ

---

## 4. Luồng hoạt động chính của frontend

1. `src/main.tsx` render app.
2. `src/App.tsx` xác định role hiện tại.
3. Dựa trên role:
   - Guest / Patient => hiển thị portal bệnh nhân
   - Receptionist / Doctor / Admin => hiển thị workspace nội bộ
4. Component tương ứng dùng state từ `store/`.
5. Dữ liệu hiển thị có thể lấy từ:
   - `mockData.ts` nếu chưa có backend
   - `axiosClient.ts` nếu có API thật
6. PWA plugin giúp đóng gói app thành một app có thể cài đặt và chạy như native app.

---

## 5. Hướng dẫn chạy frontend

### Bước 1: Mở terminal trong thư mục dự án

```bash
cd E:\DATN\SmartClinicProject\SmartClinic.Frontend.PWA
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

> Nếu gặp lỗi xung đột peer dependency của `vite` và `esbuild`, có thể cần cài đặt đúng phiên bản tương thích:
>
> ```bash
> npm install -D esbuild@^0.28.2
> ```

### Bước 3: Khởi chạy ứng dụng ở môi trường dev

```bash
npm run dev
```

Mặc định app sẽ chạy tại:

```text
http://localhost:3000
```

### Bước 4: Xem bản build production

```bash
npm run build
npm run preview
```

### Bước 5: Kiểm tra TypeScript

```bash
npm run lint
```

---

## 6. Biến môi trường quan trọng

Nếu ứng dụng sử dụng AI hoặc backend, có thể cần file `.env.local` với nội dung như:

```env
GEMINI_API_KEY=your_api_key_here
```

Ngoài ra, Vite config đang hỗ trợ `DISABLE_HMR` nếu cần tắt hot reload trong môi trường AI Studio.

---

## 7. Ghi chú về PWA

Dự án đã được cấu hình để hoạt động như Progressive Web App:

- có manifest
- có service worker
- có icon và theme
- có khả năng chạy offline ở mức cơ bản
- có nút cài đặt app nếu browser hỗ trợ

Bạn có thể kiểm tra hoạt động này bằng cách mở trình duyệt và test trên localhost hoặc deploy lên hosting có HTTPS.

---

## 8. Kết luận

SmartClinic.Frontend.PWA là giao diện front-end của hệ thống phòng khám hiện đại, kết hợp giữa:

- portal bệnh nhân thân thiện
- dashboard nội bộ cho nhân sự và bác sĩ
- AI chat hỗ trợ
- PWA để trải nghiệm gần như native app

Nếu muốn tiếp tục phát triển, bạn nên tập trung vào:

1. kết nối API thực tế trong `src/services/axiosClient.ts`
2. thay thế mock data bằng dữ liệu từ backend
3. tinh chỉnh component trong `src/components/portal/` và `src/components/workspace/`
4. tối ưu hóa giao diện PWA và offline UX

---

Tác giả / mục đích: giải thích cấu trúc và cách chạy frontend cho SmartClinic.Frontend.PWA.
