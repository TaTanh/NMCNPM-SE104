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
        res.status(500).json({ error: 'Lỗi server' });
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

module.exports = router;
