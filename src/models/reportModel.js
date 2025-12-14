const pool = require('../config/db');

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
    
    return {
        students: parseInt(studentsResult.rows[0].count) || 0,
        classes: parseInt(classesResult.rows[0].count) || 0,
        subjects: parseInt(subjectsResult.rows[0].count) || 0,
        teachers: 0 // Chưa có bảng giáo viên
    };
};

module.exports = {
    getSubjectReport,
    getSemesterReport,
    getDashboardStats
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
            hk1.XepLoai AS HanhKiemHK1,
            hk2.XepLoai AS HanhKiemHK2,
            hkcn.XepLoai AS HanhKiemCN
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
        LEFT JOIN HANHKIEM hkcn ON hkcn.MaHocSinh = hs.MaHocSinh 
            AND hkcn.MaNamHoc = $2 
            AND hkcn.MaHocKy = 'CN'
        WHERE qth.MaLop = $1 AND l.MaNamHoc = $2
        ORDER BY hs.HoTen, mh.TenMonHoc
    `;

    const result = await pool.query(query, [maLop, maNamHoc]);
    return result.rows;
};

module.exports.getClassFinalReport = getClassFinalReport;

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

module.exports.getStudentScoresForHanhKiem = getStudentScoresForHanhKiem;
