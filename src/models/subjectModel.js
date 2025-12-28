const pool = require('../config/db');

// ========== LẤY TẤT CẢ MÔN HỌC ==========
const findAll = async () => {
    const result = await pool.query(
        'SELECT MaMonHoc, TenMonHoc, HeSo FROM MONHOC ORDER BY MaMonHoc ASC'
    );
    return result.rows;
};

// ========== LẤY 1 MÔN HỌC THEO MÃ ==========
const findById = async (id) => {
    const result = await pool.query(
        'SELECT * FROM MONHOC WHERE MaMonHoc = $1',
        [id]
    );
    return result.rows[0] || null;
};

// ========== TẠO MÔN HỌC MỚI ==========
const create = async (subjectData) => {
    const { MaMonHoc, TenMonHoc, HeSo } = subjectData;
    const result = await pool.query(
        `INSERT INTO MONHOC (MaMonHoc, TenMonHoc, HeSo)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [MaMonHoc, TenMonHoc, HeSo]
    );
    return result.rows[0];
};

// ========== CẬP NHẬT MÔN HỌC ==========
const update = async (id, subjectData) => {
    const { TenMonHoc, HeSo } = subjectData;
    const result = await pool.query(
        `UPDATE MONHOC 
         SET TenMonHoc = $1, HeSo = $2
         WHERE MaMonHoc = $3
         RETURNING *`,
        [TenMonHoc, HeSo, id]
    );
    return result.rows[0] || null;
};

// ========== XÓA MÔN HỌC ==========
const remove = async (id) => {
    // Xóa CASCADE: xóa tất cả dữ liệu liên quan trước
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Xóa báo cáo tổng kết môn (bảng con xóa tự động do ON DELETE CASCADE)
        await client.query(
            'DELETE FROM BAOCAOTONGKETMON WHERE MaMonHoc = $1',
            [id]
        );
        
        // 2. Xóa bảng điểm môn (các bảng con xóa tự động do ON DELETE CASCADE)
        await client.query(
            'DELETE FROM BANGDIEMMON WHERE MaMonHoc = $1',
            [id]
        );
        
        // 3. Xóa phân công giảng dạy
        await client.query(
            'DELETE FROM GIANGDAY WHERE MaMonHoc = $1',
            [id]
        );
        
        // 4. Cuối cùng xóa môn học
        const result = await client.query(
            'DELETE FROM MONHOC WHERE MaMonHoc = $1 RETURNING *',
            [id]
        );
        
        await client.query('COMMIT');
        return result.rows[0] || null;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

// ========== KIỂM TRA MÔN HỌC CÓ ĐIỂM KHÔNG ==========
const hasGrades = async (id) => {
    // Kiểm tra có điểm thực tế (không phải NULL) trong CT_BANGDIEMMON_HOCSINH
    const result = await pool.query(
        `SELECT 1 FROM CT_BANGDIEMMON_HOCSINH ct
         JOIN BANGDIEMMON bdm ON ct.MaBangDiem = bdm.MaBangDiem
         WHERE bdm.MaMonHoc = $1 AND ct.Diem IS NOT NULL
         LIMIT 1`,
        [id]
    );
    return result.rows.length > 0;
};

module.exports = {
    findAll,
    findById,
    create,
    update,
    remove,
    hasGrades
};
