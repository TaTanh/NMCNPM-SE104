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

// ========== LẤY TỔNG KẾT LỚP (ĐIỂM TB, XẾP LOẠI, HẠNH KIỂM) ==========
const getClassSummary = async (maLop, maNamHoc, maHocKy) => {
    const query = `
        SELECT 
            hs.MaHocSinh,
            hs.HoTen,
            hs.GioiTinh,
            hs.NgaySinh,
            -- Điểm trung bình cả kỳ
            ROUND(AVG(cbdh.Diem)::NUMERIC, 2) AS DiemTrungBinh,
            -- Đếm số môn đã có điểm
            COUNT(DISTINCT bdm.MaMonHoc) AS SoMonCoDiem,
            -- Xếp loại học lực
            CASE 
                WHEN AVG(cbdh.Diem) >= 8 THEN 'Giỏi'
                WHEN AVG(cbdh.Diem) >= 6.5 THEN 'Khá'
                WHEN AVG(cbdh.Diem) >= 5 THEN 'Trung bình'
                ELSE 'Yếu'
            END AS XepLoaiHocLuc,
            -- Hạnh kiểm
            COALESCE(hk.XepLoai, '') AS XepLoaiHanhKiem,
            COALESCE(hk.GhiChu, '') AS GhiChuHanhKiem
        FROM HOCSINH hs
        JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
        LEFT JOIN CT_BANGDIEMMON_HOCSINH cbdh ON hs.MaHocSinh = cbdh.MaHocSinh
        LEFT JOIN BANGDIEMMON bdm ON cbdh.MaBangDiem = bdm.MaBangDiem 
            AND bdm.MaLop = $1 AND bdm.MaHocKy = $3
        LEFT JOIN HANHKIEM hk ON hs.MaHocSinh = hk.MaHocSinh 
            AND hk.MaNamHoc = $2 AND hk.MaHocKy = $3
        WHERE qth.MaLop = $1
        GROUP BY hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hk.XepLoai, hk.GhiChu
        ORDER BY hs.MaHocSinh ASC
    `;
    
    const result = await pool.query(query, [maLop, maNamHoc, maHocKy]);
    
    // Thêm tổng số môn vào kết quả
    const totalSubjectsResult = await pool.query(`
        SELECT COUNT(DISTINCT MaMonHoc) AS TongSoMon
        FROM BANGDIEMMON
        WHERE MaLop = $1 AND MaHocKy = $2
    `, [maLop, maHocKy]);
    
    const tongSoMon = parseInt(totalSubjectsResult.rows[0]?.tongsomon || 0);
    
    return result.rows.map(row => ({
        ...row,
        tongsomon: tongSoMon
    }));
};

