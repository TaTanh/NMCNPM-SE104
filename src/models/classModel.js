const pool = require('../config/db');

// ========== LẤY TẤT CẢ LỚP (với sĩ số thực tế) ==========
const findAll = async (filters = {}) => {
    const { namhoc, khoi } = filters;
    
    let query = `
        SELECT l.MaLop, l.TenLop, kl.TenKhoiLop as Khoi,
               COALESCE(hs_count.siso, 0) as SiSo, 
               l.MaNamHoc as NamHoc, l.MaKhoiLop, l.MaGVCN,
               nd.HoTen as TenGVCN
        FROM LOP l
        JOIN KHOILOP kl ON l.MaKhoiLop = kl.MaKhoiLop
        LEFT JOIN NGUOIDUNG nd ON l.MaGVCN = nd.MaNguoiDung
        LEFT JOIN (
            SELECT MaLop, COUNT(*) as siso 
            FROM QUATRINHHOC 
            GROUP BY MaLop
        ) hs_count ON l.MaLop = hs_count.MaLop
    `;
    
    const params = [];
    const conditions = [];
    
    if (namhoc) {
        params.push(namhoc);
        conditions.push(`l.MaNamHoc = $${params.length}`);
    }
    
    if (khoi) {
        params.push(khoi);
        conditions.push(`l.MaKhoiLop = $${params.length}`);
    }
    
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY l.TenLop';
    
    const result = await pool.query(query, params);
    return result.rows;
};

// ========== LẤY 1 LỚP THEO MÃ ==========
const findById = async (id) => {
    const result = await pool.query(
        `SELECT l.*, kl.TenKhoiLop as Khoi, nd.HoTen as TenGVCN
         FROM LOP l
         JOIN KHOILOP kl ON l.MaKhoiLop = kl.MaKhoiLop
         LEFT JOIN NGUOIDUNG nd ON l.MaGVCN = nd.MaNguoiDung
         WHERE l.MaLop = $1`,
        [id]
    );
    return result.rows[0] || null;
};

// ========== TẠO LỚP MỚI ==========
const create = async (classData) => {
    const { MaLop, TenLop, MaKhoiLop, MaNamHoc, SiSo, MaGVCN } = classData;
    const result = await pool.query(
        `INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc, MaGVCN)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [MaLop, TenLop, MaKhoiLop, SiSo || 0, MaNamHoc, MaGVCN]
    );
    return result.rows[0];
};

// ========== CẬP NHẬT LỚP ==========
const update = async (id, classData) => {
    const { TenLop, MaKhoiLop, MaNamHoc, SiSo, MaGVCN } = classData;
    const result = await pool.query(
        `UPDATE LOP 
         SET TenLop = $1, MaKhoiLop = $2, MaNamHoc = $3, SiSo = $4, MaGVCN = $5
         WHERE MaLop = $6
         RETURNING *`,
        [TenLop, MaKhoiLop, MaNamHoc, SiSo || 0, MaGVCN, id]
    );
    return result.rows[0] || null;
};

// ========== XÓA LỚP ==========
const remove = async (id) => {
    const result = await pool.query(
        'DELETE FROM LOP WHERE MaLop = $1 RETURNING *',
        [id]
    );
    return result.rows[0] || null;
};

// ========== KIỂM TRA LỚP CÓ HỌC SINH KHÔNG ==========
const hasStudents = async (id) => {
    const result = await pool.query(
        'SELECT 1 FROM QUATRINHHOC WHERE MaLop = $1 LIMIT 1',
        [id]
    );
    return result.rows.length > 0;
};

// ========== LẤY DANH SÁCH HỌC SINH TRONG LỚP ==========
const getStudents = async (id) => {
    const result = await pool.query(
        `SELECT hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hs.DiaChi, hs.Email,
                hs.HoTenPhuHuynh, hs.SdtPhuHuynh
         FROM HOCSINH hs
         JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
         WHERE qth.MaLop = $1
         ORDER BY hs.HoTen`,
        [id]
    );
    return result.rows;
};

// ========== ĐẾM SỐ HỌC SINH TRONG LỚP ==========
const countStudents = async (id) => {
    const result = await pool.query(
        'SELECT COUNT(*) as siso FROM QUATRINHHOC WHERE MaLop = $1',
        [id]
    );
    return parseInt(result.rows[0].siso);
};

// ========== THÊM HỌC SINH VÀO LỚP ==========
const addStudent = async (maLop, maHocSinh) => {
    await pool.query(
        'INSERT INTO QUATRINHHOC (MaHocSinh, MaLop) VALUES ($1, $2)',
        [maHocSinh, maLop]
    );
    // Cập nhật sĩ số của lớp
    await pool.query(
        'UPDATE LOP SET SiSo = SiSo + 1 WHERE MaLop = $1',
        [maLop]
    );
    return true;
};

// ========== XÓA HỌC SINH KHỎI LỚP ==========
const removeStudent = async (maLop, maHocSinh) => {
    const result = await pool.query(
        'DELETE FROM QUATRINHHOC WHERE MaLop = $1 AND MaHocSinh = $2 RETURNING *',
        [maLop, maHocSinh]
    );
    if (result.rows.length > 0) {
        // Cập nhật sĩ số của lớp
        await pool.query(
            'UPDATE LOP SET SiSo = GREATEST(SiSo - 1, 0) WHERE MaLop = $1',
            [maLop]
        );
        return result.rows[0];
    }
    return null;
};

// ========== KIỂM TRA HỌC SINH ĐÃ TRONG LỚP CỦA NĂM HỌC ==========
const checkStudentInYearClass = async (maHocSinh, maNamHoc) => {
    const result = await pool.query(
        `SELECT l.TenLop 
         FROM QUATRINHHOC qth
         JOIN LOP l ON qth.MaLop = l.MaLop
         WHERE qth.MaHocSinh = $1 AND l.MaNamHoc = $2`,
        [maHocSinh, maNamHoc]
    );
    return result.rows[0] || null;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
    hasStudents,
    getStudents,
    countStudents,
    addStudent,
    removeStudent,
    checkStudentInYearClass
};
