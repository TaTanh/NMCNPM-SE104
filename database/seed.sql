-- =====================================================
-- FILE: generate.sql
-- MỤC ĐÍCH: Generate dữ liệu mẫu cho hệ thống quản lý học sinh
-- - 3 khối: 10, 11, 12
-- - Mỗi khối 4 lớp (A1, A2, A3, A4) = 12 lớp
-- - Mỗi lớp 40 học sinh = 480 học sinh đã phân lớp
-- - 50 học sinh chưa phân lớp
-- - TỔNG: 530 học sinh (HS010000 - HS010529)
-- =====================================================

-- ========== THÊM CỘT ĐIỂM HẠNH KIỂM VÀO BẢNG HANHKIEM ==========
-- Điểm hạnh kiểm: >= 80 => Tốt, >= 65 => Khá, >= 50 => Trung bình, < 50 => Yếu (thang 100, số nguyên)
ALTER TABLE HANHKIEM DROP COLUMN IF EXISTS DiemHanhKiem;
ALTER TABLE HANHKIEM ADD COLUMN DiemHanhKiem INTEGER CHECK (DiemHanhKiem >= 0 AND DiemHanhKiem <= 100);

-- ========== FUNCTION: Generate random họ tên ==========
CREATE OR REPLACE FUNCTION random_ho() RETURNS TEXT AS $$
DECLARE
    ho_list TEXT[] := ARRAY['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
BEGIN
    RETURN ho_list[floor(random() * array_length(ho_list, 1) + 1)];
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION random_ten_dem() RETURNS TEXT AS $$
DECLARE
    ten_dem_list TEXT[] := ARRAY['Văn', 'Thị', 'Minh', 'Hữu', 'Đức', 'Anh', 'Quốc', 'Phương', 'Thanh', 'Thành', 'Hoàng', 'Hồng'];
BEGIN
    RETURN ten_dem_list[floor(random() * array_length(ten_dem_list, 1) + 1)];
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION random_ten() RETURNS TEXT AS $$
DECLARE
    ten_list TEXT[] := ARRAY['An', 'Bình', 'Chi', 'Dũng', 'Đạt', 'Hà', 'Hải', 'Hương', 'Khoa', 'Linh', 'Long', 'Mai', 'Nam', 'Phúc', 'Quân', 'Sơn', 'Tâm', 'Trang', 'Tuấn', 'Uyên', 'Vân', 'Vinh', 'Yến'];
BEGIN
    RETURN ten_list[floor(random() * array_length(ten_list, 1) + 1)];
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION random_ho_ten() RETURNS TEXT AS $$
BEGIN
    RETURN random_ho() || ' ' || random_ten_dem() || ' ' || random_ten();
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Generate random giới tính ==========
CREATE OR REPLACE FUNCTION random_gioi_tinh() RETURNS TEXT AS $$
BEGIN
    RETURN CASE WHEN random() < 0.5 THEN 'Nam' ELSE 'Nữ' END;
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Generate random ngày sinh theo khối lớp ==========
-- Khối 10: sinh năm 2010 (15 tuổi)
-- Khối 11: sinh năm 2009 (16 tuổi)  
-- Khối 12: sinh năm 2008 (17 tuổi)
CREATE OR REPLACE FUNCTION random_ngay_sinh(khoi_lop VARCHAR) RETURNS DATE AS $$
DECLARE
    nam INT;
    thang INT;
    ngay INT;
BEGIN
    -- Xác định năm sinh dựa trên khối lớp
    nam := CASE khoi_lop
        WHEN 'K10' THEN 2010
        WHEN 'K11' THEN 2009
        WHEN 'K12' THEN 2008
        ELSE 2010 -- Mặc định cho học sinh chưa phân lớp
    END;
    
    thang := 1 + floor(random() * 12)::INT;
    ngay := 1 + floor(random() * 28)::INT; -- Đơn giản hóa, tránh ngày không hợp lệ
    RETURN make_date(nam, thang, ngay);
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Generate random địa chỉ ==========
CREATE OR REPLACE FUNCTION random_dia_chi() RETURNS TEXT AS $$
DECLARE
    dia_chi_list TEXT[] := ARRAY[
        'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng',
        'Bình Dương', 'Đồng Nai', 'Long An', 'Bà Rịa - Vũng Tàu', 'Tiền Giang',
        'An Giang', 'Kiên Giang', 'Vĩnh Long', 'Bến Tre', 'Trà Vinh'
    ];
BEGIN
    RETURN dia_chi_list[floor(random() * array_length(dia_chi_list, 1) + 1)];
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Generate random số điện thoại ==========
CREATE OR REPLACE FUNCTION random_sdt() RETURNS TEXT AS $$
BEGIN
    RETURN '09' || lpad(floor(random() * 100000000)::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Generate random điểm (0-10) với bội số 0.25 ==========
CREATE OR REPLACE FUNCTION random_diem() RETURNS DECIMAL AS $$
DECLARE
    diem DECIMAL;
    rand_val DECIMAL;
    base_score DECIMAL;
BEGIN
    -- Tạo điểm từ 0-10 với phân bố thực tế
    -- Phân bố: 60% điểm giỏi (8.5-10), 25% điểm khá (7-8.5), 10% điểm TB (5-7), 5% điểm yếu (2-5)
    rand_val := random();
    base_score := CASE 
        WHEN rand_val < 0.60 THEN 8.5 + (random() * 1.5)  -- 60% điểm giỏi (8.5-10)
        WHEN rand_val < 0.85 THEN 7.0 + (random() * 1.5)  -- 25% điểm khá (7-8.5)
        WHEN rand_val < 0.95 THEN 5.0 + (random() * 2.0)  -- 10% điểm TB (5-7)
        ELSE 2.0 + (random() * 3.0)                       -- 5% điểm yếu (2-5)
    END;
    
    -- Đảm bảo điểm không vượt quá 10
    IF base_score > 10 THEN
        base_score := 10;
    END IF;
    
    -- Làm tròn theo bội số 0.25 (giống cách giáo viên chấm thực tế: 7.0, 7.25, 7.5, 7.75, 8.0...)
    diem := ROUND(base_score * 4) / 4;
    
    RETURN diem;
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Generate random điểm hạnh kiểm (0-100) ==========
CREATE OR REPLACE FUNCTION random_diem_hanh_kiem() RETURNS INTEGER AS $$
DECLARE
    diem INTEGER;
    rand_val DECIMAL;
BEGIN
    -- Phân bố hạnh kiểm: 70% Tốt (>=80), 20% Khá (65-80), 7% TB (50-65), 3% Yếu (<50)
    rand_val := random();
    diem := CASE 
        WHEN rand_val < 0.70 THEN 80 + floor(random() * 21)::INTEGER  -- 70% Tốt (80-100)
        WHEN rand_val < 0.90 THEN 65 + floor(random() * 16)::INTEGER  -- 20% Khá (65-80)
        WHEN rand_val < 0.97 THEN 50 + floor(random() * 16)::INTEGER  -- 7% TB (50-65)
        ELSE 30 + floor(random() * 21)::INTEGER                       -- 3% Yếu (30-50)
    END;
    -- Đảm bảo điểm không vượt quá 100
    IF diem > 100 THEN
        diem := 100;
    END IF;
    RETURN diem;
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Tính xếp loại hạnh kiểm từ điểm ==========
CREATE OR REPLACE FUNCTION tinh_xep_loai_hanh_kiem(diem INTEGER) RETURNS TEXT AS $$
BEGIN
    RETURN CASE 
        WHEN diem >= 80 THEN 'Tốt'
        WHEN diem >= 65 THEN 'Khá'
        WHEN diem >= 50 THEN 'Trung bình'
        ELSE 'Yếu'
    END;
END;
$$ LANGUAGE plpgsql;

-- ========== GENERATE 1500 HỌC SINH ==========  
-- Mã học sinh từ HS010000 đến HS011499
-- Mỗi năm học (2023-2024, 2024-2025, 2025-2026): 480 HS (160 khối 10, 160 khối 11, 160 khối 12)
-- Tổng đã phân lớp: 1440 HS; chưa phân lớp: 60 HS

DO $$
DECLARE
    i INT;
    ma_hs TEXT;
    ho TEXT;
    ten_dem TEXT;
    ten TEXT;
    ho_ten TEXT;
    ho_ten_ph TEXT;
    gioi_tinh TEXT;
    ngay_sinh DATE;
    dia_chi TEXT;
    email TEXT;
    sdt_ph TEXT;
    khoi_lop VARCHAR;
    nam_hoc TEXT;
    idx_in_year INT;
BEGIN
    FOR i IN 0..1499 LOOP
        -- Tạo mã học sinh: HS01 + 4 chữ số (0000-1499)
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');

        -- Xác định năm học và khối lớp theo nhóm 480 HS / năm
        IF i < 480 THEN
            nam_hoc := '2023-2024';
            idx_in_year := i;
        ELSIF i < 960 THEN
            nam_hoc := '2024-2025';
            idx_in_year := i - 480;
        ELSIF i < 1440 THEN
            nam_hoc := '2025-2026';
            idx_in_year := i - 960;
        ELSE
            nam_hoc := NULL; -- nhóm chưa phân lớp
            idx_in_year := NULL;
        END IF;

        -- Khối: mỗi năm 160 HS khối 10, 160 khối 11, 160 khối 12; chưa phân lớp mặc định K10
        IF idx_in_year IS NULL THEN
            khoi_lop := 'K10';
        ELSIF idx_in_year < 160 THEN
            khoi_lop := 'K10';
        ELSIF idx_in_year < 320 THEN
            khoi_lop := 'K11';
        ELSE
            khoi_lop := 'K12';
        END IF;

        -- Generate thông tin ngẫu nhiên
        ho := random_ho();
        ten_dem := random_ten_dem();
        ten := random_ten();
        ho_ten := ho || ' ' || ten_dem || ' ' || ten;
        ho_ten_ph := ho || ' ' || random_ten_dem() || ' ' || random_ten();
        gioi_tinh := random_gioi_tinh();
        ngay_sinh := random_ngay_sinh(khoi_lop);
        dia_chi := random_dia_chi();
        email := lower(ma_hs) || '@school.edu.vn';
        sdt_ph := random_sdt();

        INSERT INTO HOCSINH (MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh, KhoiHienTai)
        VALUES (ma_hs, ho_ten, gioi_tinh, ngay_sinh, dia_chi, email, ho_ten_ph, sdt_ph, khoi_lop)
        ON CONFLICT (MaHocSinh) DO NOTHING;

        INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro, TrangThai)
        VALUES (ma_hs, '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', ho_ten, email, 'STUDENT', true)
        ON CONFLICT (TenDangNhap) DO NOTHING;

        IF i % 200 = 0 THEN
            RAISE NOTICE 'Đã tạo % học sinh...', i;
        END IF;
    END LOOP;

    RAISE NOTICE 'Hoàn thành! Đã tạo 1500 học sinh từ HS010000 đến HS011499';
    RAISE NOTICE '  - Mỗi năm (2023-2024, 2024-2025, 2025-2026): 480 HS (160 khối 10, 160 khối 11, 160 khối 12)';
    RAISE NOTICE '  - Chưa phân lớp: 60 HS cuối (HS011440-HS011499, mặc định KhoiHienTai=K10)';
END $$;

-- ========== TẠO 12 LỚP CHO MỖI NĂM HỌC 2023-2024, 2024-2025, 2025-2026 ==========  
INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc) VALUES 
    -- Năm 2023-2024
    ('23_10A1', 'Lớp 10A1 (2023-2024)', 'K10', 0, '2023-2024'),
    ('23_10A2', 'Lớp 10A2 (2023-2024)', 'K10', 0, '2023-2024'),
    ('23_10A3', 'Lớp 10A3 (2023-2024)', 'K10', 0, '2023-2024'),
    ('23_10A4', 'Lớp 10A4 (2023-2024)', 'K10', 0, '2023-2024'),
    ('23_11A1', 'Lớp 11A1 (2023-2024)', 'K11', 0, '2023-2024'),
    ('23_11A2', 'Lớp 11A2 (2023-2024)', 'K11', 0, '2023-2024'),
    ('23_11A3', 'Lớp 11A3 (2023-2024)', 'K11', 0, '2023-2024'),
    ('23_11A4', 'Lớp 11A4 (2023-2024)', 'K11', 0, '2023-2024'),
    ('23_12A1', 'Lớp 12A1 (2023-2024)', 'K12', 0, '2023-2024'),
    ('23_12A2', 'Lớp 12A2 (2023-2024)', 'K12', 0, '2023-2024'),
    ('23_12A3', 'Lớp 12A3 (2023-2024)', 'K12', 0, '2023-2024'),
    ('23_12A4', 'Lớp 12A4 (2023-2024)', 'K12', 0, '2023-2024'),
    -- Năm 2024-2025
    ('24_10A1', 'Lớp 10A1 (2024-2025)', 'K10', 0, '2024-2025'),
    ('24_10A2', 'Lớp 10A2 (2024-2025)', 'K10', 0, '2024-2025'),
    ('24_10A3', 'Lớp 10A3 (2024-2025)', 'K10', 0, '2024-2025'),
    ('24_10A4', 'Lớp 10A4 (2024-2025)', 'K10', 0, '2024-2025'),
    ('24_11A1', 'Lớp 11A1 (2024-2025)', 'K11', 0, '2024-2025'),
    ('24_11A2', 'Lớp 11A2 (2024-2025)', 'K11', 0, '2024-2025'),
    ('24_11A3', 'Lớp 11A3 (2024-2025)', 'K11', 0, '2024-2025'),
    ('24_11A4', 'Lớp 11A4 (2024-2025)', 'K11', 0, '2024-2025'),
    ('24_12A1', 'Lớp 12A1 (2024-2025)', 'K12', 0, '2024-2025'),
    ('24_12A2', 'Lớp 12A2 (2024-2025)', 'K12', 0, '2024-2025'),
    ('24_12A3', 'Lớp 12A3 (2024-2025)', 'K12', 0, '2024-2025'),
    ('24_12A4', 'Lớp 12A4 (2024-2025)', 'K12', 0, '2024-2025'),
    -- Năm 2025-2026
    ('25_10A1', 'Lớp 10A1 (2025-2026)', 'K10', 0, '2025-2026'),
    ('25_10A2', 'Lớp 10A2 (2025-2026)', 'K10', 0, '2025-2026'),
    ('25_10A3', 'Lớp 10A3 (2025-2026)', 'K10', 0, '2025-2026'),
    ('25_10A4', 'Lớp 10A4 (2025-2026)', 'K10', 0, '2025-2026'),
    ('25_11A1', 'Lớp 11A1 (2025-2026)', 'K11', 0, '2025-2026'),
    ('25_11A2', 'Lớp 11A2 (2025-2026)', 'K11', 0, '2025-2026'),
    ('25_11A3', 'Lớp 11A3 (2025-2026)', 'K11', 0, '2025-2026'),
    ('25_11A4', 'Lớp 11A4 (2025-2026)', 'K11', 0, '2025-2026'),
    ('25_12A1', 'Lớp 12A1 (2025-2026)', 'K12', 0, '2025-2026'),
    ('25_12A2', 'Lớp 12A2 (2025-2026)', 'K12', 0, '2025-2026'),
    ('25_12A3', 'Lớp 12A3 (2025-2026)', 'K12', 0, '2025-2026'),
    ('25_12A4', 'Lớp 12A4 (2025-2026)', 'K12', 0, '2025-2026')
