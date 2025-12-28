const pool = require('../config/db');

// ========== LẤY BẢNG ĐIỂM MÔN CỦA LỚP (CỦ - GIỮ LẠI CHO TƯƠNG THÍCH) ==========
const getClassSubjectGrades = async (maLop, maMonHoc, hocky = null) => {
    let query = `
        SELECT 
            hs.MaHocSinh, hs.HoTen,
            bdm.MaBangDiem, bdm.MaHocKy,
            ct.Diem, lhkt.TenLHKT, lhkt.HeSo as HeSoLoaiKT
        FROM HOCSINH hs
        JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
        LEFT JOIN BANGDIEMMON bdm ON bdm.MaLop = qth.MaLop AND bdm.MaMonHoc = $2
        LEFT JOIN CT_BANGDIEMMON_HOCSINH ct ON ct.MaBangDiem = bdm.MaBangDiem AND ct.MaHocSinh = hs.MaHocSinh
        LEFT JOIN CT_BANGDIEMMON_LHKT ctlhkt ON ctlhkt.MaBangDiem = bdm.MaBangDiem
        LEFT JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
        WHERE qth.MaLop = $1
    `;
    
    const params = [maLop, maMonHoc];
    
    if (hocky) {
        params.push(hocky);
        query += ` AND bdm.MaHocKy = $${params.length}`;
    }
    
    query += ' ORDER BY hs.HoTen, lhkt.HeSo';
    
    const result = await pool.query(query, params);
    return result.rows;
};

// ========== LẤY BẢNG ĐIỂM MÔN CỦA LỚP - CẢ 3 HỌC KỲ (MỚI) ==========
const getClassSubjectGradesAllSemesters = async (maLop, maMonHoc) => {
    const query = `
        SELECT 
            hs.MaHocSinh, hs.HoTen,
            lhkt.TenLHKT, lhkt.HeSo,
            -- Điểm HK1
            (
                SELECT ct.Diem
                FROM CT_BANGDIEMMON_HOCSINH ct
                JOIN BANGDIEMMON bdm ON ct.MaBangDiem = bdm.MaBangDiem
                WHERE bdm.MaLop = $1 
                  AND bdm.MaMonHoc = $2
                  AND bdm.MaHocKy = 'HK1'
                  AND ct.MaHocSinh = hs.MaHocSinh
                  AND ct.MaLHKT = lhkt.MaLHKT
            ) AS DiemHK1,
            -- Điểm HK2
            (
                SELECT ct.Diem
                FROM CT_BANGDIEMMON_HOCSINH ct
                JOIN BANGDIEMMON bdm ON ct.MaBangDiem = bdm.MaBangDiem
                WHERE bdm.MaLop = $1 
                  AND bdm.MaMonHoc = $2
                  AND bdm.MaHocKy = 'HK2'
                  AND ct.MaHocSinh = hs.MaHocSinh
                  AND ct.MaLHKT = lhkt.MaLHKT
            ) AS DiemHK2
        FROM HOCSINH hs
        JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
        CROSS JOIN LOAIHINHKIEMTRA lhkt
        WHERE qth.MaLop = $1
        ORDER BY hs.HoTen, lhkt.HeSo
    `;
    
    const result = await pool.query(query, [maLop, maMonHoc]);
    return result.rows;
};

// ========== LẤY LOẠI HÌNH KIỂM TRA ==========
const getExamTypes = async () => {
    const result = await pool.query(
        'SELECT MaLHKT, TenLHKT, HeSo FROM LOAIHINHKIEMTRA ORDER BY HeSo'
    );
    return result.rows;
};

// ========== LẤY GIỚI HẠN ĐIỂM TỪ THAM SỐ ==========
const getGradeLimits = async () => {
    const result = await pool.query(
        "SELECT TenThamSo, GiaTri FROM THAMSO WHERE TenThamSo IN ('DiemToiThieu', 'DiemToiDa')"
    );
    
    let diemMin = 0, diemMax = 10;
    result.rows.forEach(row => {
        if (row.tenthamso === 'DiemToiThieu') diemMin = parseFloat(row.giatri);
        if (row.tenthamso === 'DiemToiDa') diemMax = parseFloat(row.giatri);
    });
    
    return { diemMin, diemMax };
};

