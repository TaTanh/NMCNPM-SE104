-- ========================================
-- SCRIPT TẠO DATABASE QUẢN LÝ HỌC SINH
-- PostgreSQL
-- ========================================

-- Tạo database (chạy riêng nếu cần)
-- CREATE DATABASE student_management;

-- ========== BẢNG VAI TRÒ (TẠO TRƯỚC) ==========
CREATE TABLE IF NOT EXISTS VAITRO (
    MaVaiTro VARCHAR(20) PRIMARY KEY,
    TenVaiTro VARCHAR(50) NOT NULL,
    Quyen JSONB DEFAULT '{}',
    MoTa TEXT
);

-- ========== BẢNG NGƯỜI DÙNG (TẠO TRƯỚC) ==========
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

-- ========== BẢNG NĂM HỌC ==========
CREATE TABLE IF NOT EXISTS NAMHOC (
    MaNamHoc VARCHAR(20) PRIMARY KEY,
    TenNamHoc VARCHAR(50) NOT NULL
);

-- ========== BẢNG HỌC KỲ ==========
CREATE TABLE IF NOT EXISTS HOCKY (
    MaHocKy VARCHAR(10) PRIMARY KEY,
    TenHocKy VARCHAR(50) NOT NULL
);

-- ========== BẢNG KHỐI LỚP ==========
CREATE TABLE IF NOT EXISTS KHOILOP (
    MaKhoiLop VARCHAR(10) PRIMARY KEY,
    TenKhoiLop VARCHAR(50) NOT NULL
);

-- ========== BẢNG LỚP ==========
CREATE TABLE IF NOT EXISTS LOP (
    MaLop VARCHAR(20) PRIMARY KEY,
    TenLop VARCHAR(50) NOT NULL,
    MaKhoiLop VARCHAR(10) REFERENCES KHOILOP(MaKhoiLop),
    SiSo INT DEFAULT 0,
    MaNamHoc VARCHAR(20) REFERENCES NAMHOC(MaNamHoc),
    MaGVCN INT REFERENCES NGUOIDUNG(MaNguoiDung)
);

-- ========== BẢNG HỌC SINH ==========
CREATE TABLE IF NOT EXISTS HOCSINH (
    MaHocSinh VARCHAR(20) PRIMARY KEY,
    HoTen VARCHAR(100) NOT NULL,
    GioiTinh VARCHAR(10),
    NgaySinh DATE,
    DiaChi VARCHAR(200),
    Email VARCHAR(100),
    HoTenPhuHuynh VARCHAR(100),
    SdtPhuHuynh VARCHAR(20),
    KhoiHienTai VARCHAR(10) -- Khối học sinh hiện đang học (K10, K11, K12, hoặc NULL nếu chưa vào trường)
);

-- ========== BẢNG QUÁ TRÌNH HỌC ==========
CREATE TABLE IF NOT EXISTS QUATRINHHOC (
    MaHocSinh VARCHAR(20) REFERENCES HOCSINH(MaHocSinh) ON DELETE CASCADE,
    MaLop VARCHAR(20) REFERENCES LOP(MaLop) ON DELETE CASCADE,
    PRIMARY KEY (MaHocSinh, MaLop)
);

-- ========== BẢNG MÔN HỌC ==========
CREATE TABLE IF NOT EXISTS MONHOC (
    MaMonHoc VARCHAR(20) PRIMARY KEY,
    TenMonHoc VARCHAR(100) NOT NULL,
    HeSo INT DEFAULT 1
);

-- ========== BẢNG HẠNH KIỂM ==========
CREATE TABLE IF NOT EXISTS HANHKIEM (
    MaHocSinh VARCHAR(20) REFERENCES HOCSINH(MaHocSinh) ON DELETE CASCADE,
    MaNamHoc VARCHAR(20) REFERENCES NAMHOC(MaNamHoc),
    MaHocKy VARCHAR(10) REFERENCES HOCKY(MaHocKy),
    XepLoai VARCHAR(20) CHECK (XepLoai IN ('Tốt', 'Khá', 'Trung bình', 'Yếu')),
    GhiChu TEXT,
    PRIMARY KEY (MaHocSinh, MaNamHoc, MaHocKy)
);

