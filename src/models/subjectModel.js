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
    const result = await pool.query(
        'DELETE FROM MONHOC WHERE MaMonHoc = $1 RETURNING *',
        [id]
    );
    return result.rows[0] || null;
};

// ========== KIỂM TRA MÔN HỌC CÓ ĐIỂM KHÔNG ==========
const hasGrades = async (id) => {
    const result = await pool.query(
        'SELECT 1 FROM BANGDIEMMON WHERE MaMonHoc = $1 LIMIT 1',
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
