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
INSERT INTO HOCKY VALUES ('CN', 'Cả năm') ON CONFLICT DO NOTHING;

-- Khối lớp
INSERT INTO KHOILOP VALUES ('K10', 'Khối 10') ON CONFLICT DO NOTHING;
INSERT INTO KHOILOP VALUES ('K11', 'Khối 11') ON CONFLICT DO NOTHING;
INSERT INTO KHOILOP VALUES ('K12', 'Khối 12') ON CONFLICT DO NOTHING;

-- Lớp
-- Lớp (seed.sql sẽ tạo 12 lớp cho năm 2024-2025)
-- INSERT INTO LOP VALUES ('10A1', 'Lớp 10A1', 'K10', 45, '2024-2025') ON CONFLICT DO NOTHING;
-- INSERT INTO LOP VALUES ('10A2', 'Lớp 10A2', 'K10', 43, '2024-2025') ON CONFLICT DO NOTHING;
-- INSERT INTO LOP VALUES ('10A3', 'Lớp 10A3', 'K10', 40, '2024-2025') ON CONFLICT DO NOTHING;
-- INSERT INTO LOP VALUES ('11A1', 'Lớp 11A1', 'K11', 42, '2024-2025') ON CONFLICT DO NOTHING;
-- INSERT INTO LOP VALUES ('12A1', 'Lớp 12A1', 'K12', 44, '2024-2025') ON CONFLICT DO NOTHING;

-- Học sinh (seed.sql sẽ tạo 530 học sinh từ HS010000-HS010529)
-- INSERT INTO HOCSINH VALUES ('HS010001', 'Nguyễn Văn A', 'Nam', '2008-01-01', 'TP. HCM', 'nguyenvana@gmail.com', 'Nguyễn Văn Phụ', '0901234567') ON CONFLICT DO NOTHING;
-- INSERT INTO HOCSINH VALUES ('HS010002', 'Trần Thị B', 'Nữ', '2008-03-15', 'TP. HCM', 'tranthib@gmail.com', 'Trần Văn Huynh', '0902234567') ON CONFLICT DO NOTHING;
-- INSERT INTO HOCSINH VALUES ('HS010003', 'Lê Văn C', 'Nam', '2008-07-25', 'Đồng Nai', 'levanc@gmail.com', 'Lê Văn Đức', '0903234567') ON CONFLICT DO NOTHING;
-- INSERT INTO HOCSINH VALUES ('HS010004', 'Phạm Thị D', 'Nữ', '2008-05-10', 'Bình Dương', 'phamthid@gmail.com', 'Phạm Văn Minh', '0904234567') ON CONFLICT DO NOTHING;
-- INSERT INTO HOCSINH VALUES ('HS010005', 'Hoàng Văn E', 'Nam', '2008-11-20', 'TP. HCM', 'hoangvane@gmail.com', 'Hoàng Văn Nam', '0905234567') ON CONFLICT DO NOTHING;

-- Quá trình học (seed.sql sẽ tự động phân lớp)
-- INSERT INTO QUATRINHHOC VALUES ('HS010001', '10A1') ON CONFLICT DO NOTHING;
-- INSERT INTO QUATRINHHOC VALUES ('HS010002', '10A1') ON CONFLICT DO NOTHING;
-- INSERT INTO QUATRINHHOC VALUES ('HS010003', '10A1') ON CONFLICT DO NOTHING;
-- INSERT INTO QUATRINHHOC VALUES ('HS010004', '10A2') ON CONFLICT DO NOTHING;
-- INSERT INTO QUATRINHHOC VALUES ('HS010005', '10A2') ON CONFLICT DO NOTHING;

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

-- Tham số quy định hạnh kiểm (ngưỡng điểm xếp loại)
INSERT INTO THAMSO VALUES ('DiemHKTot', '80') ON CONFLICT DO NOTHING;
INSERT INTO THAMSO VALUES ('DiemHKKha', '65') ON CONFLICT DO NOTHING;
INSERT INTO THAMSO VALUES ('DiemHKTrungBinh', '50') ON CONFLICT DO NOTHING;
INSERT INTO THAMSO VALUES ('DiemHKYeu', '20') ON CONFLICT DO NOTHING;

