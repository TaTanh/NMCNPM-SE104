const express = require('express');
const router = express.Router();
const pool = require('../db');

// ========== LẤY TẤT CẢ THAM SỐ ==========
router.get('/params', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM THAMSO ORDER BY TenThamSo');
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy tham số:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== CẬP NHẬT THAM SỐ ==========
router.put('/params/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const { GiaTri } = req.body;
        
        const result = await pool.query(
            'UPDATE THAMSO SET GiaTri = $1 WHERE TenThamSo = $2 RETURNING *',
            [GiaTri, name]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy tham số' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi cập nhật tham số:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY DANH SÁCH NĂM HỌC ==========
router.get('/school-years', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM NAMHOC ORDER BY MaNamHoc DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy năm học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== THÊM NĂM HỌC ==========
router.post('/school-years', async (req, res) => {
    try {
        const { MaNamHoc, TenNamHoc } = req.body;
        
        const result = await pool.query(
            'INSERT INTO NAMHOC (MaNamHoc, TenNamHoc) VALUES ($1, $2) RETURNING *',
            [MaNamHoc, TenNamHoc]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi thêm năm học:', err);
        if (err.code === '23505') {
            res.status(400).json({ message: 'Mã năm học đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

// ========== CẬP NHẬT NĂM HỌC ==========
router.put('/school-years/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { TenNamHoc } = req.body;
        
        const result = await pool.query(
            'UPDATE NAMHOC SET TenNamHoc = $1 WHERE MaNamHoc = $2 RETURNING *',
            [TenNamHoc, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy năm học' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi cập nhật năm học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== XÓA NĂM HỌC ==========
router.delete('/school-years/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM NAMHOC WHERE MaNamHoc = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy năm học' });
        }
        
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        console.error('Lỗi xóa năm học:', err);
        if (err.code === '23503') {
            res.status(400).json({ message: 'Không thể xóa năm học đang được sử dụng' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

// ========== LẤY DANH SÁCH HỌC KỲ ==========
router.get('/semesters', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM HOCKY ORDER BY MaHocKy');
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy học kỳ:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== THÊM HỌC KỲ ==========
router.post('/semesters', async (req, res) => {
    try {
        const { MaHocKy, TenHocKy } = req.body;
        
        const result = await pool.query(
            'INSERT INTO HOCKY (MaHocKy, TenHocKy) VALUES ($1, $2) RETURNING *',
            [MaHocKy, TenHocKy]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi thêm học kỳ:', err);
        if (err.code === '23505') {
            res.status(400).json({ message: 'Mã học kỳ đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

// ========== CẬP NHẬT HỌC KỲ ==========
router.put('/semesters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { TenHocKy } = req.body;
        
        const result = await pool.query(
            'UPDATE HOCKY SET TenHocKy = $1 WHERE MaHocKy = $2 RETURNING *',
            [TenHocKy, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy học kỳ' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi cập nhật học kỳ:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== XÓA HỌC KỲ ==========
router.delete('/semesters/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM HOCKY WHERE MaHocKy = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy học kỳ' });
        }
        
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        console.error('Lỗi xóa học kỳ:', err);
        if (err.code === '23503') {
            res.status(400).json({ message: 'Không thể xóa học kỳ đang được sử dụng' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

// ========== LẤY DANH SÁCH KHỐI LỚP ==========
router.get('/grade-levels', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM KHOILOP ORDER BY MaKhoiLop');
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy khối lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY LOẠI HÌNH KIỂM TRA ==========
router.get('/exam-types', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM LOAIHINHKIEMTRA ORDER BY HeSo');
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy loại hình kiểm tra:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== CẬP NHẬT LOẠI HÌNH KIỂM TRA ==========
router.put('/exam-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { TenLHKT, HeSo } = req.body;
        
        const result = await pool.query(
            'UPDATE LOAIHINHKIEMTRA SET TenLHKT = $1, HeSo = $2 WHERE MaLHKT = $3 RETURNING *',
            [TenLHKT, HeSo, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy loại hình kiểm tra' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi cập nhật loại hình kiểm tra:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== THÊM LOẠI HÌNH KIỂM TRA ==========
router.post('/exam-types', async (req, res) => {
    try {
        const { MaLHKT, TenLHKT, HeSo } = req.body;
        
        const result = await pool.query(
            'INSERT INTO LOAIHINHKIEMTRA (MaLHKT, TenLHKT, HeSo) VALUES ($1, $2, $3) RETURNING *',
            [MaLHKT, TenLHKT, HeSo]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi thêm loại hình kiểm tra:', err);
        if (err.code === '23505') {
            res.status(400).json({ message: 'Mã loại hình kiểm tra đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

// ========== XÓA LOẠI HÌNH KIỂM TRA ==========
router.delete('/exam-types/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM LOAIHINHKIEMTRA WHERE MaLHKT = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy loại hình kiểm tra' });
        }
        
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        console.error('Lỗi xóa loại hình kiểm tra:', err);
        if (err.code === '23503') {
            res.status(400).json({ message: 'Không thể xóa loại hình kiểm tra đang được sử dụng' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

module.exports = router;
