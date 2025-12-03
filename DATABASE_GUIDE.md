# Hướng dẫn kết nối Database

## 1. Cài đặt PostgreSQL

1. Tải PostgreSQL từ: https://www.postgresql.org/download/
2. Cài đặt với mật khẩu mặc định: `123456` (hoặc sửa trong `db.js`)
3. Port mặc định: `5432`

## 2. Tạo Database

### Cách 1: Dùng pgAdmin
1. Mở pgAdmin
2. Tạo database mới tên: `student_management`
3. Mở Query Tool và chạy file `database/init.sql`

### Cách 2: Dùng Command Line
```bash
# Đăng nhập PostgreSQL
psql -U postgres

# Tạo database
CREATE DATABASE student_management;

# Thoát
\q

# Chạy script tạo bảng
psql -U postgres -d student_management -f database/init.sql
```

## 3. Cấu hình kết nối

Mở file `db.js` và sửa thông tin kết nối:

```javascript
const pool = new Pool({
    user: 'postgres',           // Tên user PostgreSQL
    host: 'localhost',          // Host database
    database: 'student_management',  // Tên database
    password: '123456',         // Mật khẩu PostgreSQL
    port: 5432                  // Port (mặc định 5432)
});
```

## 4. Cài đặt dependencies

```bash
cd "e:\Nam_3_HK1\SE104\Web"
npm install
```

## 5. Chạy server

```bash
npm start
```

Server sẽ chạy tại: http://localhost:3000

## 6. API Endpoints

### Học sinh
- `GET /api/students` - Lấy danh sách học sinh
- `GET /api/students/:id` - Lấy 1 học sinh
- `POST /api/students` - Thêm học sinh
- `PUT /api/students/:id` - Cập nhật học sinh
- `DELETE /api/students/:id` - Xóa học sinh

### Lớp học
- `GET /api/classes` - Lấy danh sách lớp
- `GET /api/classes/:id` - Lấy 1 lớp
- `POST /api/classes` - Thêm lớp
- `PUT /api/classes/:id` - Cập nhật lớp
- `DELETE /api/classes/:id` - Xóa lớp

### Môn học
- `GET /api/subjects` - Lấy danh sách môn học
- `POST /api/subjects` - Thêm môn học
- `PUT /api/subjects/:id` - Cập nhật môn học
- `DELETE /api/subjects/:id` - Xóa môn học

### Điểm
- `GET /api/grades/class/:maLop/subject/:maMonHoc` - Lấy bảng điểm
- `POST /api/grades/update` - Cập nhật điểm
- `POST /api/grades/create` - Tạo bảng điểm mới

### Cài đặt
- `GET /api/settings/params` - Lấy tham số hệ thống
- `PUT /api/settings/params/:name` - Cập nhật tham số
- `GET /api/settings/school-years` - Lấy danh sách năm học
- `GET /api/settings/semesters` - Lấy danh sách học kỳ
- `GET /api/settings/grade-levels` - Lấy danh sách khối lớp
- `GET /api/settings/exam-types` - Lấy loại hình kiểm tra

### Báo cáo
- `GET /api/reports/subject?namhoc=&hocky=&monhoc=` - Báo cáo tổng kết môn
- `GET /api/reports/semester?namhoc=&hocky=` - Báo cáo tổng kết học kỳ

## 7. Cấu trúc thư mục

```
Web/
├── package.json              # Dependencies
├── DATABASE_GUIDE.md         # Hướng dẫn database
├── README.md                 # Readme
├── database/                 # Scripts database
│   ├── init.sql              # Script tạo bảng
│   ├── regulations.sql       # Script quy định
│   └── users_roles.sql       # Script users & roles
├── src/                      # Backend source code
│   ├── app.js                # Express server
│   ├── config/
│   │   └── db.js             # Kết nối PostgreSQL
│   ├── controllers/          # Controllers
│   │   ├── authController.js
│   │   ├── classController.js
│   │   ├── gradeController.js
│   │   ├── reportController.js
│   │   ├── settingController.js
│   │   ├── studentController.js
│   │   └── subjectController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/               # Database models
│   │   ├── classModel.js
│   │   ├── gradeModel.js
│   │   ├── reportModel.js
│   │   ├── settingModel.js
│   │   ├── studentModel.js
│   │   ├── subjectModel.js
│   │   └── userModel.js
│   └── routes/               # API routes
│       ├── authRoutes.js
│       ├── classRoutes.js
│       ├── gradeRoutes.js
│       ├── reportRoutes.js
│       ├── settingRoutes.js
│       ├── studentRoutes.js
│       └── subjectRoutes.js
└── public/                   # Frontend
    ├── assets/               # Images
    ├── js/                   # Frontend JavaScript
    │   ├── auth.js
    │   ├── classes.js
    │   ├── students.js
    │   ├── subjects.js
    │   └── toast.js
    ├── layout/               # CSS styles
    │   ├── login_styles.css
    │   └── styles.css
    └── pages/                # HTML pages
        ├── classes.html
        ├── dashboard.html
        ├── grade_details.html
        ├── grade_entry.html
        ├── grade_entry_select.html
        ├── grade_select.html
        ├── login.html
        ├── register.html
        ├── reports.html
        ├── students.html
        ├── student_transcript.html
        ├── subject_list.html
        ├── teaching_assignment.html
        └── users.html
```

## 8. Troubleshooting

### Lỗi "Cannot connect to database"
- Kiểm tra PostgreSQL đã chạy chưa
- Kiểm tra thông tin kết nối trong `db.js`
- Kiểm tra database `student_management` đã tồn tại chưa

### Lỗi "pg module not found"
```bash
npm install pg
```

### Lỗi CORS
Server đã được cấu hình để cho phép requests từ frontend.
