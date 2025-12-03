const pool = require('../config/db');

// ========== LẤY USER THEO CREDENTIALS ==========
const findByCredentials = async (username, password) => {
    const result = await pool.query(
        `SELECT u.*, r.TenVaiTro, r.Quyen
         FROM NGUOIDUNG u
         JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
         WHERE u.TenDangNhap = $1 AND u.MatKhau = $2 AND u.TrangThai = true`,
        [username, password]
    );
    return result.rows[0] || null;
};

// ========== LẤY USER THEO ID ==========
const findById = async (id) => {
    const result = await pool.query(
        `SELECT u.*, r.TenVaiTro, r.Quyen
         FROM NGUOIDUNG u
         JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
         WHERE u.MaNguoiDung = $1 AND u.TrangThai = true`,
        [id]
    );
    return result.rows[0] || null;
};

// ========== LẤY TẤT CẢ USERS ==========
const findAll = async () => {
    const result = await pool.query(
        `SELECT u.MaNguoiDung, u.TenDangNhap, u.HoTen, u.Email, 
                u.MaVaiTro, r.TenVaiTro, u.TrangThai
         FROM NGUOIDUNG u
         JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
         ORDER BY u.MaNguoiDung`
    );
    return result.rows;
};

// ========== KIỂM TRA USERNAME TỒN TẠI ==========
const existsByUsername = async (username) => {
    const result = await pool.query(
        'SELECT 1 FROM NGUOIDUNG WHERE TenDangNhap = $1',
        [username]
    );
    return result.rows.length > 0;
};

// ========== TẠO USER MỚI ==========
const create = async (userData) => {
    const { TenDangNhap, MatKhau, HoTen, Email, MaVaiTro } = userData;
    const result = await pool.query(
        `INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro, TrangThai)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [TenDangNhap, MatKhau, HoTen, Email, MaVaiTro]
    );
    return result.rows[0];
};

// ========== CẬP NHẬT USER ==========
const update = async (id, userData) => {
    const { HoTen, Email, MaVaiTro, TrangThai } = userData;
    const result = await pool.query(
        `UPDATE NGUOIDUNG 
         SET HoTen = $1, Email = $2, MaVaiTro = $3, TrangThai = $4
         WHERE MaNguoiDung = $5
         RETURNING *`,
        [HoTen, Email, MaVaiTro, TrangThai, id]
    );
    return result.rows[0] || null;
};

// ========== KIỂM TRA MẬT KHẨU ==========
const checkPassword = async (id, password) => {
    const result = await pool.query(
        'SELECT 1 FROM NGUOIDUNG WHERE MaNguoiDung = $1 AND MatKhau = $2',
        [id, password]
    );
    return result.rows.length > 0;
};

// ========== ĐỔI MẬT KHẨU ==========
const changePassword = async (id, newPassword) => {
    await pool.query(
        'UPDATE NGUOIDUNG SET MatKhau = $1 WHERE MaNguoiDung = $2',
        [newPassword, id]
    );
    return true;
};

// ========== XÓA USER ==========
const remove = async (id) => {
    const result = await pool.query(
        'DELETE FROM NGUOIDUNG WHERE MaNguoiDung = $1 RETURNING *',
        [id]
    );
    return result.rows[0] || null;
};

// ========== LẤY TẤT CẢ VAI TRÒ ==========
const findAllRoles = async () => {
    const result = await pool.query(
        'SELECT * FROM VAITRO ORDER BY MaVaiTro'
    );
    return result.rows;
};

// ========== TẠO VAI TRÒ MỚI ==========
const createRole = async (roleData) => {
    const { MaVaiTro, TenVaiTro, Quyen, MoTa } = roleData;
    const result = await pool.query(
        `INSERT INTO VAITRO (MaVaiTro, TenVaiTro, Quyen, MoTa)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [MaVaiTro, TenVaiTro, JSON.stringify(Quyen), MoTa]
    );
    return result.rows[0];
};

// ========== CẬP NHẬT VAI TRÒ ==========
const updateRole = async (id, roleData) => {
    const { TenVaiTro, Quyen, MoTa } = roleData;
    const result = await pool.query(
        `UPDATE VAITRO 
         SET TenVaiTro = $1, Quyen = $2, MoTa = $3
         WHERE MaVaiTro = $4
         RETURNING *`,
        [TenVaiTro, JSON.stringify(Quyen), MoTa, id]
    );
    return result.rows[0] || null;
};

module.exports = {
    findByCredentials,
    findById,
    findAll,
    existsByUsername,
    create,
    update,
    checkPassword,
    changePassword,
    remove,
    findAllRoles,
    createRole,
    updateRole
};
