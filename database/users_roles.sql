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
-- THÊM 4 VAI TRÒ: ADMIN, GVCN, GVBM, HỌC SINH
-- =============================================
INSERT INTO VAITRO (MaVaiTro, TenVaiTro, Quyen, MoTa) VALUES 
('ADMIN', 'Quản trị viên', '{"all": true, "quanlyHocSinh": true, "quanlyLop": true, "quanlyMonHoc": true, "nhapDiem": true, "xemDiem": true, "nhapHanhKiem": true, "xemTongKetLop": true, "xemThongTinHS": true, "baoCao": true, "caiDat": true, "phanQuyen": true}', 'Có tất cả quyền: quản lý hệ thống, phân quyền, nhập điểm, nhập hạnh kiểm'),

('GVCN', 'Giáo viên chủ nhiệm', '{"quanlyHocSinh": false, "quanlyLop": false, "quanlyMonHoc": false, "nhapDiem": true, "xemDiem": true, "nhapHanhKiem": true, "xemTongKetLop": true, "xemThongTinHS": true, "baoCao": false, "caiDat": false, "phanQuyen": false}', 'Nhập điểm môn mình dạy, nhập hạnh kiểm lớp chủ nhiệm, xem tổng kết lớp'),

('GVBM', 'Giáo viên bộ môn', '{"quanlyHocSinh": false, "quanlyLop": false, "quanlyMonHoc": false, "nhapDiem": true, "xemDiem": true, "nhapHanhKiem": false, "xemTongKetLop": false, "xemThongTinHS": false, "baoCao": false, "caiDat": false, "phanQuyen": false}', 'Chỉ nhập điểm môn mình dạy'),

('STUDENT', 'Học sinh', '{"quanlyHocSinh": false, "quanlyLop": false, "quanlyMonHoc": false, "nhapDiem": false, "xemDiem": true, "nhapHanhKiem": false, "xemTongKetLop": false, "xemThongTinHS": false, "baoCao": false, "caiDat": false, "phanQuyen": false}', 'Chỉ xem điểm và hạnh kiểm của mình')

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

-- Giáo viên chủ nhiệm mẫu
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('gvcn1', '123456', 'Nguyễn Văn Thành', 'gvcn01@school.edu.vn', 'GVCN'),
('gvcn2', '123456', 'Trần Thị Lan', 'gvcn02@school.edu.vn', 'GVCN')
ON CONFLICT (TenDangNhap) DO NOTHING;

-- Giáo viên bộ môn mẫu
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('gvbm1', '123456', 'Lê Văn Đức', 'gvbm01@school.edu.vn', 'GVBM'),
('gvbm2', '123456', 'Phạm Thị Hoa', 'gvbm02@school.edu.vn', 'GVBM')
ON CONFLICT (TenDangNhap) DO NOTHING;

-- Học sinh mẫu
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('hs010001', '123456', 'Nguyễn Văn A', 'hs010001@school.edu.vn', 'STUDENT'),
('hs010002', '123456', 'Trần Thị B', 'hs010002@school.edu.vn', 'STUDENT')
ON CONFLICT (TenDangNhap) DO NOTHING;
