const pool = require('../config/db');

// ========== LẤY TẤT CẢ THAM SỐ ==========
const getAllParams = async () => {
    const result = await pool.query('SELECT * FROM THAMSO ORDER BY TenThamSo');
    return result.rows;
};

// ========== CẬP NHẬT THAM SỐ ==========
const updateParam = async (name, value) => {
    const result = await pool.query(
        'UPDATE THAMSO SET GiaTri = $1 WHERE TenThamSo = $2 RETURNING *',
        [value, name]
    );
    return result.rows[0] || null;
};

// ========== LẤY THAM SỐ THEO TÊN ==========
const getParam = async (name) => {
    const result = await pool.query(
        'SELECT * FROM THAMSO WHERE TenThamSo = $1',
        [name]
    );
    return result.rows[0] || null;
};

// ========== LẤY NHIỀU THAM SỐ ==========
const getParams = async (names) => {
    const result = await pool.query(
        `SELECT TenThamSo, GiaTri FROM THAMSO WHERE TenThamSo = ANY($1)`,
        [names]
    );
    const params = {};
    result.rows.forEach(row => {
        params[row.tenthamso] = row.giatri;
    });
    return params;
};

// ========== NĂM HỌC ==========
const getAllSchoolYears = async () => {
    const result = await pool.query('SELECT * FROM NAMHOC ORDER BY MaNamHoc DESC');
    return result.rows;
};

const createSchoolYear = async (data) => {
    const { MaNamHoc, TenNamHoc } = data;
    const result = await pool.query(
        'INSERT INTO NAMHOC (MaNamHoc, TenNamHoc) VALUES ($1, $2) RETURNING *',
        [MaNamHoc, TenNamHoc]
    );
    return result.rows[0];
};

const updateSchoolYear = async (id, data) => {
    const { TenNamHoc } = data;
    const result = await pool.query(
        'UPDATE NAMHOC SET TenNamHoc = $1 WHERE MaNamHoc = $2 RETURNING *',
        [TenNamHoc, id]
    );
    return result.rows[0] || null;
};

const deleteSchoolYear = async (id) => {
    const result = await pool.query(
        'DELETE FROM NAMHOC WHERE MaNamHoc = $1 RETURNING *',
        [id]
    );
    return result.rows[0] || null;
};

// ========== HỌC KỲ ==========
const getAllSemesters = async () => {
    const result = await pool.query('SELECT * FROM HOCKY ORDER BY MaHocKy');
    return result.rows;
};

const createSemester = async (data) => {
    const { MaHocKy, TenHocKy } = data;
    const result = await pool.query(
        'INSERT INTO HOCKY (MaHocKy, TenHocKy) VALUES ($1, $2) RETURNING *',
        [MaHocKy, TenHocKy]
    );
    return result.rows[0];
};

const updateSemester = async (id, data) => {
    const { TenHocKy } = data;
    const result = await pool.query(
        'UPDATE HOCKY SET TenHocKy = $1 WHERE MaHocKy = $2 RETURNING *',
        [TenHocKy, id]
    );
    return result.rows[0] || null;
};

const deleteSemester = async (id) => {
    const result = await pool.query(
        'DELETE FROM HOCKY WHERE MaHocKy = $1 RETURNING *',
        [id]
    );
    return result.rows[0] || null;
};

// ========== KHỐI LỚP ==========
const getAllGradeLevels = async () => {
    const result = await pool.query('SELECT * FROM KHOILOP ORDER BY MaKhoiLop');
    return result.rows;
};

// ========== LOẠI HÌNH KIỂM TRA (READ-ONLY) ==========
const getAllExamTypes = async () => {
    const result = await pool.query('SELECT * FROM LOAIHINHKIEMTRA ORDER BY HeSo');
    return result.rows;
};

module.exports = {
    getAllParams,
    updateParam,
    getParam,
    getParams,
    getAllSchoolYears,
    createSchoolYear,
    updateSchoolYear,
    deleteSchoolYear,
    getAllSemesters,
    createSemester,
    updateSemester,
    deleteSemester,
    getAllGradeLevels,
    getAllExamTypes
};
