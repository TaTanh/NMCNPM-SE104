-- ========================================
-- THÊM HỌC KỲ "CẢ NĂM" VÀO DATABASE
-- ========================================

INSERT INTO HOCKY VALUES ('CN', 'Cả năm') ON CONFLICT DO NOTHING;

SELECT '✓ Đã thêm học kỳ "Cả năm" vào database!' AS Status;