-- ========== BẢNG GIẢNG DẠY ==========
CREATE TABLE IF NOT EXISTS GIANGDAY (
    MaLop VARCHAR(20) REFERENCES LOP(MaLop) ON DELETE CASCADE,
    MaMonHoc VARCHAR(20) REFERENCES MONHOC(MaMonHoc),
    MaGiaoVien INT REFERENCES NGUOIDUNG(MaNguoiDung),
    MaHocKy VARCHAR(10) REFERENCES HOCKY(MaHocKy),
    MaNamHoc VARCHAR(20) REFERENCES NAMHOC(MaNamHoc),
    TuNgay DATE,
    DenNgay DATE,
    PRIMARY KEY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
);

-- ========== BẢNG LOẠI HÌNH KIỂM TRA ==========
CREATE TABLE IF NOT EXISTS LOAIHINHKIEMTRA (
    MaLHKT VARCHAR(20) PRIMARY KEY,
    TenLHKT VARCHAR(50) NOT NULL,
    HeSo INT DEFAULT 1
);

-- ========== BẢNG ĐIỂM MÔN ==========
CREATE TABLE IF NOT EXISTS BANGDIEMMON (
    MaBangDiem VARCHAR(50) PRIMARY KEY,
    MaLop VARCHAR(20) REFERENCES LOP(MaLop),
    MaMonHoc VARCHAR(20) REFERENCES MONHOC(MaMonHoc),
    MaHocKy VARCHAR(10) REFERENCES HOCKY(MaHocKy)
);

-- ========== CHI TIẾT BẢNG ĐIỂM - LOẠI HÌNH KIỂM TRA ==========
CREATE TABLE IF NOT EXISTS CT_BANGDIEMMON_LHKT (
    MaBangDiem VARCHAR(50) REFERENCES BANGDIEMMON(MaBangDiem) ON DELETE CASCADE,
    MaLHKT VARCHAR(20) REFERENCES LOAIHINHKIEMTRA(MaLHKT),
    SoCot INT DEFAULT 1,
    PRIMARY KEY (MaBangDiem, MaLHKT)
);

-- ========== CHI TIẾT BẢNG ĐIỂM - HỌC SINH ==========
CREATE TABLE IF NOT EXISTS CT_BANGDIEMMON_HOCSINH (
    MaBangDiem VARCHAR(50) REFERENCES BANGDIEMMON(MaBangDiem) ON DELETE CASCADE,
    MaHocSinh VARCHAR(20) REFERENCES HOCSINH(MaHocSinh) ON DELETE CASCADE,
    MaLHKT VARCHAR(20) REFERENCES LOAIHINHKIEMTRA(MaLHKT),
    Diem DECIMAL(4,2) CHECK (Diem >= 0 AND Diem <= 10),
    PRIMARY KEY (MaBangDiem, MaHocSinh, MaLHKT)
);

-- ========== BẢNG BÁO CÁO TỔNG KẾT MÔN ==========
CREATE TABLE IF NOT EXISTS BAOCAOTONGKETMON (
    MaBaoCao VARCHAR(50) PRIMARY KEY,
    MaMonHoc VARCHAR(20) REFERENCES MONHOC(MaMonHoc),
    MaHocKy VARCHAR(10) REFERENCES HOCKY(MaHocKy)
);

-- ========== CHI TIẾT BÁO CÁO TỔNG KẾT MÔN ==========
CREATE TABLE IF NOT EXISTS CT_BCTKM (
    MaBaoCao VARCHAR(50) REFERENCES BAOCAOTONGKETMON(MaBaoCao) ON DELETE CASCADE,
    MaLop VARCHAR(20) REFERENCES LOP(MaLop),
    SoLuongDat INT DEFAULT 0,
    TiLe DECIMAL(5,2) DEFAULT 0,
    PRIMARY KEY (MaBaoCao, MaLop)
);

-- ========== BẢNG BÁO CÁO TỔNG KẾT HỌC KỲ ==========
CREATE TABLE IF NOT EXISTS BAOCAOTONGKETHOCKY (
    MaBaoCao VARCHAR(50) PRIMARY KEY,
    MaLop VARCHAR(20) REFERENCES LOP(MaLop),
    MaHocKy VARCHAR(10) REFERENCES HOCKY(MaHocKy),
    SoLuongDat INT DEFAULT 0,
    TiLe DECIMAL(5,2) DEFAULT 0
);

-- ========== BẢNG THAM SỐ ==========
CREATE TABLE IF NOT EXISTS THAMSO (
    TenThamSo VARCHAR(50) PRIMARY KEY,
    GiaTri VARCHAR(100)
);


-- ========================================
-- DỮ LIỆU MẪU
-- ========================================