-- ========== BẢNG NHẬT KÝ HỆ THỐNG (Audit log) ==========
CREATE TABLE IF NOT EXISTS NHATKY (
    id SERIAL PRIMARY KEY,
    MaNguoiDung INT REFERENCES NGUOIDUNG(MaNguoiDung),
    HanhDong VARCHAR(50) NOT NULL,
    BangMuc VARCHAR(50),
    MaDoiTuong VARCHAR(50),
    ChiTiet JSONB,
    NgayTao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Tài khoản admin mặc định (password: 123456, đã hash với bcrypt)
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro) VALUES 
('admin', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Quản trị viên', 'admin@school.edu.vn', 'ADMIN')
ON CONFLICT (TenDangNhap) DO NOTHING;

-- Thêm 18 tài khoản GVBM (2 giáo viên mỗi môn) - password: 123456 (đã hash)
INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro)
VALUES
  ('gv_toan_1', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Trần Minh Toán', 'gv_toan1@school.edu.vn', 'GVBM'),
  ('gv_toan_2', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Phạm Văn Toán', 'gv_toan2@school.edu.vn', 'GVBM'),
  ('gv_van_1', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Lê Thị Văn', 'gv_van1@school.edu.vn', 'GVBM'),
  ('gv_van_2', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Nguyễn Văn Lợi', 'gv_van2@school.edu.vn', 'GVBM'),
  ('gv_anh_1', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Hoàng Anh', 'gv_anh1@school.edu.vn', 'GVBM'),
  ('gv_anh_2', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Đặng Thị Anh Dũng', 'gv_anh2@school.edu.vn', 'GVBM'),
  ('gv_ly_1', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Phan Văn Tuấn', 'gv_ly1@school.edu.vn', 'GVBM'),
  ('gv_ly_2', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Bùi Thị Lý', 'gv_ly2@school.edu.vn', 'GVBM'),
  ('gv_hoa_1', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Trương Hoá', 'gv_hoa1@school.edu.vn', 'GVBM'),
  ('gv_hoa_2', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Ngô Thị Hóa', 'gv_hoa2@school.edu.vn', 'GVBM'),
  ('gv_sinh_1', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Lê Minh Sinh', 'gv_sinh1@school.edu.vn', 'GVBM'),
  ('gv_sinh_2', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Võ Thị Sinh', 'gv_sinh2@school.edu.vn', 'GVBM'),
  ('gv_su_1', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Đỗ Văn Sử', 'gv_su1@school.edu.vn', 'GVBM'),
  ('gv_su_2', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Phùng Thị Sử', 'gv_su2@school.edu.vn', 'GVBM'),
  ('gv_dia_1', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Hà Văn Địa', 'gv_dia1@school.edu.vn', 'GVBM'),
  ('gv_dia_2', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Trần Thị Địa', 'gv_dia2@school.edu.vn', 'GVBM'),
  ('gv_gdcd_1', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Nguyễn Văn Lâm', 'gv_gdcd1@school.edu.vn', 'GVBM'),
  ('gv_gdcd_2', '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', 'Lý Thị Tuyết', 'gv_gdcd2@school.edu.vn', 'GVBM')
ON CONFLICT (TenDangNhap) DO NOTHING;

-- Toán
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '10A1', 'TOAN', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_toan_1'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '10A1')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'TOAN')
ON CONFLICT DO NOTHING;
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '10A2', 'TOAN', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_toan_2'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '10A2')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'TOAN')
ON CONFLICT DO NOTHING;

-- Văn
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '10A3', 'VAN', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_van_1'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '10A3')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'VAN')
ON CONFLICT DO NOTHING;
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '10A4', 'VAN', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_van_2'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '10A4')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'VAN')
ON CONFLICT DO NOTHING;

-- Tiếng Anh
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '11A1', 'ANH', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_anh_1'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '11A1')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'ANH')
ON CONFLICT DO NOTHING;
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '11A2', 'ANH', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_anh_2'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '11A2')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'ANH')
ON CONFLICT DO NOTHING;

-- Vật Lý
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '11A3', 'LY', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_ly_1'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '11A3')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'LY')
ON CONFLICT DO NOTHING;
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '11A4', 'LY', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_ly_2'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '11A4')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'LY')
ON CONFLICT DO NOTHING;

-- Hóa Học
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '12A1', 'HOA', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_hoa_1'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '12A1')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'HOA')
ON CONFLICT DO NOTHING;
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '12A2', 'HOA', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_hoa_2'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '12A2')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'HOA')
ON CONFLICT DO NOTHING;

-- Sinh Học
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '12A3', 'SINH', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_sinh_1'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '12A3')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'SINH')
ON CONFLICT DO NOTHING;
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '12A4', 'SINH', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_sinh_2'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '12A4')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'SINH')
ON CONFLICT DO NOTHING;

-- Lịch Sử
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '10A1', 'SU', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_su_1'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '10A1')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'SU')
ON CONFLICT DO NOTHING;
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '10A2', 'SU', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_su_2'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '10A2')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'SU')
ON CONFLICT DO NOTHING;

-- Địa Lý
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '10A3', 'DIA', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_dia_1'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '10A3')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'DIA')
ON CONFLICT DO NOTHING;
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '10A4', 'DIA', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_dia_2'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '10A4')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'DIA')
ON CONFLICT DO NOTHING;

-- GDCD
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '11A1', 'GDCD', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_gdcd_1'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '11A1')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'GDCD')
ON CONFLICT DO NOTHING;
INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
SELECT '11A2', 'GDCD', MaNguoiDung, 'HK1', '2024-2025'
FROM NGUOIDUNG
WHERE TenDangNhap = 'gv_gdcd_2'
  AND EXISTS (SELECT 1 FROM LOP WHERE MaLop = '11A2')
  AND EXISTS (SELECT 1 FROM MONHOC WHERE MaMonHoc = 'GDCD')
ON CONFLICT DO NOTHING;

-- ========================================
-- LỚP HỌC - NĂM HỌC 2023-2024
-- ========================================
INSERT INTO LOP VALUES ('10A1', 'Lớp 10A1', 'K10', 45, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_toan_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A2', 'Lớp 10A2', 'K10', 43, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_toan_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A3', 'Lớp 10A3', 'K10', 40, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_van_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A4', 'Lớp 10A4', 'K10', 42, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_van_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A1', 'Lớp 11A1', 'K11', 42, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_anh_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A2', 'Lớp 11A2', 'K11', 40, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_anh_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A3', 'Lớp 11A3', 'K11', 41, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_ly_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A4', 'Lớp 11A4', 'K11', 44, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_ly_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A1', 'Lớp 12A1', 'K12', 44, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_hoa_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A2', 'Lớp 12A2', 'K12', 43, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_hoa_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A3', 'Lớp 12A3', 'K12', 42, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_sinh_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A4', 'Lớp 12A4', 'K12', 45, '2023-2024', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_sinh_2' LIMIT 1)) ON CONFLICT DO NOTHING;

-- ========================================
-- LỚP HỌC - NĂM HỌC 2024-2025
-- ========================================
INSERT INTO LOP VALUES ('10A1', 'Lớp 10A1', 'K10', 45, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_toan_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A2', 'Lớp 10A2', 'K10', 43, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_toan_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A3', 'Lớp 10A3', 'K10', 40, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_van_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A4', 'Lớp 10A4', 'K10', 42, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_van_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A1', 'Lớp 11A1', 'K11', 42, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_anh_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A2', 'Lớp 11A2', 'K11', 40, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_anh_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A3', 'Lớp 11A3', 'K11', 41, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_ly_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A4', 'Lớp 11A4', 'K11', 44, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_ly_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A1', 'Lớp 12A1', 'K12', 44, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_hoa_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A2', 'Lớp 12A2', 'K12', 43, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_hoa_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A3', 'Lớp 12A3', 'K12', 42, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_sinh_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A4', 'Lớp 12A4', 'K12', 45, '2024-2025', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_sinh_2' LIMIT 1)) ON CONFLICT DO NOTHING;

-- ========================================
-- LỚP HỌC - NĂM HỌC 2025-2026
-- ========================================
INSERT INTO LOP VALUES ('10A1', 'Lớp 10A1', 'K10', 45, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_toan_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A2', 'Lớp 10A2', 'K10', 43, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_toan_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A3', 'Lớp 10A3', 'K10', 40, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_van_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('10A4', 'Lớp 10A4', 'K10', 42, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_van_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A1', 'Lớp 11A1', 'K11', 42, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_anh_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A2', 'Lớp 11A2', 'K11', 40, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_anh_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A3', 'Lớp 11A3', 'K11', 41, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_ly_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('11A4', 'Lớp 11A4', 'K11', 44, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_ly_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A1', 'Lớp 12A1', 'K12', 44, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_hoa_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A2', 'Lớp 12A2', 'K12', 43, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_hoa_2' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A3', 'Lớp 12A3', 'K12', 42, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_sinh_1' LIMIT 1)) ON CONFLICT DO NOTHING;
INSERT INTO LOP VALUES ('12A4', 'Lớp 12A4', 'K12', 45, '2025-2026', (SELECT MaNguoiDung FROM NGUOIDUNG WHERE TenDangNhap = 'gv_sinh_2' LIMIT 1)) ON CONFLICT DO NOTHING;

-- ========================================
-- HỌC SINH - NĂM HỌC 2023-2024 (HS010000-HS010529: 530 học sinh)
-- ========================================
DO $$
DECLARE
  i INT;
  mas VARCHAR;
  fullname VARCHAR;
  ngaythang INT;
  nam INT;
BEGIN
  FOR i IN 0..529 LOOP
    mas := 'HS01' || LPAD(i::TEXT, 4, '0');
    fullname := (ARRAY['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đỗ', 'Hà', 'Phan', 'Bùi'])[1 + (i % 10)] || ' ' ||
                (ARRAY['Văn', 'Thị', 'Minh', 'Huy', 'Tú', 'Duy', 'Linh', 'Nam', 'Anh', 'Sơn'])[1 + ((i / 10) % 10)] || ' ' ||
                (ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K'])[1 + ((i / 100) % 10)];
    ngaythang := 1 + (i % 365);
    nam := 2006 + (i % 3);
    
    INSERT INTO HOCSINH (MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh, KhoiHienTai)
    VALUES (
      mas,
      fullname,
      CASE WHEN (i % 2) = 0 THEN 'Nam' ELSE 'Nữ' END,
      TO_DATE('2023-01-01', 'YYYY-MM-DD') + (ngaythang % 365 || ' days')::INTERVAL,
      'TP. HCM - Đường ' || (i % 100),
      LOWER(REPLACE(fullname, ' ', '.')) || i || '@student.edu.vn',
      fullname || ' (Phụ huynh)',
      '09' || LPAD((i % 100000000)::TEXT, 8, '0'),
      'K10'
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Phân lớp cho năm 2023-2024
DO $$
DECLARE
  i INT;
  mas VARCHAR;
  malop VARCHAR;
  so_hs_tren_lop INT := 45;
BEGIN
  FOR i IN 0..529 LOOP
    mas := 'HS01' || LPAD(i::TEXT, 4, '0');
    -- Phân lớp: 10A1-10A4 (170), 11A1-11A4 (167), 12A1-12A4 (193)
    IF i < 170 THEN
      malop := '10A' || (1 + ((i / 45) % 4))::TEXT;
    ELSIF i < 337 THEN
      malop := '11A' || (1 + (((i - 170) / 42) % 4))::TEXT;
    ELSE
      malop := '12A' || (1 + (((i - 337) / 44) % 4))::TEXT;
    END IF;
    
    INSERT INTO QUATRINHHOC (MaHocSinh, MaLop)
    VALUES (mas, malop) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ========================================
-- HỌC SINH - NĂM HỌC 2024-2025 (HS020000-HS020529: 530 học sinh)
-- ========================================
DO $$
DECLARE
  i INT;
  mas VARCHAR;
  fullname VARCHAR;
  ngaythang INT;
  nam INT;
BEGIN
  FOR i IN 0..529 LOOP
    mas := 'HS02' || LPAD(i::TEXT, 4, '0');
    fullname := (ARRAY['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đỗ', 'Hà', 'Phan', 'Bùi'])[1 + (i % 10)] || ' ' ||
                (ARRAY['Văn', 'Thị', 'Minh', 'Huy', 'Tú', 'Duy', 'Linh', 'Nam', 'Anh', 'Sơn'])[1 + ((i / 10) % 10)] || ' ' ||
                (ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K'])[1 + ((i / 100) % 10)];
    ngaythang := 1 + (i % 365);
    nam := 2006 + (i % 3);
    
    INSERT INTO HOCSINH (MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh, KhoiHienTai)
    VALUES (
      mas,
      fullname,
      CASE WHEN (i % 2) = 0 THEN 'Nam' ELSE 'Nữ' END,
      TO_DATE('2024-01-01', 'YYYY-MM-DD') + (ngaythang % 365 || ' days')::INTERVAL,
      'TP. HCM - Đường ' || (i % 100),
      LOWER(REPLACE(fullname, ' ', '.')) || i || '@student.edu.vn',
      fullname || ' (Phụ huynh)',
      '09' || LPAD((i % 100000000)::TEXT, 8, '0'),
      'K10'
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Phân lớp cho năm 2024-2025
DO $$
DECLARE
  i INT;
  mas VARCHAR;
  malop VARCHAR;
BEGIN
  FOR i IN 0..529 LOOP
    mas := 'HS02' || LPAD(i::TEXT, 4, '0');
    IF i < 170 THEN
      malop := '10A' || (1 + ((i / 45) % 4))::TEXT;
    ELSIF i < 337 THEN
      malop := '11A' || (1 + (((i - 170) / 42) % 4))::TEXT;
    ELSE
      malop := '12A' || (1 + (((i - 337) / 44) % 4))::TEXT;
    END IF;
    
    INSERT INTO QUATRINHHOC (MaHocSinh, MaLop)
    VALUES (mas, malop) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- ========================================
-- HỌC SINH - NĂM HỌC 2025-2026 (HS030000-HS030529: 530 học sinh)
-- ========================================
DO $$
DECLARE
  i INT;
  mas VARCHAR;
  fullname VARCHAR;
  ngaythang INT;
  nam INT;
BEGIN
  FOR i IN 0..529 LOOP
    mas := 'HS03' || LPAD(i::TEXT, 4, '0');
    fullname := (ARRAY['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Võ', 'Đỗ', 'Hà', 'Phan', 'Bùi'])[1 + (i % 10)] || ' ' ||
                (ARRAY['Văn', 'Thị', 'Minh', 'Huy', 'Tú', 'Duy', 'Linh', 'Nam', 'Anh', 'Sơn'])[1 + ((i / 10) % 10)] || ' ' ||
                (ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K'])[1 + ((i / 100) % 10)];
    ngaythang := 1 + (i % 365);
    nam := 2006 + (i % 3);
    
    INSERT INTO HOCSINH (MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh, KhoiHienTai)
    VALUES (
      mas,
      fullname,
      CASE WHEN (i % 2) = 0 THEN 'Nam' ELSE 'Nữ' END,
      TO_DATE('2025-01-01', 'YYYY-MM-DD') + (ngaythang % 365 || ' days')::INTERVAL,
      'TP. HCM - Đường ' || (i % 100),
      LOWER(REPLACE(fullname, ' ', '.')) || i || '@student.edu.vn',
      fullname || ' (Phụ huynh)',
      '09' || LPAD((i % 100000000)::TEXT, 8, '0'),
      'K10'
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- Phân lớp cho năm 2025-2026
DO $$
DECLARE
  i INT;
  mas VARCHAR;
  malop VARCHAR;
BEGIN
  FOR i IN 0..529 LOOP
    mas := 'HS03' || LPAD(i::TEXT, 4, '0');
    IF i < 170 THEN
      malop := '10A' || (1 + ((i / 45) % 4))::TEXT;
    ELSIF i < 337 THEN
      malop := '11A' || (1 + (((i - 170) / 42) % 4))::TEXT;
    ELSE
      malop := '12A' || (1 + (((i - 337) / 44) % 4))::TEXT;
    END IF;
    
    INSERT INTO QUATRINHHOC (MaHocSinh, MaLop)
    VALUES (mas, malop) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

COMMIT;


-- ========================================
-- HIỂN THỊ THÔNG BÁO HOÀN TẤT
-- ========================================
SELECT '✓ Database đã được khởi tạo thành công!' AS Status;
