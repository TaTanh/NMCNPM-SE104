-- =====================================================
-- FILE: regulations.sql
-- MỤC ĐÍCH: Thiết lập các quy định cho hệ thống QLHS
-- CHÚ Ý: Chạy file này SAU khi đã chạy init.sql
-- =====================================================

-- ========== CẬP NHẬT THÊM THAM SỐ ==========
-- Thêm mô tả cho các tham số đã có
ALTER TABLE THAMSO ADD COLUMN IF NOT EXISTS MoTa VARCHAR(255);

-- Cập nhật mô tả cho các tham số hiện có
UPDATE THAMSO SET MoTa = 'Tuổi tối thiểu của học sinh khi nhập học' WHERE TenThamSo = 'TuoiToiThieu';
UPDATE THAMSO SET MoTa = 'Tuổi tối đa của học sinh khi nhập học' WHERE TenThamSo = 'TuoiToiDa';
UPDATE THAMSO SET MoTa = 'Sĩ số tối đa của mỗi lớp học' WHERE TenThamSo = 'SiSoToiDa';
UPDATE THAMSO SET MoTa = 'Điểm trung bình tối thiểu để đạt môn' WHERE TenThamSo = 'DiemDatMon';

-- Thêm các tham số mới nếu chưa có
INSERT INTO THAMSO (TenThamSo, GiaTri, MoTa) VALUES 
    ('DiemToiThieu', '0', 'Điểm tối thiểu'),
    ('DiemToiDa', '10', 'Điểm tối đa'),
    ('DiemDat', '5', 'Điểm tổng kết tối thiểu để đạt')
ON CONFLICT (TenThamSo) DO NOTHING;

-- ========== CẬP NHẬT LOẠI HÌNH KIỂM TRA ==========
-- Thêm loại kiểm tra giữa kỳ nếu chưa có
INSERT INTO LOAIHINHKIEMTRA (MaLHKT, TenLHKT, HeSo) VALUES 
    ('GK', 'Thi giữa kỳ', 2)
ON CONFLICT (MaLHKT) DO UPDATE SET HeSo = EXCLUDED.HeSo;

-- ========== THÊM LỚP MẪU ==========
-- Thêm các lớp mẫu nếu chưa có
INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc) VALUES 
    ('10A4', 'Lớp 10A4', 'K10', 0, '2024-2025')
ON CONFLICT (MaLop) DO NOTHING;

INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc) VALUES 
    ('11A2', 'Lớp 11A2', 'K11', 0, '2024-2025'),
    ('11A3', 'Lớp 11A3', 'K11', 0, '2024-2025')
ON CONFLICT (MaLop) DO NOTHING;

INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc) VALUES 
    ('12A2', 'Lớp 12A2', 'K12', 0, '2024-2025')
ON CONFLICT (MaLop) DO NOTHING;

-- ========== VIEW: Hiển thị tóm tắt quy định ==========
CREATE OR REPLACE VIEW V_QUIDINH AS
SELECT 
    'QĐ1' as MaQD,
    'Tuổi học sinh' as TenQD,
    'Từ ' || (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'TuoiToiThieu') || 
           ' đến ' || (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'TuoiToiDa') || ' tuổi' as GiaTri
UNION ALL
SELECT 'QĐ2', 'Số học kỳ', (SELECT COUNT(*) FROM HOCKY)::text || ' học kỳ/năm'
UNION ALL
SELECT 'QĐ3', 'Sĩ số tối đa', (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'SiSoToiDa') || ' HS/lớp'
UNION ALL
SELECT 'QĐ5', 'Số môn học', (SELECT COUNT(*) FROM MONHOC)::text || ' môn'
UNION ALL
SELECT 'QĐ6', 'Thang điểm', 'Từ ' || (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemToiThieu') ||
           ' đến ' || (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemToiDa')
UNION ALL
SELECT 'QĐ7', 'Điểm đạt môn', 'TB >= ' || (SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemDatMon');

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