ON CONFLICT (MaLop) DO NOTHING;

-- ========== PHÂN BỔ HỌC SINH VÀO CÁC LỚP (3 NĂM HỌC) ==========
-- Mỗi năm: 480 HS (khối 10/11/12 mỗi khối 160 HS) → 12 lớp (4 lớp/khối, 40 HS/lớp)
-- HS chưa phân lớp: 60 cuối cùng giữ nguyên trạng thái

DO $$
DECLARE
    ma_hs TEXT;
    ma_lop TEXT;
    students_per_class INT := 40;
    total_assigned INT := 0;
    lop_10_23 TEXT[] := ARRAY['23_10A1', '23_10A2', '23_10A3', '23_10A4'];
    lop_11_23 TEXT[] := ARRAY['23_11A1', '23_11A2', '23_11A3', '23_11A4'];
    lop_12_23 TEXT[] := ARRAY['23_12A1', '23_12A2', '23_12A3', '23_12A4'];
    lop_10_24 TEXT[] := ARRAY['24_10A1', '24_10A2', '24_10A3', '24_10A4'];
    lop_11_24 TEXT[] := ARRAY['24_11A1', '24_11A2', '24_11A3', '24_11A4'];
    lop_12_24 TEXT[] := ARRAY['24_12A1', '24_12A2', '24_12A3', '24_12A4'];
    lop_10_25 TEXT[] := ARRAY['25_10A1', '25_10A2', '25_10A3', '25_10A4'];
    lop_11_25 TEXT[] := ARRAY['25_11A1', '25_11A2', '25_11A3', '25_11A4'];
    lop_12_25 TEXT[] := ARRAY['25_12A1', '25_12A2', '25_12A3', '25_12A4'];
    lop_idx INT;
