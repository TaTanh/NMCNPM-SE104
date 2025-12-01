-- =====================================================
-- FILE: regulations.sql
-- MỤC ĐÍCH: Thiết lập các quy định cho hệ thống QLHS
-- =====================================================

-- ========== BẢNG THAM SỐ (PARAMETERS) ==========
-- Tạo bảng nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS THAMSO (
    TenThamSo VARCHAR(50) PRIMARY KEY,
    GiaTri DECIMAL(10,2) NOT NULL,
    MoTa VARCHAR(255)
);

-- ========== QĐ1: Tuổi học sinh từ 15 đến 20 ==========
INSERT INTO THAMSO (TenThamSo, GiaTri, MoTa) VALUES 
    ('TuoiToiThieu', 15, 'Tuổi tối thiểu của học sinh khi nhập học'),
    ('TuoiToiDa', 20, 'Tuổi tối đa của học sinh khi nhập học')
ON CONFLICT (TenThamSo) DO UPDATE SET GiaTri = EXCLUDED.GiaTri;

-- ========== QĐ3: Sĩ số tối đa mỗi lớp là 40 ==========
INSERT INTO THAMSO (TenThamSo, GiaTri, MoTa) VALUES 
    ('SiSoToiDa', 40, 'Sĩ số tối đa của mỗi lớp học')
ON CONFLICT (TenThamSo) DO UPDATE SET GiaTri = EXCLUDED.GiaTri;

-- ========== QĐ6: Điểm từ 0 đến 10 ==========
INSERT INTO THAMSO (TenThamSo, GiaTri, MoTa) VALUES 
    ('DiemToiThieu', 0, 'Điểm tối thiểu'),
    ('DiemToiDa', 10, 'Điểm tối đa')
ON CONFLICT (TenThamSo) DO UPDATE SET GiaTri = EXCLUDED.GiaTri;

-- ========== QĐ7: Điểm đạt môn >= 5 ==========
INSERT INTO THAMSO (TenThamSo, GiaTri, MoTa) VALUES 
    ('DiemDatMon', 5, 'Điểm trung bình tối thiểu để đạt môn'),
    ('DiemDat', 5, 'Điểm tổng kết tối thiểu để đạt')
ON CONFLICT (TenThamSo) DO UPDATE SET GiaTri = EXCLUDED.GiaTri;

-- ========== QĐ2: Mỗi năm có 2 học kỳ ==========
CREATE TABLE IF NOT EXISTS HOCKY (
    MaHocKy VARCHAR(10) PRIMARY KEY,
    TenHocKy VARCHAR(50) NOT NULL
);

INSERT INTO HOCKY (MaHocKy, TenHocKy) VALUES 
    ('HK1', 'Học kỳ I'),
    ('HK2', 'Học kỳ II')
ON CONFLICT (MaHocKy) DO NOTHING;

-- ========== QĐ3: Khối lớp (10, 11, 12) ==========
CREATE TABLE IF NOT EXISTS KHOILOP (
    MaKhoiLop VARCHAR(10) PRIMARY KEY,
    TenKhoiLop VARCHAR(50) NOT NULL
);

INSERT INTO KHOILOP (MaKhoiLop, TenKhoiLop) VALUES 
    ('K10', 'Khối 10'),
    ('K11', 'Khối 11'),
    ('K12', 'Khối 12')
ON CONFLICT (MaKhoiLop) DO NOTHING;

-- ========== NĂM HỌC ==========
CREATE TABLE IF NOT EXISTS NAMHOC (
    MaNamHoc VARCHAR(10) PRIMARY KEY,
    TenNamHoc VARCHAR(20) NOT NULL
);

INSERT INTO NAMHOC (MaNamHoc, TenNamHoc) VALUES 
    ('2024-2025', '2024–2025'),
    ('2025-2026', '2025–2026')
ON CONFLICT (MaNamHoc) DO NOTHING;

-- ========== QĐ5: 9 môn học mặc định ==========
CREATE TABLE IF NOT EXISTS MONHOC (
    MaMonHoc VARCHAR(10) PRIMARY KEY,
    TenMonHoc VARCHAR(50) NOT NULL
);

