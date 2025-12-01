-- =============================================
-- BẢNG VAI TRÒ VÀ NGƯỜI DÙNG
-- =============================================

-- Bảng vai trò
CREATE TABLE IF NOT EXISTS VAITRO (
    MaVaiTro VARCHAR(20) PRIMARY KEY,
    TenVaiTro VARCHAR(50) NOT NULL,
    Quyen JSONB DEFAULT '{}',
    MoTa TEXT
);

-- Bảng người dùng
CREATE TABLE IF NOT EXISTS NGUOIDUNG (
    MaNguoiDung SERIAL PRIMARY KEY,
    TenDangNhap VARCHAR(50) UNIQUE NOT NULL,
    MatKhau VARCHAR(255) NOT NULL,
    HoTen VARCHAR(100),
    Email VARCHAR(100),
    MaVaiTro VARCHAR(20) REFERENCES VAITRO(MaVaiTro),
    TrangThai BOOLEAN DEFAULT true,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- THÊM 4 VAI TRÒ: ADMIN, GIÁO VIÊN, PHỤ HUYNH, HỌC SINH
-- =============================================
INSERT INTO VAITRO (MaVaiTro, TenVaiTro, Quyen, MoTa) VALUES 
('ADMIN', 'Quản trị viên', '{
    "all": true,
    "quanlyHocSinh": true,
    "quanlyLop": true,
    "quanlyMonHoc": true,
    "nhapDiem": true,
    "xemDiem": true,
    "baoCao": true,
    "caiDat": true,
    "phanQuyen": true
}', 'Có tất cả quyền: quản lý hệ thống, phân quyền, nhập điểm, thay đổi mọi thứ'),

('TEACHER', 'Giáo viên', '{
    "quanlyHocSinh": false,
    "quanlyLop": false,
    "quanlyMonHoc": false,
    "nhapDiem": true,
    "xemDiem": true,
    "baoCao": true,
    "caiDat": false,
    "phanQuyen": false
}', 'Có thể nhập điểm cho học sinh và xem báo cáo'),

('PARENT', 'Phụ huynh', '{
    "quanlyHocSinh": false,
    "quanlyLop": false,
    "quanlyMonHoc": false,
    "nhapDiem": false,
    "xemDiem": true,
    "baoCao": false,
    "caiDat": false,
    "phanQuyen": false
}', 'Chỉ xem điểm của con em mình'),

('STUDENT', 'Học sinh', '{
    "quanlyHocSinh": false,
    "quanlyLop": false,
    "quanlyMonHoc": false,
    "nhapDiem": false,
    "xemDiem": true,
    "baoCao": false,
    "caiDat": false,
    "phanQuyen": false
}', 'Chỉ xem điểm của mình')

ON CONFLICT (MaVaiTro) DO UPDATE SET
    TenVaiTro = EXCLUDED.TenVaiTro,
    Quyen = EXCLUDED.Quyen,
    MoTa = EXCLUDED.MoTa;

-- =============================================
-- TÀI KHOẢN MẪU
-- =============================================
-- Admin mặc định
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('admin', 'admin123', 'Quản trị viên', 'admin@school.edu.vn', 'ADMIN')
ON CONFLICT (TenDangNhap) DO NOTHING;

-- Giáo viên mẫu
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('giaovien1', '123456', 'Nguyễn Văn A', 'gv01@school.edu.vn', 'TEACHER')
ON CONFLICT (TenDangNhap) DO NOTHING;

-- Phụ huynh mẫu
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('phuhuynh1', '123456', 'Trần Văn B', 'ph01@gmail.com', 'PARENT')
ON CONFLICT (TenDangNhap) DO NOTHING;

-- Học sinh mẫu
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('hocsinh1', '123456', 'Lê Thị C', 'hs01@school.edu.vn', 'STUDENT')
ON CONFLICT (TenDangNhap) DO NOTHING;