// ========== LẤY TỔNG KẾT LỚP VỚI ĐIỂM TỪNG MÔN ==========
const getClassSummaryWithSubjectGrades = async (maLop, maNamHoc, maHocKy) => {
    // Lấy danh sách học sinh + điểm trung bình + hạnh kiểm
    const studentQuery = `
        SELECT 
            hs.MaHocSinh,
            hs.HoTen,
            hs.GioiTinh,
            hs.NgaySinh,
            ROUND(AVG(CASE WHEN cbdh.MaBangDiem IS NOT NULL THEN cbdh.Diem END)::NUMERIC, 2) AS DiemTrungBinh,
            COUNT(DISTINCT CASE WHEN cbdh.MaBangDiem IS NOT NULL THEN bdm.MaMonHoc END) AS SoMonCoDiem,
            CASE 
                WHEN AVG(CASE WHEN cbdh.MaBangDiem IS NOT NULL THEN cbdh.Diem END) >= 8 THEN 'Giỏi'
                WHEN AVG(CASE WHEN cbdh.MaBangDiem IS NOT NULL THEN cbdh.Diem END) >= 6.5 THEN 'Khá'
                WHEN AVG(CASE WHEN cbdh.MaBangDiem IS NOT NULL THEN cbdh.Diem END) >= 5 THEN 'Trung bình'
                ELSE 'Yếu'
            END AS XepLoaiHocLuc,
            COALESCE(hk.XepLoai, NULL) AS XepLoaiHanhKiem,
            COALESCE(hk.GhiChu, '') AS GhiChuHanhKiem
        FROM HOCSINH hs
        JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
        LEFT JOIN CT_BANGDIEMMON_HOCSINH cbdh ON hs.MaHocSinh = cbdh.MaHocSinh
        LEFT JOIN BANGDIEMMON bdm ON cbdh.MaBangDiem = bdm.MaBangDiem 
            AND bdm.MaLop = $1 AND bdm.MaHocKy = $3
        LEFT JOIN HANHKIEM hk ON hs.MaHocSinh = hk.MaHocSinh 
            AND hk.MaNamHoc = $2 AND hk.MaHocKy = $3
        WHERE qth.MaLop = $1
        GROUP BY hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hk.XepLoai, hk.GhiChu
        ORDER BY hs.MaHocSinh ASC
    `;
    
    const studentsResult = await pool.query(studentQuery, [maLop, maNamHoc, maHocKy]);
    
    // Lấy danh sách môn
    const subjectsQuery = `
        SELECT DISTINCT mh.MaMonHoc, mh.TenMonHoc
        FROM MONHOC mh
        JOIN BANGDIEMMON bdm ON mh.MaMonHoc = bdm.MaMonHoc
        WHERE bdm.MaLop = $1 AND bdm.MaHocKy = $2
        ORDER BY mh.MaMonHoc
    `;
    
    const subjectsResult = await pool.query(subjectsQuery, [maLop, maHocKy]);
    
    // Lấy điểm từng môn cho mỗi học sinh
    const gradesQuery = `
        SELECT 
            cbdh.MaHocSinh,
            bdm.MaMonHoc,
            ROUND(AVG(cbdh.Diem)::NUMERIC, 2) AS DiemMonHoc
        FROM CT_BANGDIEMMON_HOCSINH cbdh
        JOIN BANGDIEMMON bdm ON cbdh.MaBangDiem = bdm.MaBangDiem
        WHERE bdm.MaLop = $1 AND bdm.MaHocKy = $2
        GROUP BY cbdh.MaHocSinh, bdm.MaMonHoc
    `;
    
    const gradesResult = await pool.query(gradesQuery, [maLop, maHocKy]);
    
    // Map điểm theo học sinh
    const gradesMap = {};
    gradesResult.rows.forEach(row => {
        if (!gradesMap[row.mahocsinh]) {
            gradesMap[row.mahocsinh] = {};
        }
        gradesMap[row.mahocsinh][row.mamonhoc] = row.diemmonhoc;
    });
    
    // Combine dữ liệu
    const result = studentsResult.rows.map(student => ({
        ...student,
        subjectgrades: gradesMap[student.mahocsinh] || {}
    }));
    
    return {
        students: result,
        subjects: subjectsResult.rows
    };
};

// ========== LẤY DANH SÁCH MÔN CÓ ĐIỂM TRONG LỚP ==========
const getSubjectsInClass = async (maLop, maHocKy) => {
    const query = `
        SELECT DISTINCT bdm.MaMonHoc, mh.TenMonHoc
        FROM BANGDIEMMON bdm
        JOIN MONHOC mh ON bdm.MaMonHoc = mh.MaMonHoc
        WHERE bdm.MaLop = $1 AND bdm.MaHocKy = $2
        ORDER BY mh.TenMonHoc ASC
    `;
    
    const result = await pool.query(query, [maLop, maHocKy]);
    return result.rows;
};

// ========== LẤY ĐIỂM TỪNG MÔN CỦA MỘT HỌC SINH ==========
const getStudentSubjectGrades = async (maHocSinh, maLop, maHocKy) => {
    const query = `
        SELECT 
            bdm.MaMonHoc,
            mh.TenMonHoc,
            ROUND(AVG(cbdh.Diem)::NUMERIC, 2) AS DiemTrungBinh
        FROM CT_BANGDIEMMON_HOCSINH cbdh
        JOIN BANGDIEMMON bdm ON cbdh.MaBangDiem = bdm.MaBangDiem
        JOIN MONHOC mh ON bdm.MaMonHoc = mh.MaMonHoc
        WHERE cbdh.MaHocSinh = $1
          AND bdm.MaLop = $2
          AND bdm.MaHocKy = $3
        GROUP BY bdm.MaMonHoc, mh.TenMonHoc
        ORDER BY mh.TenMonHoc ASC
    `;
    
    const result = await pool.query(query, [maHocSinh, maLop, maHocKy]);
    return result.rows;
};

module.exports = {
    getSubjectReport,
    getSemesterReport,
    getDashboardStats,
    getClassSummary,
    getClassSummaryWithSubjectGrades,
    getSubjectsInClass,
    getStudentSubjectGrades
};
