# BẢN ĐẶC TẢ KỸ THUẬT VÀ HƯỚNG DẪN XÂY DỰNG MINI APP QUẢN LÝ CHI TIÊU CÁ NHÂN (PWA MOBILE-FIRST)

## I. TỔNG QUAN DỰ ÁN & PHƯƠNG ÁN TRIỂN KHAI

* **Tên phần mềm:** SmartSpend Mini - Quản Lý Chi Tiêu Cá Nhân

* **Đối tượng sử dụng:** Cá nhân có thu nhập và chi tiêu từ nhiều nguồn (Lương, làm thêm, bán hàng, ví điện tử, ngân hàng, tiền mặt).

* **Nền tảng mục tiêu:** Progressive Web App (PWA) giao diện Mobile-First.

* **Phương thức vận hành & Chia sẻ ứng dụng:**

  1. **Phương án chính (Link công khai - Cho tất cả mọi người):** Deploy mã nguồn lên các nền tảng Hosting miễn phí (Vercel / Netlify / GitHub Pages). Ứng dụng sẽ có đường link HTTPS cố định (ví dụ: `https://smartspend-mini.vercel.app`). Bất kỳ ai nhận được link đều mở và sử dụng được trên điện thoại từ mọi nơi (dùng Wi-Fi hoặc 3G/4G/5G).

  2. **Phương án thử nghiệm nhanh (Mạng LAN nội bộ):** Chạy Server local trên máy tính (như Vite `npm run dev -- --host`), lấy địa chỉ IP LAN (ví dụ: `http://192.168.1.x:5173`) để mở trực tiếp trên điện thoại cùng mạng Wi-Fi trong quá trình lập trình/debug.

  3. **Cài đặt vào màn hình chính (Add to Home Screen):** Người dùng chỉ cần mở đường link trên trình duyệt di động (Safari/Chrome), chọn **"Thêm vào Màn hình chính"** để tạo biểu tượng app riêng biệt ngoài màn hình điện thoại, hoạt động độc lập không có thanh URL.

  4. **Bảo mật & Tách biệt dữ liệu người dùng:** Vì ứng dụng lưu trữ dữ liệu bằng `LocalStorage` trên thiết bị và hỗ trợ xuất/nhập file `.csv` trực tiếp trên máy người dùng, nên mỗi người sử dụng qua link sẽ có một cơ sở dữ liệu sổ chi tiêu độc lập, hoàn toàn riêng tư và không bị trùng lặp dữ liệu với người khác.

## II. BỘ QUY TẮC PHÒNG TRÁNH LỖI KHI AI SINH MÃ NGUỒN (CRITICAL ERROR PREVENTION RULES)

Để đảm bảo Antigravity sinh mã nguồn chạy ổn định và không phát sinh lỗi bất ngờ khi sử dụng trên điện thoại, mã nguồn bắt buộc tuân thủ 6 quy tắc sau:

### 1. Lỗi mã hóa Font Tiếng Việt trong file CSV (BOM UTF-8)

* **Vấn đề:** Khi tải file `.csv` về điện thoại và mở bằng Microsoft Excel hoặc Google Sheets, ký tự tiếng Việt thường bị lỗi hiển thị mã hóa (font rác).

* **Giải pháp:** Khi sinh file CSV trong JavaScript, bắt buộc chèn ký tự **Byte Order Mark (BOM)** `\uFEFF` vào đầu chuỗi CSV trước khi tạo Blob:

  ```javascript
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  ```

### 2. Lỗi dấu phân cách cột và ký tự đặc biệt trong CSV

* **Vấn đề:** Ghi chú hoặc tên danh mục chứa dấu phẩy `,` hoặc xuống dòng `\n` sẽ làm sai lệch cấu trúc cột CSV.

* **Giải pháp:** Bọc tất cả các giá trị dạng chuỗi (String) trong dấu ngoặc kép `""`. Nếu trong chuỗi có dấu ngoặc kép, thay thế thành ngoặc kép đôi `""`.

