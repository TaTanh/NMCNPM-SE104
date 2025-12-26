const pool = require('../config/db');

// ========== HELPER: TÍNH DANH HIỆU THEO TT 58/2011 ==========
/**
 * Tính danh hiệu học sinh dựa vào học lực và hạnh kiểm
 * 
 * Quy định TT 58/2011 (áp dụng nghiêm):
 * - Học sinh Giỏi: Học lực Giỏi + Hạnh kiểm Tốt (CHẶT CHẼ)
 * - Học sinh Khá: 
 *     + Học lực Giỏi + Hạnh kiểm Khá (không đạt HS Giỏi do HK không Tốt)
 *     + Học lực Khá + Hạnh kiểm Tốt
 *     + Học lực Khá + Hạnh kiểm Khá
 * - Học sinh Trung bình:
 *     + Học lực TB + Hạnh kiểm Tốt
 *     + Học lực TB + Hạnh kiểm Khá
 * - Học sinh Yếu: Các trường hợp còn lại
 * 
 * @param {number} diemTB - Điểm trung bình học lực
 * @param {string} xepLoaiHK - Xếp loại hạnh kiểm (Tốt, Khá, TB, Yếu, Kém)
 * @returns {string} Danh hiệu học sinh
 */
function tinhDanhHieu(diemTB, xepLoaiHK) {
    if (!diemTB || !xepLoaiHK) return null;
    
    // Xác định xếp loại học lực
    let hocLuc = '';
    if (diemTB >= 8) hocLuc = 'Giỏi';
    else if (diemTB >= 6.5) hocLuc = 'Khá';
    else if (diemTB >= 5) hocLuc = 'TB';
    else hocLuc = 'Yếu';
    
    // Chuẩn hóa xếp loại hạnh kiểm
    const hk = (xepLoaiHK || '').trim();
    
    // Xét danh hiệu theo quy định TT 58/2011
    if (hocLuc === 'Giỏi' && hk === 'Tốt') {
        // CHỈ Giỏi + Tốt mới được HS Giỏi
        return 'Học sinh giỏi';
    } else if (
        (hocLuc === 'Giỏi' && hk === 'Khá') ||  // Giỏi + Khá → Khá (do HK không Tốt)
        (hocLuc === 'Khá' && hk === 'Tốt') ||   // Khá + Tốt → Khá
        (hocLuc === 'Khá' && hk === 'Khá')      // Khá + Khá → Khá
    ) {
        return 'Học sinh khá';
    } else if (
        (hocLuc === 'Giỏi' && hk === 'Trung bình') ||  // Giỏi + TB → TB
        (hocLuc === 'TB' && hk === 'Tốt') ||    // TB + Tốt → TB
        (hocLuc === 'TB' && hk === 'Khá')       // TB + Khá → TB
    ) {
        return 'Học sinh trung bình';
    } else {
        // Tất cả còn lại
        return 'Học sinh yếu';
    }
}

// ========== BÁO CÁO TỔNG KẾT MÔN ==========
const getSubjectReport = async (namhoc, hocky, monhoc) => {
    // Lấy báo cáo từ bảng BAOCAOTONGKETMON nếu đã có
    let result = await pool.query(
        `SELECT bctk.*, ct.MaLop, ct.SoLuongDat, ct.TiLe, l.TenLop
         FROM BAOCAOTONGKETMON bctk
         JOIN CT_BCTKM ct ON bctk.MaBaoCao = ct.MaBaoCao
         JOIN LOP l ON ct.MaLop = l.MaLop
         WHERE bctk.MaMonHoc = $1 AND bctk.MaHocKy = $2
         ORDER BY l.TenLop`,
        [monhoc, hocky]
    );
    
    if (result.rows.length > 0) {
        return result.rows;
    }
    
    // Nếu chưa có, tính toán từ dữ liệu điểm
    result = await pool.query(
        `SELECT l.MaLop, l.TenLop, l.SiSo,
                COUNT(CASE WHEN avg_diem.DiemTB >= 5 THEN 1 END) as SoLuongDat
         FROM LOP l
         LEFT JOIN (
             SELECT qth.MaLop, hs.MaHocSinh,
                    SUM(ct.Diem * lhkt.HeSo) / SUM(lhkt.HeSo) as DiemTB
             FROM HOCSINH hs
             JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
             JOIN BANGDIEMMON bdm ON bdm.MaLop = qth.MaLop
             JOIN CT_BANGDIEMMON_HOCSINH ct ON ct.MaBangDiem = bdm.MaBangDiem AND ct.MaHocSinh = hs.MaHocSinh
             JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
             WHERE bdm.MaMonHoc = $1 AND bdm.MaHocKy = $2
             GROUP BY qth.MaLop, hs.MaHocSinh
         ) avg_diem ON avg_diem.MaLop = l.MaLop
         WHERE l.MaNamHoc = $3
         GROUP BY l.MaLop, l.TenLop, l.SiSo
         ORDER BY l.TenLop`,
        [monhoc, hocky, namhoc]
    );
    
    return result.rows;
};

