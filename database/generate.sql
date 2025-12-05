-- =====================================================
-- FILE: generate.sql
-- MỤC ĐÍCH: Generate dữ liệu mẫu cho 1600 học sinh
-- Mã học sinh: HS010000 đến HS011599 (tổng 1600 học sinh)
-- =====================================================

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

-- ========== PHÂN BỔ HỌC SINH VÀO CÁC LỚP ==========
-- Giả sử có 40 lớp (10A1-10A4, 11A1-11A4, 12A1-12A4 x 3 khối) = 12 lớp
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

-- ========== XÓA CÁC FUNCTION TẠM ==========
DROP FUNCTION IF EXISTS random_ho();
DROP FUNCTION IF EXISTS random_ten_dem();
DROP FUNCTION IF EXISTS random_ten();
DROP FUNCTION IF EXISTS random_ho_ten();
DROP FUNCTION IF EXISTS random_gioi_tinh();
DROP FUNCTION IF EXISTS random_ngay_sinh();
DROP FUNCTION IF EXISTS random_dia_chi();
DROP FUNCTION IF EXISTS random_sdt();

-- ========== THỐNG KÊ ==========
SELECT 'Tổng số học sinh: ' || COUNT(*) as ThongKe FROM HOCSINH WHERE MaHocSinh LIKE 'HS01%';
SELECT 'Tổng số tài khoản học sinh: ' || COUNT(*) as ThongKe FROM NGUOIDUNG WHERE MaVaiTro = 'STUDENT';
SELECT MaLop, COUNT(*) as SiSo FROM QUATRINHHOC GROUP BY MaLop ORDER BY MaLop;

SELECT '✓ Generate dữ liệu thành công!' as Status;
