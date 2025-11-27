const express = require('express');
const router = express.Router();
const pool = require('../db');

// ========== LẤY DANH SÁCH MÔN HỌC ==========
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT MaMonHoc, TenMonHoc, HeSo FROM MONHOC ORDER BY TenMonHoc'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy danh sách môn học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY 1 MÔN HỌC THEO MÃ ==========
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM MONHOC WHERE MaMonHoc = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy môn học' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi lấy môn học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== THÊM MÔN HỌC ==========
router.post('/', async (req, res) => {
    try {
        const { MaMonHoc, TenMonHoc, HeSo } = req.body;
        
        const result = await pool.query(
            `INSERT INTO MONHOC (MaMonHoc, TenMonHoc, HeSo)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [MaMonHoc, TenMonHoc, HeSo]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi thêm môn học:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Mã môn học đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

// ========== CẬP NHẬT MÔN HỌC ==========
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { TenMonHoc, HeSo } = req.body;
        
        const result = await pool.query(
            `UPDATE MONHOC 
             SET TenMonHoc = $1, HeSo = $2
             WHERE MaMonHoc = $3
             RETURNING *`,
            [TenMonHoc, HeSo, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy môn học' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi cập nhật môn học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== XÓA MÔN HỌC ==========
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM MONHOC WHERE MaMonHoc = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy môn học' });
        }
        
        res.json({ message: 'Đã xóa môn học', deleted: result.rows[0] });
    } catch (err) {
        console.error('Lỗi xóa môn học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
