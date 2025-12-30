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

-- ========== GENERATE 530 HỌC SINH ==========
-- Mã học sinh từ HS010000 đến HS010529
-- 160 học sinh khối 10 (sinh năm 2010): HS010000-HS010159
-- 160 học sinh khối 11 (sinh năm 2009): HS010160-HS010319
-- 160 học sinh khối 12 (sinh năm 2008): HS010320-HS010479
-- 50 học sinh chưa phân lớp (sinh năm 2010): HS010480-HS010529

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
BEGIN
    FOR i IN 0..529 LOOP
        -- Tạo mã học sinh: HS01 + 4 chữ số (0000-0529)
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');
        
        -- Xác định khối lớp dựa trên số thứ tự
        -- 0-159: Khối 10, 160-319: Khối 11, 320-479: Khối 12, 480-529: Chưa phân lớp (K10)
        IF i < 160 THEN
            khoi_lop := 'K10';
        ELSIF i < 320 THEN
            khoi_lop := 'K11';
        ELSIF i < 480 THEN
            khoi_lop := 'K12';
        ELSE
            khoi_lop := 'K10'; -- Học sinh chưa phân lớp sinh năm 2010
        END IF;
        
        -- Generate thông tin ngẫu nhiên
        -- HỌ CỦA CON PHẢI GIỐNG HỌ CỦA CHA
        ho := random_ho();
        ten_dem := random_ten_dem();
        ten := random_ten();
        ho_ten := ho || ' ' || ten_dem || ' ' || ten;
        
        -- Phụ huynh (cha) có cùng họ với con
        ho_ten_ph := ho || ' ' || random_ten_dem() || ' ' || random_ten();
        
        gioi_tinh := random_gioi_tinh();
        ngay_sinh := random_ngay_sinh(khoi_lop); -- Năm sinh phù hợp với khối lớp
        dia_chi := random_dia_chi();
        email := lower(ma_hs) || '@school.edu.vn';
        sdt_ph := random_sdt();
        
        -- Insert học sinh với khối hiện tại
        INSERT INTO HOCSINH (MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh, KhoiHienTai)
        VALUES (ma_hs, ho_ten, gioi_tinh, ngay_sinh, dia_chi, email, ho_ten_ph, sdt_ph, khoi_lop)
        ON CONFLICT (MaHocSinh) DO NOTHING;
        
        -- Tạo tài khoản học sinh (mật khẩu mặc định: 123456, đã hash với bcrypt)
        INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro, TrangThai)
        VALUES (ma_hs, '$2b$10$h/NusP0ja4LDkEmXAdm6ueE69hVuu7s9Xb2I3QyYnbZMO3GPLqc7y', ho_ten, email, 'STUDENT', true)
        ON CONFLICT (TenDangNhap) DO NOTHING;
        
        -- In tiến trình mỗi 100 bản ghi
        IF i % 100 = 0 THEN
            RAISE NOTICE 'Đã tạo % học sinh...', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Hoàn thành! Đã tạo 530 học sinh từ HS010000 đến HS010529';
    RAISE NOTICE '  - Khối 10 (sinh 2010): 160 HS (HS010000-HS010159)';
    RAISE NOTICE '  - Khối 11 (sinh 2009): 160 HS (HS010160-HS010319)';
    RAISE NOTICE '  - Khối 12 (sinh 2008): 160 HS (HS010320-HS010479)';
    RAISE NOTICE '  - Chưa phân lớp (sinh 2010): 50 HS (HS010480-HS010529)';
END $$;