BEGIN
    -- Năm 2023-2024 (HS010000-HS010479)
    FOR i IN 0..479 LOOP
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');
        IF i < 160 THEN
            lop_idx := (i / students_per_class) + 1;
            ma_lop := lop_10_23[lop_idx];
        ELSIF i < 320 THEN
            lop_idx := ((i - 160) / students_per_class) + 1;
            ma_lop := lop_11_23[lop_idx];
        ELSE
            lop_idx := ((i - 320) / students_per_class) + 1;
            ma_lop := lop_12_23[lop_idx];
        END IF;

        INSERT INTO QUATRINHHOC (MaHocSinh, MaLop)
        VALUES (ma_hs, ma_lop)
        ON CONFLICT DO NOTHING;
        total_assigned := total_assigned + 1;
    END LOOP;
    RAISE NOTICE 'Đã phân 480 HS vào 12 lớp năm 2023-2024';

    -- Năm 2024-2025 (HS010480-HS010959)
    FOR i IN 480..959 LOOP
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');
        IF i < 640 THEN
            lop_idx := ((i - 480) / students_per_class) + 1;
            ma_lop := lop_10_24[lop_idx];
        ELSIF i < 800 THEN
            lop_idx := ((i - 640) / students_per_class) + 1;
            ma_lop := lop_11_24[lop_idx];
        ELSE
            lop_idx := ((i - 800) / students_per_class) + 1;
            ma_lop := lop_12_24[lop_idx];
        END IF;

        INSERT INTO QUATRINHHOC (MaHocSinh, MaLop)
        VALUES (ma_hs, ma_lop)
        ON CONFLICT DO NOTHING;
        total_assigned := total_assigned + 1;
    END LOOP;
    RAISE NOTICE 'Đã phân 480 HS vào 12 lớp năm 2024-2025';

    -- Năm 2025-2026 (HS010960-HS011439)
    FOR i IN 960..1439 LOOP
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');
        IF i < 1120 THEN
            lop_idx := ((i - 960) / students_per_class) + 1;
            ma_lop := lop_10_25[lop_idx];
        ELSIF i < 1280 THEN
            lop_idx := ((i - 1120) / students_per_class) + 1;
            ma_lop := lop_11_25[lop_idx];
        ELSE
            lop_idx := ((i - 1280) / students_per_class) + 1;
            ma_lop := lop_12_25[lop_idx];
        END IF;

        INSERT INTO QUATRINHHOC (MaHocSinh, MaLop)
        VALUES (ma_hs, ma_lop)
        ON CONFLICT DO NOTHING;
        total_assigned := total_assigned + 1;
    END LOOP;
    RAISE NOTICE 'Đã phân 480 HS vào 12 lớp năm 2025-2026';

    -- 60 HS còn lại (HS011440 - HS011499) chưa phân lớp
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Hoàn thành phân lớp!';
    RAISE NOTICE 'Tổng học sinh đã phân lớp: %', total_assigned;
    RAISE NOTICE 'Học sinh chưa phân lớp: 60 (HS011440-HS011499)';
    RAISE NOTICE '================================================';
