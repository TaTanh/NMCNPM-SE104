# Hệ thống Quản lý Học sinh – SE104

Dự án phục vụ môn học Nhập môn Công nghệ Phần mềm (SE104).  
Ứng dụng web quản lý học sinh được xây dựng bằng **Node.js**, **Express** và **PostgreSQL**, với giao diện sử dụng HTML, CSS và JavaScript.

## 📁 1. Cấu trúc thư mục (Kiến trúc 3 tầng: Route - Controller - Model)

```
Web/
├── package.json           # Quản lý dependencies
├── README.md
├── DATABASE_GUIDE.md      # Hướng dẫn cài đặt database
│
├── database/              # Tất cả SQL scripts
│   ├── init.sql           # Script khởi tạo database
│   ├── regulations.sql    # Script quy định
│   └── users_roles.sql    # Script người dùng và vai trò
│
├── src/                   # Source code Backend (3 tầng)
│   ├── app.js             # Entry point của ứng dụng
│   │
│   ├── config/            # Cấu hình
│   │   └── db.js          # Kết nối PostgreSQL
│   │
│   ├── models/            # Tầng Model - Tương tác Database
│   │   ├── userModel.js       # Model người dùng & vai trò
│   │   ├── studentModel.js    # Model học sinh
│   │   ├── classModel.js      # Model lớp học
│   │   ├── subjectModel.js    # Model môn học
│   │   ├── gradeModel.js      # Model điểm
│   │   ├── settingModel.js    # Model cài đặt/tham số
│   │   └── reportModel.js     # Model báo cáo
│   │
│   ├── controllers/       # Tầng Controller - Xử lý logic nghiệp vụ
│   │   ├── authController.js      # Xử lý đăng nhập/đăng ký
│   │   ├── studentController.js   # Xử lý học sinh
│   │   ├── classController.js     # Xử lý lớp học
│   │   ├── subjectController.js   # Xử lý môn học
│   │   ├── gradeController.js     # Xử lý điểm
│   │   ├── settingController.js   # Xử lý cài đặt
│   │   └── reportController.js    # Xử lý báo cáo
│   │
│   ├── routes/            # Tầng Route - Định tuyến URL
│   │   ├── authRoutes.js      # Routes xác thực
│   │   ├── studentRoutes.js   # Routes học sinh
│   │   ├── classRoutes.js     # Routes lớp học
│   │   ├── subjectRoutes.js   # Routes môn học
│   │   ├── gradeRoutes.js     # Routes điểm
│   │   ├── settingRoutes.js   # Routes cài đặt
│   │   └── reportRoutes.js    # Routes báo cáo
│   │
│   └── middleware/        # Middleware
│       └── authMiddleware.js  # Middleware xác thực & phân quyền
│
└── public/                # Tài nguyên tĩnh (Frontend)
    ├── pages/             # Các trang HTML
    │   ├── login.html
    │   ├── register.html
    │   ├── dashboard.html
    │   ├── students.html
    │   ├── classes.html
    │   ├── subject_list.html
    │   ├── grade_entry.html
    │   ├── grade_entry_select.html
    │   ├── grade_select.html
    │   ├── grade_details.html
    │   ├── student_transcript.html
    │   ├── teaching_assignment.html
    │   ├── reports.html
    │   └── users.html
    ├── layout/            # CSS styles
    ├── assets/            # Logo, ảnh, icons
    └── js/                # JavaScript phía client
```

## 🏗️ Kiến trúc 3 tầng

### 1. **Route** (Tầng định tuyến)
- Chỉ chứa định nghĩa đường dẫn (URL)
- Liên kết URL với Controller tương ứng

### 2. **Controller** (Tầng điều khiển)
- Nhận request từ Route
- Xử lý logic nghiệp vụ
- Gọi Model để thao tác dữ liệu
- Trả response về client

### 3. **Model** (Tầng dữ liệu)
- Chỉ chứa các hàm thực thi câu lệnh SQL
- Tương tác trực tiếp với Database
- Không xử lý logic nghiệp vụ

## 🔧 2. Yêu cầu môi trường

- **Node.js** phiên bản 16 trở lên  
- **npm** (đi kèm Node.js)
- **PostgreSQL** phiên bản 12 trở lên

Kiểm tra môi trường:
```bash
node -v
npm -v
psql --version
```

## 🗄️ 3. Cài đặt Database