INSERT INTO MONHOC (MaMonHoc, TenMonHoc) VALUES 
    ('TOAN', 'Toán'),
    ('LY', 'Vật Lý'),
    ('HOA', 'Hóa Học'),
    ('SINH', 'Sinh Học'),
    ('SU', 'Lịch Sử'),
    ('DIA', 'Địa Lý'),
    ('VAN', 'Ngữ Văn'),
    ('GDCD', 'Đạo Đức'),
    ('TD', 'Thể Dục')
ON CONFLICT (MaMonHoc) DO NOTHING;

-- ========== QĐ6: Loại hình kiểm tra & Hệ số ==========
CREATE TABLE IF NOT EXISTS LOAIHINHKIEMTRA (
    MaLHKT VARCHAR(10) PRIMARY KEY,
    TenLHKT VARCHAR(50) NOT NULL,
    HeSo INT NOT NULL DEFAULT 1
);

INSERT INTO LOAIHINHKIEMTRA (MaLHKT, TenLHKT, HeSo) VALUES 
    ('15P', 'Kiểm tra 15 phút', 1),
    ('GK', 'Thi giữa kỳ', 2),
    ('HK', 'Thi học kỳ', 3)
ON CONFLICT (MaLHKT) DO UPDATE SET HeSo = EXCLUDED.HeSo;

-- ========== BẢNG LỚP (với constraint sĩ số) ==========
CREATE TABLE IF NOT EXISTS LOP (
    MaLop VARCHAR(10) PRIMARY KEY,
    TenLop VARCHAR(50) NOT NULL,
    MaKhoiLop VARCHAR(10) REFERENCES KHOILOP(MaKhoiLop),
    SiSo INT DEFAULT 0,
    MaNamHoc VARCHAR(10) REFERENCES NAMHOC(MaNamHoc)
);

-- ========== LỚP MẪU THEO CẤU TRÚC QĐ3 ==========
-- Khối 10: 10A1–10A4
INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc) VALUES 
    ('10A1-2425', '10A1', 'K10', 0, '2024-2025'),
    ('10A2-2425', '10A2', 'K10', 0, '2024-2025'),
    ('10A3-2425', '10A3', 'K10', 0, '2024-2025'),
    ('10A4-2425', '10A4', 'K10', 0, '2024-2025')
ON CONFLICT (MaLop) DO NOTHING;

-- Khối 11: 11A1–11A3
INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc) VALUES 
    ('11A1-2425', '11A1', 'K11', 0, '2024-2025'),
    ('11A2-2425', '11A2', 'K11', 0, '2024-2025'),
    ('11A3-2425', '11A3', 'K11', 0, '2024-2025')
ON CONFLICT (MaLop) DO NOTHING;

-- Khối 12: 12A1–12A2
INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc) VALUES 
    ('12A1-2425', '12A1', 'K12', 0, '2024-2025'),
    ('12A2-2425', '12A2', 'K12', 0, '2024-2025')
ON CONFLICT (MaLop) DO NOTHING;

-- ========== BẢNG HỌC SINH ==========
CREATE TABLE IF NOT EXISTS HOCSINH (
    MaHocSinh VARCHAR(20) PRIMARY KEY,
    HoTen VARCHAR(100) NOT NULL,
    GioiTinh VARCHAR(10),
    NgaySinh DATE,
    DiaChi VARCHAR(255),
    Email VARCHAR(100)
);

-- ========== BẢNG QUÁ TRÌNH HỌC (gán HS vào lớp) ==========
CREATE TABLE IF NOT EXISTS QUATRINHHOC (
    MaHocSinh VARCHAR(20) REFERENCES HOCSINH(MaHocSinh),
    MaLop VARCHAR(10) REFERENCES LOP(MaLop),
    PRIMARY KEY (MaHocSinh, MaLop)
);

-- ========== BẢNG ĐIỂM MÔN ==========
CREATE TABLE IF NOT EXISTS BANGDIEMMON (
    MaBangDiem VARCHAR(50) PRIMARY KEY,
    MaLop VARCHAR(10) REFERENCES LOP(MaLop),
    MaMonHoc VARCHAR(10) REFERENCES MONHOC(MaMonHoc),
    MaHocKy VARCHAR(10) REFERENCES HOCKY(MaHocKy)
);