### 3. Lỗi tính toán số thực (Floating Point Precision Error)

* **Vấn đề:** Trong JavaScript, $0.1 + 0.2 = 0.30000000000000004$, dẫn đến số tiền hiển thị sai lệch.

* **Giải pháp:**

  * Tất cả các giá trị tiền tệ (`amount`, `balance`, `limit`) bắt buộc được lưu trữ dưới dạng **Số nguyên (Integer)** đơn vị VNĐ.

  * Khi hiển thị ra giao diện, sử dụng chuẩn định dạng Việt Nam: `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })`.

### 4. Lỗi lưu trữ LocalStorage & Mất dữ liệu

* **Vấn đề:** Người dùng tắt trình duyệt hoặc làm mới trang dẫn đến mất dữ liệu.

* **Giải pháp:**

  * Sử dụng một đối tượng `AppState` tập trung trong LocalStorage với key `SMARTSPEND_DATA_V1`.

  * Mỗi khi có thao tác Thêm / Sửa / Xóa, ứng dụng lập tức ghi đè dữ liệu mới vào LocalStorage.

  * Kiểm tra dữ liệu khi khởi chạy lần đầu: Nếu LocalStorage rỗng, tự động tải dữ liệu mẫu (Seed Data) chuẩn.

### 5. Tối ưu Giao diện Mobile Touch (UX/UI Rule)

* **Vấn đề:** Nút bấm quá nhỏ khó ấn trên điện thoại, giao diện vỡ khi xoay hoặc mở bàn phím ảo.

* **Giải pháp:**

  * Thiết kế khung ứng dụng cố định `max-width: 480px`, căn giữa trên máy tính và tràn màn hình $100\%$ trên điện thoại.

  * Tối thiểu kích thước các vùng bấm (Touch Target): $44\text{px} \times 44\text{px}$.

  * Thanh điều hướng chính (Bottom Navigation Bar) cố định ở đáy màn hình với 4 tab: **Trang chủ**, **Giao dịch**, **Thống kê & Ngân sách**, **Cài đặt & CSV**.

## III. CẤU TRÚC DỮ LIỆU (DATA MODEL SCHEMAS)

```typescript
// 1. Giao dịch
interface Transaction {
  id: string;               // VD: "TX_1700000000000"
  type: 'INCOME' | 'EXPENSE'; // Thu nhập hoặc Chi tiêu
  amount: number;           // Số tiền (VNĐ - Integer)
  date: string;             // Ngày giao dịch "YYYY-MM-DD"
  categoryId: string;       // ID của Danh mục
  walletId: string;         // ID của Ví / Tài khoản
  note: string;             // Ghi chú
  isRecurring?: boolean;    // Đánh dấu giao dịch lặp lại
}

// 2. Danh mục
interface Category {
  id: string;               // VD: "CAT_FOOD"
  name: string;             // Tên danh mục (Ăn uống, Đi lại...)
  type: 'INCOME' | 'EXPENSE';
  icon: string;             // Tên icon (Lucide Icon)
  isDefault: boolean;       // Danh mục mặc định (không cho xóa)
}

// 3. Ví / Tài khoản
interface Wallet {
  id: string;               // VD: "WAL_CASH"
  name: string;             // Tiền mặt, Ngân hàng, Ví điện tử
  initialBalance: number;   // Số dư ban đầu
  icon: string;
}

// 4. Ngân sách chi tiêu
interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;     // Hạn mức tháng (VNĐ)
  monthYear: string;        // Định dạng "YYYY-MM"
}

// 5. Mục tiêu tiết kiệm
interface SavingGoal {
  id: string;
  title: string;            // Tên mục tiêu (VD: Mua xe, Đi du lịch)
  targetAmount: number;     // Số tiền mục tiêu
  currentAmount: number;    // Số tiền hiện có
  deadline: string;         // Hạn chót "YYYY-MM-DD"
}

// 6. Giao dịch định kỳ
interface RecurringTransaction {
  id: string;
  title: string;            // Tên khoản (Tiền nhà, Tiền mạng...)
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  categoryId: string;
  walletId: string;
  dayOfMonth: number;       // Ngày thu/chi trong tháng (1-31)
  isActive: boolean;
}
```