### Bước 1: Tạo database PostgreSQL
```bash
# Đăng nhập PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE student_management;

# Thoát
\q
```

### Bước 2: Chạy script khởi tạo
```bash
psql -U postgres -d student_management -f database/init.sql
```

### Bước 3: Cấu hình kết nối
Mở file `db.js` và sửa thông tin kết nối nếu cần:
```javascript
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'student_management',
    password: '123456',    // Sửa theo mật khẩu của bạn
    port: 5432
});
```

> 📖 Xem chi tiết tại [DATABASE_GUIDE.md](DATABASE_GUIDE.md)

## 📦 4. Cài đặt thư viện

```bash
npm install
```

Dependencies chính:
- `express` (^5.1.0) - Web framework
- `pg` (^8.16.3) - PostgreSQL client

## 🚀 5. Khởi chạy server

### Cách 1 (khuyến nghị)
```bash
npm start
```

### Cách 2
```bash
node server.js
```

Khi chạy thành công, terminal sẽ hiển thị:
```
Server đang chạy tại http://localhost:3000/pages/login.html
```

## 🌐 6. Truy cập hệ thống

Mở trình duyệt và truy cập:
```
http://localhost:3000/
```

Trang mặc định là trang đăng nhập (`login.html`).

### Các trang chính:
| Trang | Đường dẫn | Mô tả |
|-------|-----------|-------|
| Đăng nhập | `/pages/login.html` | Trang đăng nhập hệ thống |
| Đăng ký | `/pages/register.html` | Đăng ký tài khoản mới |
| Dashboard | `/pages/dashboard.html` | Trang tổng quan |
| Học sinh | `/pages/students.html` | Quản lý học sinh |
| Lớp học | `/pages/classes.html` | Quản lý lớp học |
| Môn học | `/pages/subject_list.html` | Quản lý môn học |
| Nhập điểm | `/pages/grade_entry.html` | Nhập điểm học sinh |
| Xem điểm | `/pages/grade_select.html` | Tra cứu điểm |
| Bảng điểm | `/pages/student_transcript.html` | Bảng điểm học sinh |
| Báo cáo | `/pages/reports.html` | Báo cáo thống kê |
| Phân công | `/pages/teaching_assignment.html` | Phân công giảng dạy |
| Người dùng | `/pages/users.html` | Quản lý người dùng |

**CTRL + C** để đóng server

## 📡 7. API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| - | `/api/auth/*` | Xác thực người dùng |
| - | `/api/students/*` | Quản lý học sinh |
| - | `/api/classes/*` | Quản lý lớp học |
| - | `/api/subjects/*` | Quản lý môn học |
| - | `/api/grades/*` | Quản lý điểm |
| - | `/api/reports/*` | Báo cáo thống kê |
| - | `/api/settings/*` | Cài đặt quy định |
| GET | `/api/dashboard/stats` | Thống kê dashboard |

## ⚠️ 8. Lưu ý khi phát triển

- **Không mở tệp HTML trực tiếp** bằng đường dẫn dạng `file:///`  
  Toàn bộ hệ thống cần chạy thông qua Express để xử lý đúng các đường dẫn tài nguyên và API.

- **Đảm bảo PostgreSQL đang chạy** trước khi khởi động server.

- **Không đưa thư mục `node_modules` lên Git.**  
  Thư mục này đã được khai báo trong `.gitignore`.

### 🔧 Fix: Ngăn chặn học sinh học nhiều lớp cùng năm học

**Vấn đề**: Học sinh có thể bị thêm vào nhiều lớp trong cùng một năm học (vi phạm QĐ4).

**Giải pháp**: Validation trong `bulkAddStudents()` kiểm tra năm học trước khi thêm học sinh.

**Nếu đã có dữ liệu duplicate**: Xem phần "Fix dữ liệu duplicate" trong `DATABASE_GUIDE.md`

## 👥 9. Thành viên thực hiện

**Project:** Quản lý học sinh – SE104

**Board:** [Trello](https://trello.com/b/MinwPrnp/se102)

**Repository:** [GitHub](https://github.com/TaTanh/NMCNPM-SE104)

| STT | Họ và Tên | MSSV |
|-----|-----------|------|
| 1 | Tạ Ngọc Thành | 23521462 |
| 2 | Nguyễn Bá Thông | 23521523 |
| 3 | Vũ Thanh Sơn | 23521365 |
| 4 | Trần Đào Văn Tiên | 23521585 |

---