// ========== BÁO CÁO TỔNG KẾT HỌC KỲ ==========
const getSemesterReport = async (namhoc, hocky) => {
    // Lấy báo cáo từ bảng BAOCAOTONGKETHOCKY nếu đã có
    let result = await pool.query(
        `SELECT bctkhk.*, l.TenLop
         FROM BAOCAOTONGKETHOCKY bctkhk
         JOIN LOP l ON bctkhk.MaLop = l.MaLop
         WHERE bctkhk.MaHocKy = $1 AND l.MaNamHoc = $2
         ORDER BY l.TenLop`,
        [hocky, namhoc]
    );
    
    if (result.rows.length > 0) {
        return result.rows;
    }
    
    // Nếu chưa có, tính toán từ dữ liệu điểm (tính điểm TB tất cả môn)
    result = await pool.query(
        `SELECT l.MaLop, l.TenLop, l.SiSo,
                COUNT(CASE WHEN student_avg.DiemTBHK >= 5 THEN 1 END) as SoLuongDat
         FROM LOP l
         LEFT JOIN (
             SELECT qth.MaLop, hs.MaHocSinh,
                    SUM(subject_avg.DiemTBMon * mh.HeSo) / SUM(mh.HeSo) as DiemTBHK
             FROM HOCSINH hs
             JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
             JOIN (
                 SELECT ct.MaHocSinh, bdm.MaMonHoc, bdm.MaLop,
                        SUM(ct.Diem * lhkt.HeSo) / SUM(lhkt.HeSo) as DiemTBMon
                 FROM CT_BANGDIEMMON_HOCSINH ct
                 JOIN BANGDIEMMON bdm ON ct.MaBangDiem = bdm.MaBangDiem
                 JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                 WHERE bdm.MaHocKy = $1
                 GROUP BY ct.MaHocSinh, bdm.MaMonHoc, bdm.MaLop
             ) subject_avg ON subject_avg.MaHocSinh = hs.MaHocSinh AND subject_avg.MaLop = qth.MaLop
             JOIN MONHOC mh ON subject_avg.MaMonHoc = mh.MaMonHoc
             GROUP BY qth.MaLop, hs.MaHocSinh
         ) student_avg ON student_avg.MaLop = l.MaLop
         WHERE l.MaNamHoc = $2
         GROUP BY l.MaLop, l.TenLop, l.SiSo
         ORDER BY l.TenLop`,
        [hocky, namhoc]
    );
    
    return result.rows;
};

// ========== DASHBOARD STATS ==========
const getDashboardStats = async () => {
    const studentsResult = await pool.query('SELECT COUNT(*) as count FROM HOCSINH');
    const classesResult = await pool.query('SELECT COUNT(*) as count FROM LOP');
    const subjectsResult = await pool.query('SELECT COUNT(*) as count FROM MONHOC');
    const teachersResult = await pool.query(
        `SELECT COUNT(*) as count FROM NGUOIDUNG 
         WHERE MaVaiTro IN ('GVBM', 'GVCN')`
    );
    
    return {
        students: parseInt(studentsResult.rows[0].count) || 0,
        classes: parseInt(classesResult.rows[0].count) || 0,
        subjects: parseInt(subjectsResult.rows[0].count) || 0,
        teachers: parseInt(teachersResult.rows[0].count) || 0
    };
};

// ========== THỐNG KÊ THEO KHỐI LỚP ==========
const getStatsByGrade = async () => {
    const result = await pool.query(`
        SELECT 
            kl.MaKhoiLop,
            kl.TenKhoiLop,
            COUNT(DISTINCT l.MaLop) as SoLuongLop,
            COUNT(DISTINCT hs.MaHocSinh) as SoLuongHocSinh,
            COALESCE(ROUND(AVG(l.SiSo), 0), 0) as SiSoTrungBinh
        FROM KHOILOP kl
        LEFT JOIN LOP l ON kl.MaKhoiLop = l.MaKhoiLop
        LEFT JOIN QUATRINHHOC qth ON l.MaLop = qth.MaLop
        LEFT JOIN HOCSINH hs ON qth.MaHocSinh = hs.MaHocSinh
        GROUP BY kl.MaKhoiLop, kl.TenKhoiLop
        ORDER BY kl.MaKhoiLop
    `);
    
    return result.rows;
};