-- ========== CHI TIẾT ĐIỂM HỌC SINH ==========
CREATE TABLE IF NOT EXISTS CT_BANGDIEMMON_HOCSINH (
    MaBangDiem VARCHAR(50) REFERENCES BANGDIEMMON(MaBangDiem),
    MaHocSinh VARCHAR(20) REFERENCES HOCSINH(MaHocSinh),
    MaLHKT VARCHAR(10) REFERENCES LOAIHINHKIEMTRA(MaLHKT),
    Diem DECIMAL(4,2),
    PRIMARY KEY (MaBangDiem, MaHocSinh, MaLHKT),
    CONSTRAINT chk_diem CHECK (Diem >= 0 AND Diem <= 10)
);

-- ========== VIEW: Hiển thị tóm tắt quy định ==========
CREATE OR REPLACE VIEW V_QUIDINH AS
SELECT 
    'QĐ1' as MaQD,
    'Tuổi học sinh' as TenQD,
    CONCAT('Từ ', (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'TuoiToiThieu'), 
           ' đến ', (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'TuoiToiDa'), ' tuổi') as GiaTri
UNION ALL
SELECT 'QĐ2', 'Số học kỳ', CONCAT((SELECT COUNT(*) FROM HOCKY), ' học kỳ/năm')
UNION ALL
SELECT 'QĐ3', 'Sĩ số tối đa', CONCAT((SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'SiSoToiDa'), ' HS/lớp')
UNION ALL
SELECT 'QĐ5', 'Số môn học', CONCAT((SELECT COUNT(*) FROM MONHOC), ' môn')
UNION ALL
SELECT 'QĐ6', 'Thang điểm', CONCAT('Từ ', (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemToiThieu'),
           ' đến ', (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemToiDa'))
UNION ALL
SELECT 'QĐ7', 'Điểm đạt môn', CONCAT('TB >= ', (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemDatMon'));

-- ========== FUNCTION: Tính tuổi học sinh ==========
CREATE OR REPLACE FUNCTION fn_TinhTuoi(ngay_sinh DATE) 
RETURNS INT AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(CURRENT_DATE, ngay_sinh));
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Kiểm tra tuổi hợp lệ ==========
CREATE OR REPLACE FUNCTION fn_KiemTraTuoi(ngay_sinh DATE) 
RETURNS BOOLEAN AS $$
DECLARE
    tuoi INT;
    tuoi_min INT;
    tuoi_max INT;
BEGIN
    tuoi := fn_TinhTuoi(ngay_sinh);
    SELECT GiaTri INTO tuoi_min FROM THAMSO WHERE TenThamSo = 'TuoiToiThieu';
    SELECT GiaTri INTO tuoi_max FROM THAMSO WHERE TenThamSo = 'TuoiToiDa';
    
    RETURN tuoi >= tuoi_min AND tuoi <= tuoi_max;
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Tính điểm trung bình môn ==========
CREATE OR REPLACE FUNCTION fn_TinhDiemTB(ma_bang_diem VARCHAR, ma_hoc_sinh VARCHAR) 
RETURNS DECIMAL(4,1) AS $$
DECLARE
    tong_diem DECIMAL(10,2) := 0;
    tong_he_so INT := 0;
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT ct.Diem, lhkt.HeSo 
        FROM CT_BANGDIEMMON_HOCSINH ct
        JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
        WHERE ct.MaBangDiem = ma_bang_diem AND ct.MaHocSinh = ma_hoc_sinh
    LOOP
        tong_diem := tong_diem + (rec.Diem * rec.HeSo);
        tong_he_so := tong_he_so + rec.HeSo;
    END LOOP;
    
    IF tong_he_so = 0 THEN
        RETURN NULL;
    END IF;
    
    -- Làm tròn 0.1
    RETURN ROUND(tong_diem / tong_he_so, 1);
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Kiểm tra đạt môn ==========
CREATE OR REPLACE FUNCTION fn_KiemTraDatMon(diem_tb DECIMAL) 
RETURNS BOOLEAN AS $$
DECLARE
    diem_dat DECIMAL;
BEGIN
    SELECT GiaTri INTO diem_dat FROM THAMSO WHERE TenThamSo = 'DiemDatMon';
    RETURN diem_tb >= diem_dat;
END;
$$ LANGUAGE plpgsql;

-- Thông báo hoàn thành
SELECT 'Đã thiết lập các quy định thành công!' as Message;
SELECT * FROM V_QUIDINH;
