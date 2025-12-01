const express = require('express');
const router = express.Router();
const pool = require('../db');

// ========== ĐĂNG NHẬP ==========
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
        }
        
        const result = await pool.query(
            `SELECT u.*, r.TenVaiTro, r.Quyen
             FROM NGUOIDUNG u
             JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
             WHERE u.TenDangNhap = $1 AND u.MatKhau = $2 AND u.TrangThai = true`,
            [username, password]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
        
        const user = result.rows[0];
        
        // Trả về thông tin user (không bao gồm mật khẩu)
        res.json({
            success: true,
            user: {
                maNguoiDung: user.manguoidung,
                tenDangNhap: user.tendangnhap,
                hoTen: user.hoten,
                email: user.email,
                vaiTro: user.tenvaitro,
                quyen: user.quyen
            }
        });
    } catch (err) {
        console.error('Lỗi đăng nhập:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY DANH SÁCH NGƯỜI DÙNG ==========
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT u.MaNguoiDung, u.TenDangNhap, u.HoTen, u.Email, 
                    u.MaVaiTro, r.TenVaiTro, u.TrangThai
             FROM NGUOIDUNG u
             JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
             ORDER BY u.MaNguoiDung`
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy danh sách người dùng:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY DANH SÁCH VAI TRÒ ==========
router.get('/roles', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM VAITRO ORDER BY MaVaiTro'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy danh sách vai trò:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== THÊM NGƯỜI DÙNG ==========
router.post('/users', async (req, res) => {
    try {
        const { TenDangNhap, MatKhau, HoTen, Email, MaVaiTro } = req.body;
        
        // Kiểm tra tên đăng nhập đã tồn tại chưa
        const checkExist = await pool.query(
            'SELECT 1 FROM NGUOIDUNG WHERE TenDangNhap = $1',
            [TenDangNhap]
        );
        
        if (checkExist.rows.length > 0) {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        }
        
        const result = await pool.query(
            `INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro, TrangThai)
             VALUES ($1, $2, $3, $4, $5, true)
             RETURNING *`,
            [TenDangNhap, MatKhau, HoTen, Email, MaVaiTro]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi thêm người dùng:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== CẬP NHẬT NGƯỜI DÙNG ==========
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { HoTen, Email, MaVaiTro, TrangThai } = req.body;
        
        const result = await pool.query(
            `UPDATE NGUOIDUNG 
             SET HoTen = $1, Email = $2, MaVaiTro = $3, TrangThai = $4
             WHERE MaNguoiDung = $5
             RETURNING *`,
            [HoTen, Email, MaVaiTro, TrangThai, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi cập nhật người dùng:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== ĐỔI MẬT KHẨU ==========
router.put('/users/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { MatKhauCu, MatKhauMoi } = req.body;
        
        // Kiểm tra mật khẩu cũ
        const checkPassword = await pool.query(
            'SELECT 1 FROM NGUOIDUNG WHERE MaNguoiDung = $1 AND MatKhau = $2',
            [id, MatKhauCu]
        );
        
        if (checkPassword.rows.length === 0) {
            return res.status(400).json({ error: 'Mật khẩu cũ không đúng' });
        }
        
        await pool.query(
            'UPDATE NGUOIDUNG SET MatKhau = $1 WHERE MaNguoiDung = $2',
            [MatKhauMoi, id]
        );
        
        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        console.error('Lỗi đổi mật khẩu:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== XÓA NGƯỜI DÙNG ==========
router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM NGUOIDUNG WHERE MaNguoiDung = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        res.json({ success: true, message: 'Đã xóa người dùng' });
    } catch (err) {
        console.error('Lỗi xóa người dùng:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== THÊM VAI TRÒ ==========
router.post('/roles', async (req, res) => {
    try {
        const { MaVaiTro, TenVaiTro, Quyen, MoTa } = req.body;
        
        const result = await pool.query(
            `INSERT INTO VAITRO (MaVaiTro, TenVaiTro, Quyen, MoTa)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [MaVaiTro, TenVaiTro, JSON.stringify(Quyen), MoTa]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi thêm vai trò:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Mã vai trò đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

// ========== CẬP NHẬT VAI TRÒ ==========
router.put('/roles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { TenVaiTro, Quyen, MoTa } = req.body;
        
        const result = await pool.query(
            `UPDATE VAITRO 
             SET TenVaiTro = $1, Quyen = $2, MoTa = $3
             WHERE MaVaiTro = $4
             RETURNING *`,
            [TenVaiTro, JSON.stringify(Quyen), MoTa, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi cập nhật vai trò:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