// ========== CẬP NHẬT ĐIỂM ==========
const upsertGrade = async (gradeData) => {
    const { MaBangDiem, MaHocSinh, MaLHKT, Diem } = gradeData;
    
    // Nếu điểm rỗng/null → XÓA record thay vì lưu NULL
    if (Diem === null || Diem === undefined || Diem === '') {
        const result = await pool.query(
            `DELETE FROM CT_BANGDIEMMON_HOCSINH 
             WHERE MaBangDiem = $1 AND MaHocSinh = $2 AND MaLHKT = $3
             RETURNING *`,
            [MaBangDiem, MaHocSinh, MaLHKT]
        );
        return result.rows[0] || { deleted: true };
    }
    
    // Nếu có điểm hợp lệ → INSERT hoặc UPDATE
    const result = await pool.query(
        `INSERT INTO CT_BANGDIEMMON_HOCSINH (MaBangDiem, MaHocSinh, MaLHKT, Diem)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (MaBangDiem, MaHocSinh, MaLHKT) 
         DO UPDATE SET Diem = $4
         RETURNING *`,
        [MaBangDiem, MaHocSinh, MaLHKT, Diem]
    );
    return result.rows[0];
};

// ========== LẤY BẢNG ĐIỂM MÔN ==========
const findGradeSheet = async (maLop, maMonHoc, maHocKy) => {
    const result = await pool.query(
        'SELECT * FROM BANGDIEMMON WHERE MaLop = $1 AND MaMonHoc = $2 AND MaHocKy = $3',
        [maLop, maMonHoc, maHocKy]
    );
    return result.rows[0] || null;
};