-- Năm học
INSERT INTO NAMHOC VALUES ('2023-2024', '2023–2024') ON CONFLICT DO NOTHING;
INSERT INTO NAMHOC VALUES ('2024-2025', '2024–2025') ON CONFLICT DO NOTHING;
INSERT INTO NAMHOC VALUES ('2025-2026', '2025–2026') ON CONFLICT DO NOTHING;

-- Học kỳ
INSERT INTO HOCKY VALUES ('HK1', 'Học kỳ 1') ON CONFLICT DO NOTHING;
INSERT INTO HOCKY VALUES ('HK2', 'Học kỳ 2') ON CONFLICT DO NOTHING;

-- Khối lớp
INSERT INTO KHOILOP VALUES ('K10', 'Khối 10') ON CONFLICT DO NOTHING;
INSERT INTO KHOILOP VALUES ('K11', 'Khối 11') ON CONFLICT DO NOTHING;
INSERT INTO KHOILOP VALUES ('K12', 'Khối 12') ON CONFLICT DO NOTHING;

-- Lớp
INSERT INTO LOP VALUES ('10A1', 'Lớp 10A1', 'K10', 45, '2024-2025') ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A2', 'Lớp 10A2', 'K10', 43, '2024-2025') ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A3', 'Lớp 10A3', 'K10', 40, '2024-2025') ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A1', 'Lớp 11A1', 'K11', 42, '2024-2025') ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A1', 'Lớp 12A1', 'K12', 44, '2024-2025') ON CONFLICT DO NOTHING;

-- Học sinh
INSERT INTO HOCSINH VALUES ('HS010001', 'Nguyễn Văn A', 'Nam', '2008-01-01', 'TP. HCM', 'nguyenvana@gmail.com', 'Nguyễn Văn Phụ', '0901234567') ON CONFLICT DO NOTHING;
INSERT INTO HOCSINH VALUES ('HS010002', 'Trần Thị B', 'Nữ', '2008-03-15', 'TP. HCM', 'tranthib@gmail.com', 'Trần Văn Huynh', '0902234567') ON CONFLICT DO NOTHING;
INSERT INTO HOCSINH VALUES ('HS010003', 'Lê Văn C', 'Nam', '2008-07-25', 'Đồng Nai', 'levanc@gmail.com', 'Lê Văn Đức', '0903234567') ON CONFLICT DO NOTHING;
INSERT INTO HOCSINH VALUES ('HS010004', 'Phạm Thị D', 'Nữ', '2008-05-10', 'Bình Dương', 'phamthid@gmail.com', 'Phạm Văn Minh', '0904234567') ON CONFLICT DO NOTHING;
INSERT INTO HOCSINH VALUES ('HS010005', 'Hoàng Văn E', 'Nam', '2008-11-20', 'TP. HCM', 'hoangvane@gmail.com', 'Hoàng Văn Nam', '0905234567') ON CONFLICT DO NOTHING;

-- Quá trình học (gắn học sinh vào lớp)
INSERT INTO QUATRINHHOC VALUES ('HS010001', '10A1') ON CONFLICT DO NOTHING;
INSERT INTO QUATRINHHOC VALUES ('HS010002', '10A1') ON CONFLICT DO NOTHING;
INSERT INTO QUATRINHHOC VALUES ('HS010003', '10A1') ON CONFLICT DO NOTHING;
INSERT INTO QUATRINHHOC VALUES ('HS010004', '10A2') ON CONFLICT DO NOTHING;
INSERT INTO QUATRINHHOC VALUES ('HS010005', '10A2') ON CONFLICT DO NOTHING;

-- Môn học
INSERT INTO MONHOC VALUES ('TOAN', 'Toán', 2) ON CONFLICT DO NOTHING;
INSERT INTO MONHOC VALUES ('VAN', 'Ngữ Văn', 2) ON CONFLICT DO NOTHING;
INSERT INTO MONHOC VALUES ('ANH', 'Tiếng Anh', 2) ON CONFLICT DO NOTHING;
INSERT INTO MONHOC VALUES ('LY', 'Vật Lý', 2) ON CONFLICT DO NOTHING;
INSERT INTO MONHOC VALUES ('HOA', 'Hóa Học', 2) ON CONFLICT DO NOTHING;
INSERT INTO MONHOC VALUES ('SINH', 'Sinh Học', 1) ON CONFLICT DO NOTHING;
INSERT INTO MONHOC VALUES ('SU', 'Lịch Sử', 1) ON CONFLICT DO NOTHING;
INSERT INTO MONHOC VALUES ('DIA', 'Địa Lý', 1) ON CONFLICT DO NOTHING;
INSERT INTO MONHOC VALUES ('GDCD', 'Giáo Dục Công Dân', 1) ON CONFLICT DO NOTHING;