END $$;

-- Cập nhật sĩ số lớp
UPDATE LOP SET SiSo = (
    SELECT COUNT(*) FROM QUATRINHHOC WHERE QUATRINHHOC.MaLop = LOP.MaLop
);

-- ========== TẠO BẢNG ĐIỂM VÀ LOẠI HÌNH KIỂM TRA ==========
-- Đảm bảo có loại hình kiểm tra
INSERT INTO LOAIHINHKIEMTRA (MaLHKT, TenLHKT, HeSo) VALUES 
    ('GK', 'Giữa kỳ', 1),
    ('CK', 'Cuối kỳ', 2),
    ('TX1', 'Thường xuyên 1', 1),
    ('TX2', 'Thường xuyên 2', 1),
    ('TX3', 'Thường xuyên 3', 1),
    ('TX4', 'Thường xuyên 4', 1)
ON CONFLICT (MaLHKT) DO NOTHING;

-- ========== GENERATE ĐIỂM CHO 1440 HỌC SINH ĐÃ PHÂN LỚP (3 NĂM HỌC) ==========
-- Tạo điểm cho tất cả môn học, cả 2 học kỳ (HK1, HK2)
-- Năm 2023-2024: HS010000-HS010479, Năm 2024-2025: HS010480-HS010959, Năm 2025-2026: HS010960-HS011439

