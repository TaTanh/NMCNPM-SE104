# Hệ thống Quản lý Học sinh – SE104

Dự án phục vụ môn học Nhập môn Công nghệ Phần mềm (SE104).  
Ứng dụng được xây dựng bằng HTML, CSS và JavaScript, chạy thông qua môi trường Node.js và Express để phục vụ các tệp tĩnh.

## 1. Cấu trúc thư mục

Web/  
│ server.js  
│ package.json  
│ README.md  
│ .gitignore  
│  
└── public/  
  ├── pages/          (các trang HTML)  
  ├── layout/         (các tệp CSS)  
  ├── assets/         (logo, ảnh nền, icon…)  
  ├── js/             (script phía giao diện)  

Express sử dụng thư mục `public/` làm thư mục gốc (root) cho toàn bộ tài nguyên.

## 2. Yêu cầu môi trường

- Node.js phiên bản 16 trở lên  
- npm (đi kèm Node.js)

Kiểm tra môi trường:

```
node -v
npm -v
```

## 3. Cài đặt thư viện

Tại thư mục dự án:
```
npm install
```
Lệnh này sẽ tự động cài đặt Express và các gói liên quan được khai báo trong `package.json`.

## 4. Khởi chạy server

Có hai cách để khởi chạy:

### Cách 1 (khuyến nghị)

```
npm start
```

### Cách 2
```
node server.js
```
Khi chạy thành công, terminal sẽ hiển thị:

Server chạy tại http://localhost:3000

## 5. Truy cập hệ thống

Mở trình duyệt và truy cập:
```
http://localhost:3000/
```
Trang mặc định sẽ là `login.html`.

Có thể mở trực tiếp các trang khác:

- /pages/dashboard.html  
- /pages/students.html  
- /pages/subject_list.html  
- /pages/grade_select.html  
- /pages/teaching_assignment.html  

CTRL + C để đóng server

## 6. Lưu ý khi phát triển

- Không mở tệp HTML trực tiếp bằng đường dẫn dạng file:///  
  Toàn bộ hệ thống cần chạy thông qua Express để xử lý đúng các đường dẫn tài nguyên.

- Các đường dẫn trong HTML phải dùng dạng tuyệt đối:


- Không đưa thư mục `node_modules` lên Git.  
Thư mục này đã được khai báo trong `.gitignore`.

## 7. Thành viên thực hiện

Project: [Quản lý học sinh] – SE104

Board: [https://trello.com/b/MinwPrnp/se102]

Members:

-Tạ Ngọc Thành / 23521462

-Nguyễn Bá Thông /23521523

-Vũ Thanh Sơn / 23521365

-Trần Đào Văn Tiên / 23521585