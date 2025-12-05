-- =====================================================
-- FILE: generate.sql
-- MỤC ĐÍCH: Generate dữ liệu mẫu cho 1600 học sinh và điểm ngẫu nhiên
-- Mã học sinh: HS010000 đến HS011599 (tổng 1600 học sinh)
-- =====================================================

-- ========== THÊM CỘT ĐIỂM HẠNH KIỂM VÀO BẢNG HANHKIEM ==========
-- Điểm hạnh kiểm: >= 80 => Tốt, >= 65 => Khá, >= 50 => Trung bình, < 50 => Yếu (thang 100)
ALTER TABLE HANHKIEM DROP COLUMN IF EXISTS DiemHanhKiem;
ALTER TABLE HANHKIEM ADD COLUMN DiemHanhKiem DECIMAL(5,2) CHECK (DiemHanhKiem >= 0 AND DiemHanhKiem <= 100);

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

-- ========== FUNCTION: Generate random ngày sinh (2007-2009) ==========
CREATE OR REPLACE FUNCTION random_ngay_sinh() RETURNS DATE AS $$
DECLARE
    nam INT;
    thang INT;
    ngay INT;
BEGIN
    nam := 2007 + floor(random() * 3)::INT; -- 2007, 2008, 2009
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

-- ========== FUNCTION: Generate random điểm (0-10) ==========
CREATE OR REPLACE FUNCTION random_diem() RETURNS DECIMAL AS $$
DECLARE
    diem DECIMAL;
BEGIN
    -- Tạo điểm từ 0-10 với độ chính xác 0.5
    -- Phân bố: 10% điểm 9-10, 30% điểm 7-8.5, 40% điểm 5-6.5, 20% điểm dưới 5
    diem := CASE 
        WHEN random() < 0.10 THEN 9.0 + (random() * 1.0)  -- 10% điểm giỏi (9-10)
        WHEN random() < 0.40 THEN 7.0 + (random() * 1.5)  -- 30% điểm khá (7-8.5)
        WHEN random() < 0.80 THEN 5.0 + (random() * 1.5)  -- 40% điểm TB (5-6.5)
        ELSE 2.0 + (random() * 3.0)                       -- 20% điểm yếu (2-5)
    END;
    -- Đảm bảo điểm không vượt quá 10
    IF diem > 10 THEN
        diem := 10;
    END IF;
    RETURN ROUND(diem::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Generate random điểm hạnh kiểm (0-100) ==========
CREATE OR REPLACE FUNCTION random_diem_hanh_kiem() RETURNS DECIMAL AS $$
DECLARE
    diem DECIMAL;
BEGIN
    -- Phân bố hạnh kiểm: 40% Tốt (>=80), 35% Khá (65-80), 20% TB (50-65), 5% Yếu (<50)
    diem := CASE 
        WHEN random() < 0.40 THEN 80 + (random() * 20)  -- 40% Tốt (80-100)
        WHEN random() < 0.75 THEN 65 + (random() * 15)  -- 35% Khá (65-80)
        WHEN random() < 0.95 THEN 50 + (random() * 15)  -- 20% TB (50-65)
        ELSE 30 + (random() * 20)                       -- 5% Yếu (30-50)
    END;
    -- Đảm bảo điểm không vượt quá 100
    IF diem > 100 THEN
        diem := 100;
    END IF;
    RETURN ROUND(diem::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;

-- ========== FUNCTION: Tính xếp loại hạnh kiểm từ điểm ==========
CREATE OR REPLACE FUNCTION tinh_xep_loai_hanh_kiem(diem DECIMAL) RETURNS TEXT AS $$
BEGIN
    RETURN CASE 
        WHEN diem >= 80 THEN 'Tốt'
        WHEN diem >= 65 THEN 'Khá'
        WHEN diem >= 50 THEN 'Trung bình'
        ELSE 'Yếu'
    END;
END;
$$ LANGUAGE plpgsql;

-- ========== GENERATE 1600 HỌC SINH ==========
-- Mã học sinh từ HS010000 đến HS011599

DO $$
DECLARE
    i INT;
    ma_hs TEXT;
    ho_ten TEXT;
    ho_ten_ph TEXT;
    gioi_tinh TEXT;
    ngay_sinh DATE;
    dia_chi TEXT;
    email TEXT;
    sdt_ph TEXT;
BEGIN
    FOR i IN 0..1599 LOOP
        -- Tạo mã học sinh: HS01 + 4 chữ số (0000-1599)
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');
        
        -- Generate thông tin ngẫu nhiên
        ho_ten := random_ho_ten();
        ho_ten_ph := random_ho() || ' ' || random_ten_dem() || ' ' || random_ten();
        gioi_tinh := random_gioi_tinh();
        ngay_sinh := random_ngay_sinh();
        dia_chi := random_dia_chi();
        email := lower(ma_hs) || '@school.edu.vn';
        sdt_ph := random_sdt();
        
        -- Insert học sinh
        INSERT INTO HOCSINH (MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh)
        VALUES (ma_hs, ho_ten, gioi_tinh, ngay_sinh, dia_chi, email, ho_ten_ph, sdt_ph)
        ON CONFLICT (MaHocSinh) DO NOTHING;
        
        -- Tạo tài khoản học sinh (mật khẩu mặc định: 123456)
        INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro, TrangThai)
        VALUES (ma_hs, '123456', ho_ten, email, 'STUDENT', true)
        ON CONFLICT (TenDangNhap) DO NOTHING;
        
        -- In tiến trình mỗi 100 bản ghi
        IF i % 100 = 0 THEN
            RAISE NOTICE 'Đã tạo % học sinh...', i;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Hoàn thành! Đã tạo 1600 học sinh từ HS010000 đến HS011599';
END $$;

-- ========== TẠO THÊM CÁC LỚP CÒN THIẾU ==========
INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc) VALUES 
    ('10A4', 'Lớp 10A4', 'K10', 0, '2024-2025'),
    ('11A2', 'Lớp 11A2', 'K11', 0, '2024-2025'),
    ('11A3', 'Lớp 11A3', 'K11', 0, '2024-2025'),
    ('11A4', 'Lớp 11A4', 'K11', 0, '2024-2025'),
    ('12A2', 'Lớp 12A2', 'K12', 0, '2024-2025'),
    ('12A3', 'Lớp 12A3', 'K12', 0, '2024-2025'),
    ('12A4', 'Lớp 12A4', 'K12', 0, '2024-2025')
