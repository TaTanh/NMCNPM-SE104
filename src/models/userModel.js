const pool = require('../config/db');
const bcrypt = require('bcrypt');

// ========== LẤY USER THEO CREDENTIALS ==========
const findByCredentials = async (username, password) => {
    // Bước 1: Lấy user theo username
    const result = await pool.query(
        `SELECT u.*, r.TenVaiTro, r.Quyen
         FROM NGUOIDUNG u
         JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
         WHERE u.TenDangNhap = $1 AND u.TrangThai = true`,
        [username]
    );
    
    const user = result.rows[0];
    if (!user) return null;
    
    // Bước 2: Verify password với bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.matkhau);
    if (!isPasswordValid) return null;
    
    return user;
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
    
    // Hash password trước khi lưu vào database
    const hashedPassword = await bcrypt.hash(MatKhau, 10);
    
    const result = await pool.query(
        `INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro, TrangThai)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING *`,
        [TenDangNhap, hashedPassword, HoTen, Email, MaVaiTro]
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
        'SELECT MatKhau FROM NGUOIDUNG WHERE MaNguoiDung = $1',
        [id]
    );
    
    if (result.rows.length === 0) return false;
    
    // So sánh password với bcrypt
    return await bcrypt.compare(password, result.rows[0].matkhau);
};

// ========== ĐỔI MẬT KHẨU ==========
const changePassword = async (id, newPassword) => {
    // Hash password mới trước khi lưu
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query(
        'UPDATE NGUOIDUNG SET MatKhau = $1 WHERE MaNguoiDung = $2',
        [hashedPassword, id]
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

// ========== LẤY GIÁO VIÊN THEO VAI TRÒ ==========
const findTeachersByRole = async (roleCode) => {
    const result = await pool.query(
        `SELECT u.MaNguoiDung, u.HoTen, u.Email, u.MaVaiTro, r.TenVaiTro
         FROM NGUOIDUNG u
         JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
         WHERE r.MaVaiTro = $1 AND u.TrangThai = true
         ORDER BY u.HoTen`,
        [roleCode]
    );
    return result.rows;
};

// ========== LẤY TẤT CẢ GVCN (GIÁO VIÊN CHỦ NHIỆM) ==========
const findAllGVCN = async () => {
    return await findTeachersByRole('GVCN');
};

// ========== LẤY TẤT CẢ GVBM (GIÁO VIÊN BỘ MÔN) ==========
const findAllGVBM = async () => {
    return await findTeachersByRole('GVBM');
};

// ========== KIỂM TRA USER CÓ QUYỀN GVCN KHÔNG ==========
const isGVCN = async (userId) => {
    const result = await pool.query(
        `SELECT 1 FROM NGUOIDUNG u
         JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
         WHERE u.MaNguoiDung = $1 AND (r.MaVaiTro = 'GVCN' OR r.MaVaiTro = 'ADMIN')`,
        [userId]
    );
    return result.rows.length > 0;
};

// ========== KIỂM TRA USER CÓ QUYỀN GVBM KHÔNG ==========
const isGVBM = async (userId) => {
    const result = await pool.query(
        `SELECT 1 FROM NGUOIDUNG u
         JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
         WHERE u.MaNguoiDung = $1 AND (r.MaVaiTro = 'GVBM' OR r.MaVaiTro = 'GVCN' OR r.MaVaiTro = 'ADMIN')`,
        [userId]
    );
    return result.rows.length > 0;
};

// ========== KIỂM TRA USER CÓ QUYỀN ADMIN KHÔNG ==========
const isAdmin = async (userId) => {
    const result = await pool.query(
        `SELECT 1 FROM NGUOIDUNG u
         WHERE u.MaNguoiDung = $1 AND u.MaVaiTro = 'ADMIN'`,
        [userId]
    );
    return result.rows.length > 0;
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
    updateRole,
    findTeachersByRole,
    findAllGVCN,
    findAllGVBM,
    isGVCN,
    isGVBM,
    isAdmin,
    setRole: async (userId, role) => {
        const result = await pool.query(
            `UPDATE NGUOIDUNG SET MaVaiTro = $1 WHERE MaNguoiDung = $2 RETURNING *`,
            [role, userId]
        );
        return result.rows[0] || null;
    }
};
