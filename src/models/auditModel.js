const pool = require('../config/db');

const createLog = async ({ MaNguoiDung, HanhDong, BangMuc, MaDoiTuong, ChiTiet }) => {
    const result = await pool.query(
        `INSERT INTO NHATKY (MaNguoiDung, HanhDong, BangMuc, MaDoiTuong, ChiTiet)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [MaNguoiDung, HanhDong, BangMuc, MaDoiTuong, ChiTiet ? JSON.stringify(ChiTiet) : null]
    );
    return result.rows[0];
};

module.exports = {
    createLog
};