// ========== PHÂN BỐ XẾP LOẠI HỌC LỰC (NĂM HỌC HIỆN TẠI) ==========
const getGradeDistribution = async () => {
    // ULTRA SIMPLE - Chỉ tính AVG tất cả điểm của học sinh
    const result = await pool.query(`
        WITH DiemTrungBinh AS (
            SELECT 
                ct.MaHocSinh,
                AVG(ct.Diem) as DiemTB
            FROM CT_BANGDIEMMON_HOCSINH ct
            JOIN BANGDIEMMON bdm ON ct.MaBangDiem = bdm.MaBangDiem
            JOIN LOP l ON bdm.MaLop = l.MaLop
            WHERE l.MaNamHoc = '2024-2025'
            GROUP BY ct.MaHocSinh
            HAVING COUNT(*) > 0
        ),
        XepLoai AS (
            SELECT 
                CASE 
                    WHEN DiemTB >= 8.0 THEN 'Giỏi'
                    WHEN DiemTB >= 6.5 THEN 'Khá'
                    WHEN DiemTB >= 5.0 THEN 'Trung bình'
                    WHEN DiemTB >= 3.5 THEN 'Yếu'
                    ELSE 'Kém'
                END as XepLoaiHocLuc
            FROM DiemTrungBinh
        )
        SELECT 
            XepLoaiHocLuc,
            COUNT(*) as SoLuong,
            ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM XepLoai), 1) as TiLe
        FROM XepLoai
        GROUP BY XepLoaiHocLuc
        ORDER BY 
            CASE XepLoaiHocLuc
                WHEN 'Giỏi' THEN 1
                WHEN 'Khá' THEN 2
                WHEN 'Trung bình' THEN 3
                WHEN 'Yếu' THEN 4
                WHEN 'Kém' THEN 5
            END
    `);
    
    return result.rows;
};

// ========== HOẠT ĐỘNG GẦN ĐÂY (AUDIT LOG) ==========
const getRecentActivities = async (limit = 10) => {
    const result = await pool.query(`
        SELECT 
            nk.id,
            nk.HanhDong,
            nk.BangMuc,
            nk.MaDoiTuong,
            nk.NgayTao,
            nd.HoTen as NguoiThucHien,
            nd.MaVaiTro
        FROM NHATKY nk
        LEFT JOIN NGUOIDUNG nd ON nk.MaNguoiDung = nd.MaNguoiDung
        ORDER BY nk.NgayTao DESC
        LIMIT $1
    `, [limit]);
    
    return result.rows;
};

