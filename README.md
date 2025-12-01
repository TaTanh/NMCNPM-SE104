# Hệ thống Quản lý Học sinh – SE104

Dự án phục vụ môn học Nhập môn Công nghệ Phần mềm (SE104).  
Ứng dụng web quản lý học sinh được xây dựng bằng **Node.js**, **Express** và **PostgreSQL**, với giao diện sử dụng HTML, CSS và JavaScript.

## 📁 1. Cấu trúc thư mục

```
Web/
├── server.js              # Entry point của ứng dụng
├── db.js                  # Kết nối PostgreSQL
├── package.json           # Quản lý dependencies
├── README.md
├── DATABASE_GUIDE.md      # Hướng dẫn cài đặt database
│
├── database/
│   └── init.sql           # Script khởi tạo database
│
├── middleware/
│   └── auth.js            # Middleware xác thực
│
├── routes/                # API routes
│   ├── auth.js            # API xác thực (đăng nhập/đăng ký)
│   ├── students.js        # API quản lý học sinh
│   ├── classes.js         # API quản lý lớp học
│   ├── subjects.js        # API quản lý môn học
│   ├── grades.js          # API quản lý điểm
│   ├── reports.js         # API báo cáo
│   └── settings.js        # API cài đặt quy định
│
├── sql/                   # SQL scripts bổ sung
│   ├── regulations.sql
│   └── users_roles.sql
│
└── public/                # Tài nguyên tĩnh (web root)
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
*Cập nhật lần cuối: Tháng 12/2025*-Vũ Thanh Sơn / 23521365

-Trần Đào Văn Tiên / 23521585