DO $$
DECLARE
    ma_hs TEXT;
    ma_mon TEXT;
    ma_lop TEXT;
    ma_hocky TEXT;
    ma_nam_hoc TEXT;
    ma_bangdiem TEXT;
    diem_gk DECIMAL;
    diem_ck DECIMAL;
    diem_tx DECIMAL;
    so_cot_tx INT;
    mon_list TEXT[] := ARRAY['TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'SINH', 'SU', 'DIA', 'GDCD'];
    hocky_list TEXT[] := ARRAY['HK1', 'HK2'];
    diem_hk INTEGER;
    xep_loai_hk TEXT;
    count_hs INT := 0;
    count_year INT := 0;
    i INT;
    j INT;
    start_idx INT;
    end_idx INT;
BEGIN
    -- Lặp qua 3 năm học
    FOREACH ma_nam_hoc IN ARRAY ARRAY['2023-2024', '2024-2025', '2025-2026'] LOOP
        count_hs := 0;
        
        -- Xác định khoảng học sinh cho từng năm
        IF ma_nam_hoc = '2023-2024' THEN
            start_idx := 0;
            end_idx := 479;
        ELSIF ma_nam_hoc = '2024-2025' THEN
            start_idx := 480;
            end_idx := 959;
        ELSE -- 2025-2026
            start_idx := 960;
            end_idx := 1439;
        END IF;
        
        RAISE NOTICE 'Đang tạo điểm cho năm học: %', ma_nam_hoc;
        
        -- Lặp qua 480 học sinh của năm học đó
        FOR i IN start_idx..end_idx LOOP
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');
        
        -- Lấy lớp của học sinh
        SELECT MaLop INTO ma_lop FROM QUATRINHHOC WHERE MaHocSinh = ma_hs LIMIT 1;
        
        IF ma_lop IS NULL THEN
            CONTINUE;
        END IF;
        
        count_hs := count_hs + 1;
        
        -- Tạo điểm cho cả 2 học kỳ
        FOREACH ma_hocky IN ARRAY hocky_list LOOP
            
            -- Tạo hạnh kiểm ngẫu nhiên
            diem_hk := random_diem_hanh_kiem();
            xep_loai_hk := tinh_xep_loai_hanh_kiem(diem_hk);
            
            INSERT INTO HANHKIEM (MaHocSinh, MaNamHoc, MaHocKy, DiemHanhKiem, XepLoai)
            VALUES (ma_hs, ma_nam_hoc, ma_hocky, diem_hk, xep_loai_hk)
            ON CONFLICT (MaHocSinh, MaNamHoc, MaHocKy) DO UPDATE 
            SET DiemHanhKiem = EXCLUDED.DiemHanhKiem, XepLoai = EXCLUDED.XepLoai;
            
            -- Tạo điểm cho tất cả các môn học
            FOREACH ma_mon IN ARRAY mon_list LOOP
                
                -- Tạo mã bảng điểm
                ma_bangdiem := ma_lop || '_' || ma_mon || '_' || ma_hocky;
                
                -- Tạo bảng điểm nếu chưa có
                INSERT INTO BANGDIEMMON (MaBangDiem, MaLop, MaMonHoc, MaHocKy)
                VALUES (ma_bangdiem, ma_lop, ma_mon, ma_hocky)
                ON CONFLICT (MaBangDiem) DO NOTHING;
                
                -- Tạo cấu trúc bảng điểm: GK (1 cột), CK (1 cột), TX (tối đa 4 cột)
                INSERT INTO CT_BANGDIEMMON_LHKT (MaBangDiem, MaLHKT, SoCot)
                VALUES 
                    (ma_bangdiem, 'GK', 1),
                    (ma_bangdiem, 'CK', 1),
                    (ma_bangdiem, 'TX1', 1),
                    (ma_bangdiem, 'TX2', 1),
                    (ma_bangdiem, 'TX3', 1),
                    (ma_bangdiem, 'TX4', 1)
                ON CONFLICT (MaBangDiem, MaLHKT) DO NOTHING;
                
                -- Tạo điểm GK
                diem_gk := random_diem();
                INSERT INTO CT_BANGDIEMMON_HOCSINH (MaBangDiem, MaHocSinh, MaLHKT, Diem)
                VALUES (ma_bangdiem, ma_hs, 'GK', diem_gk)
                ON CONFLICT (MaBangDiem, MaHocSinh, MaLHKT) DO UPDATE SET Diem = EXCLUDED.Diem;
                
                -- Tạo điểm CK
                diem_ck := random_diem();
                INSERT INTO CT_BANGDIEMMON_HOCSINH (MaBangDiem, MaHocSinh, MaLHKT, Diem)
                VALUES (ma_bangdiem, ma_hs, 'CK', diem_ck)
                ON CONFLICT (MaBangDiem, MaHocSinh, MaLHKT) DO UPDATE SET Diem = EXCLUDED.Diem;
                
                -- Tạo điểm thường xuyên (ngẫu nhiên 2-4 cột)
                so_cot_tx := 2 + floor(random() * 3)::INT; -- 2, 3, hoặc 4 cột
                
                FOR j IN 1..so_cot_tx LOOP
                    diem_tx := random_diem();
                    INSERT INTO CT_BANGDIEMMON_HOCSINH (MaBangDiem, MaHocSinh, MaLHKT, Diem)
                    VALUES (ma_bangdiem, ma_hs, 'TX' || j, diem_tx)
                    ON CONFLICT (MaBangDiem, MaHocSinh, MaLHKT) DO UPDATE SET Diem = EXCLUDED.Diem;
                END LOOP;
                
            END LOOP; -- End môn học
            
        END LOOP; -- End học kỳ
        
        -- In tiến trình mỗi 50 học sinh
        IF count_hs % 50 = 0 THEN
            RAISE NOTICE '  - Đã tạo điểm cho % học sinh của năm %...', count_hs, ma_nam_hoc;
        END IF;
        
    END LOOP;
        
        RAISE NOTICE 'Năm %: hoàn thành % học sinh (9 môn x 2 học kỳ)', ma_nam_hoc, count_hs;
        count_year := count_year + count_hs;
    END LOOP;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Hoàn thành! Đã tạo điểm cho % học sinh (3 năm x 9 môn x 2 học kỳ)', count_year;
    RAISE NOTICE '================================================';
END $$;

-- ========== XÓA CÁC FUNCTION TẠM ==========
DROP FUNCTION IF EXISTS random_ho();
DROP FUNCTION IF EXISTS random_ten_dem();
DROP FUNCTION IF EXISTS random_ten();
DROP FUNCTION IF EXISTS random_ho_ten();
DROP FUNCTION IF EXISTS random_gioi_tinh();
DROP FUNCTION IF EXISTS random_ngay_sinh(VARCHAR);
DROP FUNCTION IF EXISTS random_dia_chi();
DROP FUNCTION IF EXISTS random_sdt();
DROP FUNCTION IF EXISTS random_diem();
DROP FUNCTION IF EXISTS random_diem_hanh_kiem();
DROP FUNCTION IF EXISTS tinh_xep_loai_hanh_kiem(INTEGER);

-- ========== THỐNG KÊ ==========
SELECT 'Tổng số học sinh: ' || COUNT(*) as ThongKe FROM HOCSINH WHERE MaHocSinh LIKE 'HS01%';
SELECT 'Tổng số tài khoản học sinh: ' || COUNT(*) as ThongKe FROM NGUOIDUNG WHERE MaVaiTro = 'STUDENT';
SELECT 'Tổng số điểm đã tạo: ' || COUNT(*) as ThongKe FROM CT_BANGDIEMMON_HOCSINH;
SELECT 'Tổng số bản ghi hạnh kiểm: ' || COUNT(*) as ThongKe FROM HANHKIEM;
SELECT MaLop, COUNT(*) as SiSo FROM QUATRINHHOC GROUP BY MaLop ORDER BY MaLop;

-- Thống kê phân bố điểm hạnh kiểm
SELECT 
    XepLoai,
    COUNT(*) as SoLuong,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM HANHKIEM WHERE DiemHanhKiem IS NOT NULL), 2) || '%' as TiLe