// ========== BÁO CÁO TỔNG KẾT THEO LỚP (HK1/HK2/CẢ NĂM) ==========
// Trả về: mỗi hàng là 1 học sinh x 1 môn với điểm TB HK1, HK2, Cả năm
const getClassFinalReport = async (maLop, maNamHoc, maHocKy = null) => {
    const query = `
        SELECT 
            hs.MaHocSinh, hs.HoTen,
            mh.MaMonHoc, mh.TenMonHoc,
            -- Tính điểm TB HK1
            (
                SELECT ROUND(CAST(SUM(ct.Diem * lhkt.HeSo) / NULLIF(SUM(lhkt.HeSo), 0) AS NUMERIC), 2)
                FROM CT_BANGDIEMMON_HOCSINH ct
                JOIN BANGDIEMMON bdm_hk1 ON ct.MaBangDiem = bdm_hk1.MaBangDiem
                JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                WHERE bdm_hk1.MaLop = $1 
                  AND bdm_hk1.MaMonHoc = mh.MaMonHoc
                  AND bdm_hk1.MaHocKy = 'HK1'
                  AND ct.MaHocSinh = hs.MaHocSinh
            ) AS DiemTBHK1,
            -- Tính điểm TB HK2
            (
                SELECT ROUND(CAST(SUM(ct.Diem * lhkt.HeSo) / NULLIF(SUM(lhkt.HeSo), 0) AS NUMERIC), 2)
                FROM CT_BANGDIEMMON_HOCSINH ct
                JOIN BANGDIEMMON bdm_hk2 ON ct.MaBangDiem = bdm_hk2.MaBangDiem
                JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                WHERE bdm_hk2.MaLop = $1 
                  AND bdm_hk2.MaMonHoc = mh.MaMonHoc
                  AND bdm_hk2.MaHocKy = 'HK2'
                  AND ct.MaHocSinh = hs.MaHocSinh
            ) AS DiemTBHK2,
            -- Tính điểm TB cả năm theo công thức: (HK1 + HK2 * 2) / 3
            ROUND(CAST(
                (
                    COALESCE((
                        SELECT SUM(ct.Diem * lhkt.HeSo) / NULLIF(SUM(lhkt.HeSo), 0)
                        FROM CT_BANGDIEMMON_HOCSINH ct
                        JOIN BANGDIEMMON bdm_hk1 ON ct.MaBangDiem = bdm_hk1.MaBangDiem
                        JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                        WHERE bdm_hk1.MaLop = $1 
                          AND bdm_hk1.MaMonHoc = mh.MaMonHoc
                          AND bdm_hk1.MaHocKy = 'HK1'
                          AND ct.MaHocSinh = hs.MaHocSinh
                    ), 0) + 
                    COALESCE((
                        SELECT SUM(ct.Diem * lhkt.HeSo) / NULLIF(SUM(lhkt.HeSo), 0)
                        FROM CT_BANGDIEMMON_HOCSINH ct
                        JOIN BANGDIEMMON bdm_hk2 ON ct.MaBangDiem = bdm_hk2.MaBangDiem
                        JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                        WHERE bdm_hk2.MaLop = $1 
                          AND bdm_hk2.MaMonHoc = mh.MaMonHoc
                          AND bdm_hk2.MaHocKy = 'HK2'
                          AND ct.MaHocSinh = hs.MaHocSinh
                    ), 0) * 2.0
                ) / 3.0 AS NUMERIC), 2) AS DiemTBNam,
            hk1.DiemHanhKiem AS DiemHanhKiemHK1,
            hk1.XepLoai AS HanhKiemHK1,
            hk2.DiemHanhKiem AS DiemHanhKiemHK2,
            hk2.XepLoai AS HanhKiemHK2,
            -- Tính điểm hạnh kiểm cả năm: (HK1 + HK2) / 2
            ROUND(CAST(
                (COALESCE(hk1.DiemHanhKiem, 0) + COALESCE(hk2.DiemHanhKiem, 0)) / 2.0 
                AS NUMERIC), 2) AS DiemHanhKiemCN,
            -- Xếp loại hạnh kiểm cả năm theo điểm TB
            CASE
                WHEN ROUND(CAST(
                    (COALESCE(hk1.DiemHanhKiem, 0) + COALESCE(hk2.DiemHanhKiem, 0)) / 2.0 
                    AS NUMERIC), 2) >= 80 THEN N'Tốt'
                WHEN ROUND(CAST(
                    (COALESCE(hk1.DiemHanhKiem, 0) + COALESCE(hk2.DiemHanhKiem, 0)) / 2.0 
                    AS NUMERIC), 2) >= 65 THEN N'Khá'
                WHEN ROUND(CAST(
                    (COALESCE(hk1.DiemHanhKiem, 0) + COALESCE(hk2.DiemHanhKiem, 0)) / 2.0 
                    AS NUMERIC), 2) >= 50 THEN N'Trung bình'
                WHEN ROUND(CAST(
                    (COALESCE(hk1.DiemHanhKiem, 0) + COALESCE(hk2.DiemHanhKiem, 0)) / 2.0 
                    AS NUMERIC), 2) >= 20 THEN N'Yếu'
                ELSE N'Kém'
            END AS HanhKiemCN
        FROM HOCSINH hs
        JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
        JOIN LOP l ON qth.MaLop = l.MaLop
        CROSS JOIN MONHOC mh
        LEFT JOIN HANHKIEM hk1 ON hk1.MaHocSinh = hs.MaHocSinh 
            AND hk1.MaNamHoc = $2 
            AND hk1.MaHocKy = 'HK1'
        LEFT JOIN HANHKIEM hk2 ON hk2.MaHocSinh = hs.MaHocSinh 
            AND hk2.MaNamHoc = $2 
            AND hk2.MaHocKy = 'HK2'
        WHERE qth.MaLop = $1 
          AND l.MaNamHoc = $2
          AND mh.TenMonHoc IS NOT NULL
        ORDER BY hs.HoTen, mh.TenMonHoc
    `;

    const result = await pool.query(query, [maLop, maNamHoc]);
    
    // Trả về raw data để frontend xử lý
    return result.rows;
};

