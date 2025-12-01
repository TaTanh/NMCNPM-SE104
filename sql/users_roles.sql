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

-- Thêm các vai trò mặc định
INSERT INTO VAITRO (MaVaiTro, TenVaiTro, Quyen, MoTa) VALUES 
('ADMIN', 'Quản trị viên', '{"all": true, "quanlyHocSinh": true, "quanlyLop": true, "quanlyMonHoc": true, "nhapDiem": true, "baoCao": true, "caiDat": true, "phanQuyen": true}', 'Có tất cả quyền trong hệ thống'),
('TEACHER', 'Giáo viên', '{"quanlyHocSinh": false, "quanlyLop": false, "quanlyMonHoc": false, "nhapDiem": true, "baoCao": true, "caiDat": false, "phanQuyen": false}', 'Có thể nhập điểm và xem báo cáo'),
('STUDENT', 'Học sinh', '{"quanlyHocSinh": false, "quanlyLop": false, "quanlyMonHoc": false, "nhapDiem": false, "baoCao": false, "caiDat": false, "phanQuyen": false, "xemDiem": true}', 'Chỉ xem điểm của mình')
ON CONFLICT (MaVaiTro) DO NOTHING;

-- Thêm tài khoản admin mặc định
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('admin', 'admin123', 'Quản trị viên', 'admin@school.edu.vn', 'ADMIN')
ON CONFLICT (TenDangNhap) DO NOTHING;

-- Thêm một số tài khoản mẫu
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('gv01', '123456', 'Nguyễn Văn A', 'gv01@school.edu.vn', 'TEACHER'),
('hs001', '123456', 'Trần Thị B', 'hs001@school.edu.vn', 'STUDENT')
ON CONFLICT (TenDangNhap) DO NOTHING;