FROM HANHKIEM 
WHERE DiemHanhKiem IS NOT NULL
GROUP BY XepLoai
ORDER BY 
    CASE XepLoai
        WHEN 'Tốt' THEN 1
        WHEN 'Khá' THEN 2
        WHEN 'Trung bình' THEN 3
        WHEN 'Yếu' THEN 4
    END;

-- =====================================================
-- TẠO DỮ LIỆU GIANGDAY (PHÂN CÔNG GIẢNG DẠY - 3 NĂM HỌC)
-- =====================================================
-- Phân công: mỗi lớp có 9 môn, mỗi môn 1 giáo viên
-- 3 năm x 12 lớp x 9 môn = 324 phân công cho HK1 và HK2

DO $$
DECLARE
    ma_lop TEXT;
    ma_mon TEXT;
    ma_gv INTEGER;
    ma_nam_hoc TEXT;
    count_pc INT := 0;
    count_total INT := 0;
    teachers INTEGER[];
    teacher_idx INT;
    lop_prefix_list TEXT[] := ARRAY['23_', '24_', '25_'];
    lop_base_list TEXT[] := ARRAY['10A1', '10A2', '10A3', '10A4', '11A1', '11A2', '11A3', '11A4', '12A1', '12A2', '12A3', '12A4'];
    mon_list TEXT[] := ARRAY['ANH', 'DIA', 'GDCD', 'HOA', 'LY', 'SINH', 'SU', 'TOAN', 'VAN'];
    hk_list TEXT[] := ARRAY['HK1', 'HK2'];
    ma_hocky TEXT;
    prefix TEXT;
    base_lop TEXT;