## IV. CÁC CHỨC NĂNG BẮT BUỘC (MANDATORY FEATURES)

### 1. Quản lý Giao dịch (Thu / Chi)

* **Thêm mới giao dịch:**

  * Cho phép chọn loại: **Thu nhập** hoặc **Chi tiêu**.

  * Ô nhập Số tiền (có tự động định dạng `100.000` khi gõ).

  * Ô chọn Ngày (mặc định là ngày hiện tại).

  * Ô chọn Danh mục (Dropdown hoặc lưới icon danh mục).

  * Ô chọn Ví / Tài khoản.

  * Ô nhập Ghi chú tự do.

* **Sửa & Xóa giao dịch:**

  * Nhấn vào một giao dịch để mở cửa sổ chỉnh sửa (Modal).

  * Cho phép xóa giao dịch với hộp thoại xác nhận ("Bạn có chắc chắn muốn xóa?").

* **Danh sách giao dịch:**

  * Sắp xếp tự động theo **ngày mới nhất lên đầu**.

  * Gom nhóm giao dịch theo từng ngày (Ví dụ: "Hôm nay - 20/11/2026", "Hôm qua - 19/11/2026").

### 2. Quản lý Danh mục (Categories)

* **Danh mục mặc định sẵn có:**

  * *Chi tiêu:* Ăn uống, Đi lại, Học tập, Giải trí, Nhà ở, Mua sắm, Sức khỏe, Khác.

  * *Thu nhập:* Lương, Bán hàng / Livestream, Thưởng, Thu nhập khác.

* **Tùy chỉnh danh mục:**

  * Cho phép người dùng bấm **"Thêm danh mục mới"** (nhập tên, chọn icon, chọn loại Thu/Chi).

  * Cho phép sửa tên/icon hoặc xóa các danh mục tự tạo (Không cho xóa các danh mục mặc định của hệ thống).

### 3. Màn hình Tổng quan (Dashboard)

* **Thống kê thẻ tài chính tháng hiện tại:**

  * **Tổng Thu trong tháng** (màu xanh lá).

  * **Tổng Chi trong tháng** (màu đỏ).

  * **Số dư tháng hiện tại** ($\text{Tổng Thu} - \text{Tổng Chi}$).

* **Bộ lọc thời gian:** Cho phép chọn/chuyển đổi qua lại giữa các tháng (Ví dụ: Tháng 11/2026, Tháng 10/2026...).

### 4. Lưu trữ & Quản lý Dữ liệu CSV

* **Lưu trữ nội bộ:** Tự động lưu tức thì vào LocalStorage.

* **Tải file CSV:** Tải danh sách giao dịch về thư mục Downloads của điện thoại.

* **Đọc/Khôi phục từ CSV:** Cho phép chọn file CSV từ bộ nhớ điện thoại để nạp dữ liệu vào app.

## V. CÁC CHỨC NĂNG MỞ RỘNG (ADVANCED FEATURES)

### 1. Ngân sách theo Danh mục (Budgeting & Alerts)

* Thiết lập hạn mức chi tiêu tối đa trong tháng cho từng danh mục (Ví dụ: Ăn uống tối đa 3.000.000 đ/tháng).

* Hiển thị thanh tiến độ (%) đã chi tiêu của danh mục đó.