-- Loại hình kiểm tra: 1 GK + 1 CK + 4 Thường xuyên (tối đa 6 cột)
INSERT INTO LOAIHINHKIEMTRA VALUES ('TX1', 'Thường xuyên 1', 1) ON CONFLICT DO NOTHING;
INSERT INTO LOAIHINHKIEMTRA VALUES ('TX2', 'Thường xuyên 2', 1) ON CONFLICT DO NOTHING;
INSERT INTO LOAIHINHKIEMTRA VALUES ('TX3', 'Thường xuyên 3', 1) ON CONFLICT DO NOTHING;
INSERT INTO LOAIHINHKIEMTRA VALUES ('TX4', 'Thường xuyên 4', 1) ON CONFLICT DO NOTHING;
INSERT INTO LOAIHINHKIEMTRA VALUES ('GK', 'Thi giữa kỳ', 2) ON CONFLICT DO NOTHING;
INSERT INTO LOAIHINHKIEMTRA VALUES ('CK', 'Thi cuối kỳ', 3) ON CONFLICT DO NOTHING;

-- Tham số hệ thống
INSERT INTO THAMSO VALUES ('TuoiToiThieu', '15') ON CONFLICT DO NOTHING;
INSERT INTO THAMSO VALUES ('TuoiToiDa', '20') ON CONFLICT DO NOTHING;
INSERT INTO THAMSO VALUES ('SiSoToiDa', '40') ON CONFLICT DO NOTHING;
INSERT INTO THAMSO VALUES ('DiemDatMon', '5') ON CONFLICT DO NOTHING;
INSERT INTO THAMSO VALUES ('MaxHocSinhMotKhoa', '999') ON CONFLICT DO NOTHING;
INSERT INTO THAMSO VALUES ('MaxHocSinhHeThong', '1600') ON CONFLICT DO NOTHING;
INSERT INTO THAMSO VALUES ('MaxCotThuongXuyen', '4') ON CONFLICT DO NOTHING;

-- =============================================
-- VAI TRÒ VÀ NGƯỜI DÙNG
-- =============================================

-- Thêm vai trò
INSERT INTO VAITRO (MaVaiTro, TenVaiTro, Quyen, MoTa) VALUES 
('ADMIN', 'Quản trị viên', '{"all": true, "quanlyHocSinh": true, "quanlyLop": true, "quanlyMonHoc": true, "nhapDiem": true, "xemDiem": true, "nhapHanhKiem": true, "xemTongKetLop": true, "xemThongTinHS": true, "baoCao": true, "caiDat": true, "phanQuyen": true}', 'Có tất cả quyền'),
('GVCN', 'Giáo viên chủ nhiệm', '{"nhapDiem": true, "xemDiem": true, "nhapHanhKiem": true, "xemTongKetLop": true, "xemThongTinHS": true}', 'Nhập điểm, hạnh kiểm lớp chủ nhiệm'),
('GVBM', 'Giáo viên bộ môn', '{"nhapDiem": true, "xemDiem": true}', 'Chỉ nhập điểm môn dạy'),
('STUDENT', 'Học sinh', '{"xemDiem": true}', 'Chỉ xem điểm của mình')
ON CONFLICT (MaVaiTro) DO UPDATE SET TenVaiTro = EXCLUDED.TenVaiTro, Quyen = EXCLUDED.Quyen, MoTa = EXCLUDED.MoTa;

-- Tài khoản admin mặc định
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('admin', 'admin123', 'Quản trị viên', 'admin@school.edu.vn', 'ADMIN')
ON CONFLICT (TenDangNhap) DO NOTHING;

-- Giáo viên mẫu
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('gvcn1', '123456', 'Nguyễn Văn Thành', 'gvcn01@school.edu.vn', 'GVCN'),
('gvbm1', '123456', 'Lê Văn Đức', 'gvbm01@school.edu.vn', 'GVBM')
ON CONFLICT (TenDangNhap) DO NOTHING;

-- ========================================
-- HIỂN THỊ THÔNG BÁO HOÀN TẤT
-- ========================================
SELECT '✓ Database đã được khởi tạo thành công!' AS Status;