BEGIN
    -- Lấy danh sách ID giáo viên
    SELECT ARRAY_AGG(MaNguoiDung ORDER BY MaNguoiDung) 
    INTO teachers
    FROM NGUOIDUNG 
    WHERE MaVaiTro IN ('GVBM', 'GVCN');
    
    IF array_length(teachers, 1) IS NULL OR array_length(teachers, 1) = 0 THEN
        RAISE NOTICE 'Không có giáo viên trong hệ thống!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Bắt đầu tạo phân công giảng dạy (3 năm học)...';
    RAISE NOTICE '  - Số lượng giáo viên: %', array_length(teachers, 1);
    RAISE NOTICE '  - Số lượng năm học: 3';
    RAISE NOTICE '  - Số lượng lớp/năm: %', array_length(lop_base_list, 1);
    RAISE NOTICE '  - Số lượng môn: %', array_length(mon_list, 1);
    RAISE NOTICE '';
    
    -- Tạo phân công cho 3 năm học
    FOREACH prefix IN ARRAY lop_prefix_list LOOP
        -- Xác định năm học
        IF prefix = '23_' THEN
            ma_nam_hoc := '2023-2024';
        ELSIF prefix = '24_' THEN
            ma_nam_hoc := '2024-2025';
        ELSE -- '25_'
            ma_nam_hoc := '2025-2026';
        END IF;
        
        count_pc := 0;
        teacher_idx := 1;
        
        RAISE NOTICE 'Tạo phân công cho năm %...', ma_nam_hoc;
        
        -- Tạo phân công cho cả HK1 và HK2 của năm học đó
        FOREACH ma_hocky IN ARRAY hk_list LOOP
            FOREACH base_lop IN ARRAY lop_base_list LOOP
                ma_lop := prefix || base_lop;
                
                FOREACH ma_mon IN ARRAY mon_list LOOP
                    -- Lấy giáo viên theo vòng tròn
                    ma_gv := teachers[teacher_idx];
                    teacher_idx := teacher_idx + 1;
                    IF teacher_idx > array_length(teachers, 1) THEN
                        teacher_idx := 1;
                    END IF;
                    
                    -- Insert phân công
                    INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
                    VALUES (ma_lop, ma_mon, ma_gv, ma_hocky, ma_nam_hoc)
                    ON CONFLICT (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc) DO NOTHING;
                    
                    count_pc := count_pc + 1;
                END LOOP;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE '  - Năm %: % phân công', ma_nam_hoc, count_pc;
        count_total := count_total + count_pc;
    END LOOP;
    
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Đã tạo % phân công giảng dạy (3 năm x 12 lớp x 9 môn x 2 học kỳ)', count_total;
    RAISE NOTICE '================================================';