// ========== TẠO BẢNG ĐIỂM MÔN ==========
const createGradeSheet = async (maLop, maMonHoc, maHocKy) => {
    const maBangDiem = `BDM_${maLop}_${maMonHoc}_${maHocKy}`;
    const result = await pool.query(
        `INSERT INTO BANGDIEMMON (MaBangDiem, MaLop, MaMonHoc, MaHocKy)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [maBangDiem, maLop, maMonHoc, maHocKy]
    );
    return result.rows[0];
};

// ========== LẤY ĐIỂM CỦA HỌC SINH ==========
const getStudentGrades = async (maBangDiem, maHocSinh) => {
    const result = await pool.query(
        `SELECT ct.Diem, lhkt.HeSo 
         FROM CT_BANGDIEMMON_HOCSINH ct
         JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
         WHERE ct.MaBangDiem = $1 AND ct.MaHocSinh = $2`,
        [maBangDiem, maHocSinh]
    );
    return result.rows;
};

// ========== LẤY ĐIỂM ĐẠT MÔN ==========
const getPassingGrade = async () => {
    const result = await pool.query(
        "SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemDatMon'"
    );
    return result.rows.length > 0 ? parseFloat(result.rows[0].giatri) : 5;
};

// ========== LẤY LỚP CỦA HỌC SINH ==========
const getStudentClass = async (maHocSinh, namhoc = null) => {
    let query = `
        SELECT l.MaLop, l.MaNamHoc 
        FROM QUATRINHHOC qth 
        JOIN LOP l ON qth.MaLop = l.MaLop 
        WHERE qth.MaHocSinh = $1
    `;
    const params = [maHocSinh];
    if (namhoc) {
        params.push(namhoc);
        query += ` AND l.MaNamHoc = $${params.length}`;
    }
    query += ' LIMIT 1';
    
    const result = await pool.query(query, params);
    return result.rows[0] || null;
};

// ========== LẤY TẤT CẢ MÔN HỌC ==========
const getAllSubjects = async () => {
    const result = await pool.query('SELECT MaMonHoc, TenMonHoc FROM MONHOC ORDER BY TenMonHoc');
    return result.rows;
};

// ========== LẤY TẤT CẢ HỌC KỲ ==========
const getAllSemesters = async (hocky = null) => {
    let query = 'SELECT MaHocKy, TenHocKy FROM HOCKY';
    const params = [];
    if (hocky) {
        params.push(hocky);
        query += ` WHERE MaHocKy = $1`;
    }
    query += ' ORDER BY MaHocKy';
    const result = await pool.query(query, params);
    return result.rows;
};

// ========== LẤY ĐIỂM TỔNG HỢP CỦA HỌC SINH ==========
const getStudentAllGrades = async (maHocSinh, maLop, hocky = null) => {
    let query = `
        SELECT 
            mh.MaMonHoc, mh.TenMonHoc,
            bdm.MaBangDiem, bdm.MaHocKy,
            hk.TenHocKy,
            ct.Diem, lhkt.TenLHKT, lhkt.HeSo
        FROM BANGDIEMMON bdm
        JOIN MONHOC mh ON bdm.MaMonHoc = mh.MaMonHoc
        JOIN HOCKY hk ON bdm.MaHocKy = hk.MaHocKy
        LEFT JOIN CT_BANGDIEMMON_HOCSINH ct ON ct.MaBangDiem = bdm.MaBangDiem AND ct.MaHocSinh = $1
        LEFT JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
        WHERE bdm.MaLop = $2
    `;
    
    const params = [maHocSinh, maLop];
    
    if (hocky) {
        params.push(hocky);
        query += ` AND bdm.MaHocKy = $${params.length}`;
    }
    
    query += ' ORDER BY mh.TenMonHoc, lhkt.HeSo';
    
    const result = await pool.query(query, params);
    return result.rows;
};

// ========== TÍNH ĐIỂM TRUNG BÌNH HỌC KỲ ==========
const calculateSemesterAverage = async (maHocSinh, maLop, maMonHoc, maHocKy) => {
    const result = await pool.query(
        'SELECT fn_TinhDiemTB($1, $2, $3, $4) as diem_tb',
        [maLop, maMonHoc, maHocSinh, maHocKy]
    );
    return result.rows[0]?.diem_tb || null;
};

// ========== TÍNH ĐIỂM TRUNG BÌNH NĂM ==========
const calculateYearAverage = async (maHocSinh, maLop, maMonHoc, maNamHoc) => {
    const result = await pool.query(
        'SELECT fn_TinhDiemTBNam($1, $2, $3, $4) as diem_tb_nam',
        [maLop, maMonHoc, maHocSinh, maNamHoc]
    );
    return result.rows[0]?.diem_tb_nam || null;
};

// ========== LẤY TỔNG KẾT HỌC KỲ CỦA HỌC SINH ==========
const getStudentSemesterSummary = async (maHocSinh, maLop, maNamHoc, maHocKy) => {
    const query = `
        SELECT 
            mh.MaMonHoc,
            mh.TenMonHoc,
            fn_TinhDiemTB($2, mh.MaMonHoc, $1, $4) as DiemTBHocKy
        FROM MONHOC mh
        WHERE EXISTS (
            SELECT 1 FROM BANGDIEMMON bdm
            WHERE bdm.MaLop = $2 AND bdm.MaMonHoc = mh.MaMonHoc AND bdm.MaHocKy = $4
        )
        ORDER BY mh.TenMonHoc
    `;
    
    const result = await pool.query(query, [maHocSinh, maLop, maNamHoc, maHocKy]);
    return result.rows;
};

// ========== LẤY TỔNG KẾT NĂM CỦA HỌC SINH ==========
const getStudentYearSummary = async (maHocSinh, maLop, maNamHoc) => {
    const query = `
        SELECT 
            mh.MaMonHoc,
            mh.TenMonHoc,
            fn_TinhDiemTB($2, mh.MaMonHoc, $1, 1) as DiemTBHK1,
            fn_TinhDiemTB($2, mh.MaMonHoc, $1, 2) as DiemTBHK2,
            fn_TinhDiemTBNam($2, mh.MaMonHoc, $1, $3) as DiemTBNam
        FROM MONHOC mh
        WHERE EXISTS (
            SELECT 1 FROM BANGDIEMMON bdm
            JOIN LOP l ON bdm.MaLop = l.MaLop
            WHERE bdm.MaLop = $2 AND bdm.MaMonHoc = mh.MaMonHoc AND l.MaNamHoc = $3
        )
        ORDER BY mh.TenMonHoc
    `;
    
    const result = await pool.query(query, [maHocSinh, maLop, maNamHoc]);
    return result.rows;
};

module.exports = {
    getClassSubjectGrades,
    getExamTypes,
    getGradeLimits,
    upsertGrade,
    findGradeSheet,
    createGradeSheet,
    getStudentGrades,
    getPassingGrade,
    getStudentClass,
    getAllSubjects,
    getAllSemesters,
    getStudentAllGrades,
    calculateSemesterAverage,
    calculateYearAverage,
    getStudentSemesterSummary,
    getStudentYearSummary,
    getClassSubjectGradesAllSemesters
};
