const express = require('express');
const router = express.Router();
const pool = require('../db');

// ========== LẤY DANH SÁCH LỚP ==========
router.get('/', async (req, res) => {
    try {
        const { namhoc, khoi } = req.query;
        
        let query = `
            SELECT l.MaLop, l.TenLop, kl.TenKhoiLop as Khoi, l.SiSo, 
                   l.MaNamHoc as NamHoc, l.MaKhoiLop
            FROM LOP l
            JOIN KHOILOP kl ON l.MaKhoiLop = kl.MaKhoiLop
        `;
        
        const params = [];
        const conditions = [];
        
        if (namhoc) {
            params.push(namhoc);
            conditions.push(`l.MaNamHoc = $${params.length}`);
        }
        
        if (khoi) {
            params.push(khoi);
            conditions.push(`l.MaKhoiLop = $${params.length}`);
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        query += ' ORDER BY l.TenLop';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy danh sách lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY 1 LỚP THEO MÃ ==========
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT l.*, kl.TenKhoiLop as Khoi
             FROM LOP l
             JOIN KHOILOP kl ON l.MaKhoiLop = kl.MaKhoiLop
             WHERE l.MaLop = $1`,
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy lớp' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi lấy lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== THÊM LỚP ==========
router.post('/', async (req, res) => {
    try {
        const { MaLop, TenLop, MaKhoiLop, MaNamHoc, SiSo } = req.body;
        
        const result = await pool.query(
            `INSERT INTO LOP (MaLop, TenLop, MaKhoiLop, SiSo, MaNamHoc)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [MaLop, TenLop, MaKhoiLop, SiSo || 0, MaNamHoc]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi thêm lớp:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Mã lớp đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

// ========== CẬP NHẬT LỚP ==========
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { TenLop, MaKhoiLop, MaNamHoc, SiSo } = req.body;
        
        const result = await pool.query(
            `UPDATE LOP 
             SET TenLop = $1, MaKhoiLop = $2, MaNamHoc = $3, SiSo = $4
             WHERE MaLop = $5
             RETURNING *`,
            [TenLop, MaKhoiLop, MaNamHoc, SiSo || 0, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy lớp' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi cập nhật lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== XÓA LỚP ==========
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM LOP WHERE MaLop = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy lớp' });
        }
        
        res.json({ message: 'Đã xóa lớp', deleted: result.rows[0] });
    } catch (err) {
        console.error('Lỗi xóa lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY DANH SÁCH HỌC SINH TRONG LỚP ==========
router.get('/:id/students', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            `SELECT hs.*
             FROM HOCSINH hs
             JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
             WHERE qth.MaLop = $1
             ORDER BY hs.HoTen`,
            [id]
        );
        
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy học sinh trong lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