-- ========== TẠO 12 LỚP CHO NĂM HỌC 2024-2025 ==========
INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc) VALUES 
    -- Khối 10 (4 lớp)
    ('10A1', 'Lớp 10A1', 'K10', 0, '2024-2025'),
    ('10A2', 'Lớp 10A2', 'K10', 0, '2024-2025'),
    ('10A3', 'Lớp 10A3', 'K10', 0, '2024-2025'),
    ('10A4', 'Lớp 10A4', 'K10', 0, '2024-2025'),
    -- Khối 11 (4 lớp)
    ('11A1', 'Lớp 11A1', 'K11', 0, '2024-2025'),
    ('11A2', 'Lớp 11A2', 'K11', 0, '2024-2025'),
    ('11A3', 'Lớp 11A3', 'K11', 0, '2024-2025'),
    ('11A4', 'Lớp 11A4', 'K11', 0, '2024-2025'),
    -- Khối 12 (4 lớp)
    ('12A1', 'Lớp 12A1', 'K12', 0, '2024-2025'),
    ('12A2', 'Lớp 12A2', 'K12', 0, '2024-2025'),
    ('12A3', 'Lớp 12A3', 'K12', 0, '2024-2025'),
    ('12A4', 'Lớp 12A4', 'K12', 0, '2024-2025')
ON CONFLICT (MaLop) DO NOTHING;

-- ========== PHÂN BỔ HỌC SINH VÀO CÁC LỚP ==========
-- Phân bổ theo đúng khối lớp và năm sinh:
-- Khối 10 (sinh 2010): HS010000-HS010159 → 10A1, 10A2, 10A3, 10A4 (40 HS/lớp)
-- Khối 11 (sinh 2009): HS010160-HS010319 → 11A1, 11A2, 11A3, 11A4 (40 HS/lớp)
-- Khối 12 (sinh 2008): HS010320-HS010479 → 12A1, 12A2, 12A3, 12A4 (40 HS/lớp)
-- Chưa phân lớp: HS010480-HS010529 (50 học sinh)

DO $$
DECLARE
    ma_hs TEXT;
    ma_lop TEXT;
    students_per_class INT := 40;
    total_assigned INT := 0;
    lop_10 TEXT[] := ARRAY['10A1', '10A2', '10A3', '10A4'];
    lop_11 TEXT[] := ARRAY['11A1', '11A2', '11A3', '11A4'];
    lop_12 TEXT[] := ARRAY['12A1', '12A2', '12A3', '12A4'];
    lop_idx INT;
BEGIN
    -- Phân bổ học sinh khối 10: HS010000-HS010159 (160 HS = 4 lớp x 40 HS)
    FOR i IN 0..159 LOOP
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');
        lop_idx := (i / students_per_class) + 1; -- 1-4
        ma_lop := lop_10[lop_idx];
        
        INSERT INTO QUATRINHHOC (MaHocSinh, MaLop)
        VALUES (ma_hs, ma_lop)
        ON CONFLICT DO NOTHING;
        
        total_assigned := total_assigned + 1;
    END LOOP;
    RAISE NOTICE 'Đã phân 160 học sinh khối 10 vào 4 lớp (10A1-10A4)';
    
    -- Phân bổ học sinh khối 11: HS010160-HS010319 (160 HS = 4 lớp x 40 HS)
    FOR i IN 160..319 LOOP
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');
        lop_idx := ((i - 160) / students_per_class) + 1; -- 1-4
        ma_lop := lop_11[lop_idx];
        
        INSERT INTO QUATRINHHOC (MaHocSinh, MaLop)
        VALUES (ma_hs, ma_lop)
        ON CONFLICT DO NOTHING;
        
        total_assigned := total_assigned + 1;
    END LOOP;
    RAISE NOTICE 'Đã phân 160 học sinh khối 11 vào 4 lớp (11A1-11A4)';
    
    -- Phân bổ học sinh khối 12: HS010320-HS010479 (160 HS = 4 lớp x 40 HS)
    FOR i IN 320..479 LOOP
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');
        lop_idx := ((i - 320) / students_per_class) + 1; -- 1-4
        ma_lop := lop_12[lop_idx];
        
        INSERT INTO QUATRINHHOC (MaHocSinh, MaLop)
        VALUES (ma_hs, ma_lop)
        ON CONFLICT DO NOTHING;
        
        total_assigned := total_assigned + 1;
    END LOOP;
    RAISE NOTICE 'Đã phân 160 học sinh khối 12 vào 4 lớp (12A1-12A4)';
    
    -- 50 học sinh còn lại (HS010480 - HS010529) KHÔNG phân lớp
    RAISE NOTICE '================================================';
    RAISE NOTICE 'Hoàn thành phân lớp!';
    RAISE NOTICE 'Tổng học sinh đã phân lớp: %', total_assigned;
    RAISE NOTICE 'Học sinh chưa phân lớp: 50 (HS010480-HS010529)';
    RAISE NOTICE '================================================';