// ========== LẤY ĐIỂM TK & HỌC LỰC CHO NHẬP HẠNH KIỂM ==========
const getStudentScoresForHanhKiem = async (maLop, maNamHoc, maHocKy) => {
    // Tính điểm trung bình theo học kỳ cho từng môn của từng học sinh trong lớp
    // Hỗ trợ 'HK1', 'HK2' và 'CN' (cả năm theo công thức (HK1 + HK2*2)/3)
    const query = `
        SELECT 
            hs.MaHocSinh, hs.HoTen,
            mh.MaMonHoc, mh.TenMonHoc,
            CASE 
                WHEN $3 = 'HK1' THEN (
                    SELECT ROUND(CAST(SUM(ct.Diem * lhkt.HeSo) / NULLIF(SUM(lhkt.HeSo), 0) AS NUMERIC), 2)
                    FROM CT_BANGDIEMMON_HOCSINH ct
                    JOIN BANGDIEMMON bdm_hk1 ON ct.MaBangDiem = bdm_hk1.MaBangDiem
                    JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                    WHERE bdm_hk1.MaLop = $1 
                      AND bdm_hk1.MaMonHoc = mh.MaMonHoc
                      AND bdm_hk1.MaHocKy = 'HK1'
                      AND ct.MaHocSinh = hs.MaHocSinh
                )
                WHEN $3 = 'HK2' THEN (
                    SELECT ROUND(CAST(SUM(ct.Diem * lhkt.HeSo) / NULLIF(SUM(lhkt.HeSo), 0) AS NUMERIC), 2)
                    FROM CT_BANGDIEMMON_HOCSINH ct
                    JOIN BANGDIEMMON bdm_hk2 ON ct.MaBangDiem = bdm_hk2.MaBangDiem
                    JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                    WHERE bdm_hk2.MaLop = $1 
                      AND bdm_hk2.MaMonHoc = mh.MaMonHoc
                      AND bdm_hk2.MaHocKy = 'HK2'
                      AND ct.MaHocSinh = hs.MaHocSinh
                )
                WHEN $3 = 'CN' OR $3 = 'Nam' THEN ROUND(CAST((
                    COALESCE((
                        SELECT SUM(ct.Diem * lhkt.HeSo) / NULLIF(SUM(lhkt.HeSo), 0)
                        FROM CT_BANGDIEMMON_HOCSINH ct
                        JOIN BANGDIEMMON bdm_hk1 ON ct.MaBangDiem = bdm_hk1.MaBangDiem
                        JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                        WHERE bdm_hk1.MaLop = $1 
                          AND bdm_hk1.MaMonHoc = mh.MaMonHoc
                          AND bdm_hk1.MaHocKy = 'HK1'
                          AND ct.MaHocSinh = hs.MaHocSinh
                    ), 0) + 
                    COALESCE((
                        SELECT SUM(ct.Diem * lhkt.HeSo) / NULLIF(SUM(lhkt.HeSo), 0)
                        FROM CT_BANGDIEMMON_HOCSINH ct
                        JOIN BANGDIEMMON bdm_hk2 ON ct.MaBangDiem = bdm_hk2.MaBangDiem
                        JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                        WHERE bdm_hk2.MaLop = $1 
                          AND bdm_hk2.MaMonHoc = mh.MaMonHoc
                          AND bdm_hk2.MaHocKy = 'HK2'
                          AND ct.MaHocSinh = hs.MaHocSinh
                    ), 0) * 2.0
                ) / 3.0 AS NUMERIC), 2)
            END AS DiemMon
        FROM HOCSINH hs
        JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
        CROSS JOIN MONHOC mh
        WHERE qth.MaLop = $1
        ORDER BY hs.HoTen, mh.TenMonHoc
    `;

    const result = await pool.query(query, [maLop, maNamHoc, maHocKy]);
    return result.rows;
};

// ========== EXPORTS ==========
module.exports = {
    getSubjectReport,
    getSemesterReport,
    getDashboardStats,
    getStatsByGrade,
    getGradeDistribution,
    getRecentActivities,
    getClassFinalReport,
    getStudentScoresForHanhKiem
};