* **Cảnh báo mức chi:**

  * Đạt từ **80% - 99%**: Hiển thị thanh tiến độ màu vàng kèm cảnh báo "Sắp vượt hạn mức".

  * Đạt **100% trở lên**: Hiển thị thanh tiến độ màu đỏ kèm cảnh báo "Đã vượt hạn mức chi tiêu!".

### 2. Biểu đồ Thống kê Trực quan (Visual Analytics)

* **Biểu đồ tròn (Pie/Donut Chart):** Phân tích tỷ lệ % chi tiêu theo từng danh mục trong tháng.

* **Biểu đồ cột / đường (Bar/Line Chart):** Theo dõi biến động thu/chi qua các ngày trong tháng hoặc qua 6 tháng gần nhất.

### 3. Tìm kiếm và Lọc Nâng cao (Advanced Filter)

* Ô tìm kiếm từ khóa theo ghi chú (VD: gõ "cà phê" để tìm các lần uống cà phê).

* Lọc kết quả đồng thời theo: Danh mục, Khoảng ngày (Từ ngày... Đến ngày...), Khoảng số tiền (Từ... Đến...).

### 4. Quản lý Nhiều Ví / Tài khoản (Multi-Wallet)

* Quản lý các nguồn tiền độc lập: **Tiền mặt**, **Ngân hàng (MB Bank, VCB...)**, **Ví điện tử (Momo, ZaloPay...)**.

* Tính năng **Chuyển tiền giữa các ví** (VD: Rút tiền ngân hàng về tiền mặt).

* Số dư tổng = Tổng số dư của tất cả các ví hợp lại.

### 5. Mục tiêu Tiết kiệm (Savings Goals)

* Tạo mục tiêu (VD: "Mua iPhone mới", "Quỹ du lịch").

* Nhập số tiền mục tiêu và hạn chót.

* Cho phép bấm "Nạp tiền vào quỹ" để cập nhật % tiến độ hoàn thành.

### 6. Giao dịch Định kỳ (Recurring Transactions)

* Thiết lập danh sách các khoản lặp lại cố định hàng tháng (Tiền nhà, Tiền học phí, Đăng ký Spotify/Netflix).

* Tự động nhắc nhở hoặc sinh giao dịch khi đến ngày cài đặt trong tháng.

### 7. Xuất Dữ liệu Nâng cao (CSV / Excel Export)

* Tùy chọn xuất báo cáo chi tiết hoặc xuất tổng hợp theo tháng.

* Tùy chọn xuất riêng cho từng ví hoặc tất cả các ví.

## VI. CẤU TRÚC FILE CSV CHUẨN ĐỀ XUẤT

File `transactions_export.csv` được xuất ra với cấu trúc chuẩn sau:

```csv
"Mã giao dịch","Ngày","Loại","Số tiền (VNĐ)","Danh mục","Ví/Tài khoản","Ghi chú"
"TX_17320000001","2026-11-01","INCOME",1500000,"Bán hàng / Livestream","Ngân hàng","Nhận tiền chốt đơn live"
"TX_17320000002","2026-11-02","EXPENSE",45000,"Ăn uống","Tiền mặt","Ăn phở sáng"
"TX_17320000003","2026-11-02","EXPENSE",300000,"Đi lại","Ví điện tử","Đổ xăng và nạp vé xe"
```

## VII. KẾ HOẠCH PHÂN CHIA CÔNG VIỆC TRƯỚC - SAU (WBS)

### Giai đoạn 1: Khởi tạo Kiến trúc & Dữ liệu (Thực hiện trước)

1. Khởi tạo dự án React + Tailwind CSS trên Antigravity.

2. Xây dựng Data Models, LocalStorage Service và bộ dữ liệu mẫu (Seed Data).

3. Dựng khung giao diện chuẩn Mobile (Container `max-width: 480px` và Bottom Navigation).

### Giai đoạn 2: Phát triển Các Chức năng Bắt buộc

4. Phát triển màn hình **Tổng quan Dashboard** (Tổng thu, tổng chi, số dư, chọn tháng).

