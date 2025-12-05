const pool = require('../config/db');

// ========== LẤY TẤT CẢ HỌC SINH KÈM THÔNG TIN LỚP ==========
const findAllWithClass = async () => {
    const result = await pool.query(`
        SELECT hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hs.DiaChi, hs.Email,
               hs.HoTenPhuHuynh, hs.SdtPhuHuynh,
               l.MaLop, l.TenLop, l.MaNamHoc
        FROM HOCSINH hs
        LEFT JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
        LEFT JOIN LOP l ON qth.MaLop = l.MaLop
        ORDER BY hs.MaHocSinh ASC
    `);
    return result.rows;
};

// ========== LẤY DANH SÁCH HỌC SINH (có filter) ==========
const findAll = async (filters = {}) => {
    const { namhoc, lop, khoi, search } = filters;
    
    let query = `
        SELECT hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hs.DiaChi, hs.Email,
               hs.HoTenPhuHuynh, hs.SdtPhuHuynh
        FROM HOCSINH hs
    `;
    
    const params = [];
    const conditions = [];
    
    // Nếu có filter theo lớp/namhoc/khoi, cần JOIN với QUATRINHHOC và LOP
    if (lop || namhoc || khoi || search) {
        query = `
            SELECT DISTINCT hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hs.DiaChi, hs.Email,
                   hs.HoTenPhuHuynh, hs.SdtPhuHuynh,
                   l.TenLop, l.MaLop
            FROM HOCSINH hs
            LEFT JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
            LEFT JOIN LOP l ON qth.MaLop = l.MaLop
        `;
        
        if (lop) {
            params.push(lop);
            conditions.push(`l.MaLop = $${params.length}`);
        }
        
        if (namhoc) {
            params.push(namhoc);
            conditions.push(`l.MaNamHoc = $${params.length}`);
        }
        
        if (khoi) {
            params.push(khoi);
            conditions.push(`l.MaKhoiLop = $${params.length}`);
        }
        
        // Tìm kiếm theo tên hoặc mã học sinh
        if (search) {
            params.push(`%${search}%`);
            conditions.push(`(LOWER(hs.HoTen) LIKE LOWER($${params.length}) OR LOWER(hs.MaHocSinh) LIKE LOWER($${params.length}))`);
        }
    }
    
    if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Sắp xếp theo mã học sinh tăng dần (HS001, HS002, HS003...)
    query += ' ORDER BY hs.MaHocSinh ASC';
    
    const result = await pool.query(query, params);
    return result.rows;
};

// ========== LẤY 1 HỌC SINH THEO MÃ ==========
const findById = async (id) => {
    const result = await pool.query(
        'SELECT * FROM HOCSINH WHERE MaHocSinh = $1',
        [id]
    );
    return result.rows[0] || null;
};

// ========== TẠO HỌC SINH MỚI ==========
const create = async (studentData) => {
    const { MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh } = studentData;
    const result = await pool.query(
        `INSERT INTO HOCSINH (MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh]
    );
    return result.rows[0];
};

// ========== CẬP NHẬT HỌC SINH ==========
const update = async (id, studentData) => {
    const { HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh } = studentData;
    const result = await pool.query(
        `UPDATE HOCSINH 
         SET HoTen = $1, GioiTinh = $2, NgaySinh = $3, DiaChi = $4, Email = $5,
             HoTenPhuHuynh = $6, SdtPhuHuynh = $7
         WHERE MaHocSinh = $8
         RETURNING *`,
        [HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh, id]
    );
    return result.rows[0] || null;
};

// ========== XÓA HỌC SINH ==========
const remove = async (id) => {
    const result = await pool.query(
        'DELETE FROM HOCSINH WHERE MaHocSinh = $1 RETURNING *',
        [id]
    );
    return result.rows[0] || null;
};

// ========== KIỂM TRA HỌC SINH CÓ TRONG LỚP KHÔNG ==========
const isInClass = async (id) => {
    try {
        const result = await pool.query(
            'SELECT 1 FROM QUATRINHHOC WHERE MaHocSinh = $1 LIMIT 1',
            [id]
        );
        return result.rows.length > 0;
    } catch (e) {
        // Bảng QUATRINHHOC có thể không tồn tại
        return false;
    }
};

// ========== KIỂM TRA HỌC SINH CÓ ĐIỂM KHÔNG ==========
const hasGrades = async (id) => {
    try {
        const result = await pool.query(
            'SELECT 1 FROM CT_BANGDIEMMON_HOCSINH WHERE MaHocSinh = $1 LIMIT 1',
            [id]
        );
        return result.rows.length > 0;
    } catch (e) {
        // Bảng CT_BANGDIEMMON_HOCSINH có thể không tồn tại
        return false;
    }
};

module.exports = {
    findAllWithClass,
    findAll,
    findById,
    create,
    update,
    remove,
    isInClass,
    hasGrades
};