ON CONFLICT (MaLop) DO NOTHING;

-- ========== PHÂN BỔ HỌC SINH VÀO CÁC LỚP ==========
-- Có 12 lớp (10A1-10A4, 11A1-11A4, 12A1-12A4)
-- Mỗi lớp khoảng 40 học sinh

DO $$
DECLARE
    ma_hs TEXT;
    lop_list TEXT[] := ARRAY['10A1', '10A2', '10A3', '10A4', '11A1', '11A2', '11A3', '11A4', '12A1', '12A2', '12A3', '12A4'];
    ma_lop TEXT;
    idx INT := 0;
    lop_idx INT;
BEGIN
    -- Phân bổ 480 học sinh đầu vào 12 lớp (mỗi lớp 40 HS)
    FOR i IN 0..479 LOOP
        ma_hs := 'HS01' || lpad(i::TEXT, 4, '0');
        lop_idx := (i / 40) + 1; -- Chia đều 40 HS/lớp
        
        IF lop_idx <= array_length(lop_list, 1) THEN
            ma_lop := lop_list[lop_idx];
            
            INSERT INTO QUATRINHHOC (MaHocSinh, MaLop)
            VALUES (ma_hs, ma_lop)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
    
    -- Cập nhật sĩ số lớp
    UPDATE LOP SET SiSo = (
        SELECT COUNT(*) FROM QUATRINHHOC WHERE QUATRINHHOC.MaLop = LOP.MaLop
    );
    
    RAISE NOTICE 'Đã phân bổ 480 học sinh vào 12 lớp (40 HS/lớp)';
    RAISE NOTICE 'Còn lại 1120 học sinh chưa được phân lớp';
END $$;

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

-- ========== GENERATE ĐIỂM CHO HỌC SINH TRONG 480 HS ĐÃ PHÂN LỚP ==========
-- Tạo điểm cho tất cả môn học, cả 2 học kỳ

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
    i INT;
    mon_list TEXT[] := ARRAY['TOAN', 'VAN', 'ANH', 'LY', 'HOA', 'SINH', 'SU', 'DIA', 'GDCD'];
    hocky_list TEXT[] := ARRAY['HK1', 'HK2'];
    diem_hk DECIMAL;
    xep_loai_hk TEXT;
    count_hs INT := 0;
BEGIN
    -- Lặp qua 480 học sinh đã được phân lớp
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
DROP FUNCTION IF EXISTS random_ngay_sinh();
DROP FUNCTION IF EXISTS random_dia_chi();
DROP FUNCTION IF EXISTS random_sdt();
DROP FUNCTION IF EXISTS random_diem();
DROP FUNCTION IF EXISTS random_diem_hanh_kiem();
DROP FUNCTION IF EXISTS tinh_xep_loai_hanh_kiem(DECIMAL);

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

SELECT '✓ Generate dữ liệu thành công!' as Status;