5. Phát triển màn hình **Quản lý Giao dịch** (Thêm, Sửa, Xóa, Danh sách phân loại theo ngày).

6. Phát triển màn hình **Quản lý Danh mục** (Xem danh mục, Thêm/Sửa/Xóa danh mục tùy chỉnh).

7. Phát triển module **Import/Export File CSV UTF-8 BOM**.

### Giai đoạn 3: Phát triển Các Chức năng Mở rộng

 8. Tích hợp module **Quản lý Nhiều Ví & Chuyển tiền**.

 9. Tích hợp module **Ngân sách theo danh mục & Cảnh báo 80%/100%**.

10. Tích hợp thư viện Biểu đồ (Recharts/Chart.js) cho màn hình **Thống kê Trực quan**.

11. Tích hợp **Tìm kiếm & Lọc nâng cao**, **Mục tiêu tiết kiệm** và **Giao dịch định kỳ**.

### Giai đoạn 4: Kiểm thử trên Điện thoại & Tối ưu PWA & Deploy Link Công Khai

12. Đóng gói PWA (Web Manifest & Service Worker cơ bản để lưu icon Add to Home Screen).

13. Deploy ứng dụng lên Vercel / Netlify để sinh link HTTPS công khai.

14. Kiểm thử responsive, thao tác chạm/vuốt trên điện thoại thật (iOS Safari & Android Chrome).

## VIII. QUY TRÌNH DEPLOY LẤY LINK CÔNG KHAI VÀ CÀI ĐẶT VÀO ĐIỆN THOẠI

### Bước 1: Cho Antigravity sinh mã nguồn ứng dụng

* Copy bản đặc tả này vào Antigravity và dùng lệnh:

  > *"Dựa trên bản đặc tả `personal_finance_app_spec.md`, hãy viết trọn bộ mã nguồn Web App / PWA hoàn chỉnh (HTML/CSS/JS single-file hoặc React/Vite) có đầy đủ tính năng bắt buộc và mở rộng."*

### Bước 2: Deploy ứng dụng lên Internet để lấy Link công khai (Miễn phí 100%)

Bạn chọn 1 trong 2 cách cực đơn giản sau:

* **Cách A: Dùng Netlify Drop (Không cần tạo lệnh phức tạp)**
  1. Sau khi Antigravity build ra thư mục code (thư mục `dist` hoặc chứa file `index.html`).
  2. Truy cập [app.netlify.com/drop](https://app.netlify.com/drop).
  3. Kéo thả trực tiếp thư mục mã nguồn vào trang web.
  4. Trong 5 giây, Netlify sẽ tạo cho bạn 1 đường link dạng: `https://smartspend-app-xyz.netlify.app`.

* **Cách B: Dùng Vercel CLI hoặc GitHub**
  1. Đẩy code lên GitHub cá nhân.
  2. Kết nối tài khoản Vercel với GitHub.
  3. Chọn Repository và nhấn **Deploy**. Vercel tự động cấp link domain miễn phí: `https://smartspend.vercel.app`.

### Bước 3: Gửi Link và Cài đặt vào điện thoại (Cho bạn và mọi người)

1. Sao chép đường link `https://...` đã tạo ở Bước 2 và gửi qua Zalo, Messenger, Email cho giáo viên, bạn bè hoặc chính bạn.
2. Mở đường link trên di động:
   * **Trên iPhone (Safari):** Bấm biểu tượng **Chia sẻ (Share)** ở đáy trình duyệt $\rightarrow$ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
   * **Trên Android (Chrome):** Bấm biểu tượng **3 chấm** ở góc phải $\rightarrow$ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
3. Ứng dụng sẽ có một Icon riêng trên màn hình điện thoại. Mỗi người mở ứng dụng lên sẽ có giao diện app độc lập, quản lý chi tiêu cá nhân an toàn và có thể xuất file CSV bất kỳ lúc nào!