END $$;

-- Cập nhật sĩ số lớp
UPDATE LOP SET SiSo = (
    SELECT COUNT(*) FROM QUATRINHHOC WHERE QUATRINHHOC.MaLop = LOP.MaLop
) WHERE MaNamHoc = '2024-2025';

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

-- ========== GENERATE ĐIỂM CHO 480 HỌC SINH ĐÃ PHÂN LỚP ==========
-- Tạo điểm cho tất cả môn học, cả 2 học kỳ (HK1, HK2)

DO $$
DECLARE
    ma_hs TEXT;
    ma_mon TEXT;
    ma_lop TEXT;
    ma_hocky TEXT;
    ma_nam_hoc TEXT := '2024-2025';
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
    i INT;
    j INT;
BEGIN
    -- Lặp qua 480 học sinh đã được phân lớp (HS010000 - HS010479)
    FOR i IN 0..479 LOOP
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
            RAISE NOTICE 'Đã tạo điểm cho % học sinh...', count_hs;
        END IF;
        
    END LOOP;
    
    RAISE NOTICE 'Hoàn thành! Đã tạo điểm cho % học sinh (9 môn x 2 học kỳ)', count_hs;
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
-- TẠO DỮ LIỆU GIANGDAY (PHÂN CÔNG GIẢNG DẠY)
-- =====================================================
-- Phân công: mỗi lớp có 9 môn, mỗi môn 1 giáo viên
-- 12 lớp x 9 môn = 108 phân công cho HK1 và HK2

DO $$
DECLARE
    ma_lop TEXT;
    ma_mon TEXT;
    ma_gv INTEGER;
    count_pc INT := 0;
    teachers INTEGER[];
    teacher_idx INT;
    lop_list TEXT[] := ARRAY['10A1', '10A2', '10A3', '10A4', '11A1', '11A2', '11A3', '11A4', '12A1', '12A2', '12A3', '12A4'];
    mon_list TEXT[] := ARRAY['ANH', 'DIA', 'GDCD', 'HOA', 'LY', 'SINH', 'SU', 'TOAN', 'VAN'];
    hk_list TEXT[] := ARRAY['HK1', 'HK2'];
    ma_hocky TEXT;
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
    
    RAISE NOTICE 'Bắt đầu tạo phân công giảng dạy...';
    RAISE NOTICE '  - Số lượng giáo viên: %', array_length(teachers, 1);
    RAISE NOTICE '  - Số lượng lớp: %', array_length(lop_list, 1);
    RAISE NOTICE '  - Số lượng môn: %', array_length(mon_list, 1);
    RAISE NOTICE '';
    
    teacher_idx := 1;
    
    -- Tạo phân công cho cả HK1 và HK2
    FOREACH ma_hocky IN ARRAY hk_list LOOP
        FOREACH ma_lop IN ARRAY lop_list LOOP
            FOREACH ma_mon IN ARRAY mon_list LOOP
                -- Lấy giáo viên theo vòng tròn
                ma_gv := teachers[teacher_idx];
                teacher_idx := teacher_idx + 1;
                IF teacher_idx > array_length(teachers, 1) THEN
                    teacher_idx := 1;
                END IF;
                
                -- Insert phân công
                INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
                VALUES (ma_lop, ma_mon, ma_gv, ma_hocky, '2024-2025')
                ON CONFLICT (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc) DO NOTHING;
                
                count_pc := count_pc + 1;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Đã tạo % phân công giảng dạy (12 lớp x 9 môn x 2 học kỳ)', count_pc;
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
