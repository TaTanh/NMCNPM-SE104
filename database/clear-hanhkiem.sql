-- ========================================
-- XÓA TOÀN BỘ DỮ LIỆU HẠNH KIỂM
-- ========================================

-- Xóa tất cả bản ghi hạnh kiểm
DELETE FROM HANHKIEM;

-- Xóa cột DiemHanhKiem nếu có (do seed.sql tạo ra)
ALTER TABLE HANHKIEM DROP COLUMN IF EXISTS DiemHanhKiem;

-- Kiểm tra kết quả
SELECT 'Đã xóa tất cả dữ liệu hạnh kiểm!' AS Status;
SELECT 'Tổng số bản ghi còn lại: ' || COUNT(*) AS ThongKe FROM HANHKIEM;

-- Hiển thị cấu trúc bảng HANHKIEM
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'hanhkiem'
ORDER BY ordinal_position;