END $$;

-- Thống kê phân công giảng dạy
SELECT 'Tổng số phân công giảng dạy: ' || COUNT(*) as ThongKe FROM GIANGDAY;
SELECT MaHocKy, COUNT(*) as SoLuongPhanCong FROM GIANGDAY GROUP BY MaHocKy ORDER BY MaHocKy;

SELECT 'Generate dữ liệu thành công!' as Status;

-- =====================================================
-- TIỆN ÍCH: XÓA HỌC SINH BỊ TRÙNG LỚP
-- Chạy khi cần cleanup dữ liệu bị duplicate
-- =====================================================

-- Xem các học sinh bị trùng lớp trong cùng năm học
-- SELECT 
--     hs.MaHocSinh, hs.HoTen,
--     COUNT(DISTINCT qth.MaLop) as SoLop,
--     STRING_AGG(DISTINCT l.TenLop, ', ') as CacLop,
--     l.MaNamHoc
-- FROM HOCSINH hs
-- JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
-- JOIN LOP l ON qth.MaLop = l.MaLop
-- GROUP BY hs.MaHocSinh, hs.HoTen, l.MaNamHoc
-- HAVING COUNT(DISTINCT qth.MaLop) > 1;

-- Xóa duplicate, giữ lại 1 bản ghi cho mỗi học sinh trong mỗi năm học
-- WITH DuplicateRecords AS (
--     SELECT 
--         qth.MaHocSinh, qth.MaLop, l.MaNamHoc,
--         ROW_NUMBER() OVER (PARTITION BY qth.MaHocSinh, l.MaNamHoc ORDER BY l.MaLop DESC) as rn
--     FROM QUATRINHHOC qth
--     JOIN LOP l ON qth.MaLop = l.MaLop
-- )
-- DELETE FROM QUATRINHHOC
-- WHERE (MaHocSinh, MaLop) IN (
--     SELECT MaHocSinh, MaLop FROM DuplicateRecords WHERE rn > 1
-- );

-- Cập nhật sĩ số
-- UPDATE LOP SET SiSo = (SELECT COUNT(*) FROM QUATRINHHOC WHERE QUATRINHHOC.MaLop = LOP.MaLop);
