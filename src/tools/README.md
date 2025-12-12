# Tools - Công cụ hỗ trợ

Thư mục này chứa các công cụ CLI để quản lý và kiểm tra hệ thống.

## 📁 Cấu trúc

```
src/tools/
├── admin.js       # Quản lý tài khoản admin
├── database.js    # Quản lý database (init, backup, stats)
├── stats.js       # Thống kê chi tiết dữ liệu
└── README.md      # File này
```

## 🔧 Sử dụng

### 1. Admin Management (`admin.js`)

**Kiểm tra tài khoản admin:**
```bash
node src/tools/admin.js check
node src/tools/admin.js check admin
```

**Tạo tài khoản admin mới:**
```bash
node src/tools/admin.js create
node src/tools/admin.js create admin admin123 "Administrator" admin@local
```

---

### 2. Database Management (`database.js`)

**Khởi tạo database (chạy init.sql + seed.sql):**
```bash
node src/tools/database.js init
```

**Đếm số records trong các bảng:**
```bash
node src/tools/database.js count
# hoặc
node src/tools/database.js stats
```

**Kiểm tra kết nối database:**
```bash
node src/tools/database.js check
```

---

### 3. Statistics (`stats.js`)

**Thống kê tổng hợp:**
```bash
node src/tools/stats.js
# hoặc
node src/tools/stats.js general
```

**Thống kê điểm:**
```bash
node src/tools/stats.js grade
```

**Thống kê hạnh kiểm:**
```bash
node src/tools/stats.js behavior
```

**Thống kê theo lớp:**
```bash
node src/tools/stats.js class 10A1
```

**Thống kê tất cả:**
```bash
node src/tools/stats.js all
```

---

## 💡 Lưu ý

- Tất cả các tool đều sử dụng kết nối database từ `src/config/db.js`
- Cần cấu hình database trong file `.env` hoặc `src/config/db.js` trước khi chạy
- Có thể import các function từ các file này để sử dụng trong code:

```javascript
const { checkAdmin, createAdmin } = require('./src/tools/admin');
const { initDatabase, getTableCounts } = require('./src/tools/database');
const { getGeneralStats, getGradeStats } = require('./src/tools/stats');
```

---

## 🗑️ Migration từ folder cũ

Folder `tools/` cũ ở root đã được gộp và di chuyển vào `src/tools/`:

- ✅ `check_admin.js` → `admin.js` (function `checkAdmin`)
- ✅ `create_admin.js` → `admin.js` (function `createAdmin`)
- ✅ `init_database.js` → `database.js` (function `initDatabase`)
- ✅ `table_count.js` → `database.js` (function `getTableCounts`)
- ✅ `stats.js` + `get_stats.js` + `quick_stats.js` + `statistics.js` → `stats.js` (gộp thành 1 file)

Bạn có thể xóa folder `tools/` cũ ở root sau khi kiểm tra.
