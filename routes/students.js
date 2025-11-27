const express = require('express');
const router = express.Router();
const pool = require('../db');

// ========== LẤY DANH SÁCH HỌC SINH ==========
router.get('/', async (req, res) => {
    try {
        const { namhoc, lop } = req.query;
        
        let query = `
            SELECT hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hs.DiaChi, hs.Email
            FROM HOCSINH hs
        `;
        
        const params = [];
        const conditions = [];
        
        // Nếu có filter theo lớp, cần JOIN với QUATRINHHOC
        if (lop || namhoc) {
            query = `
                SELECT DISTINCT hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hs.DiaChi, hs.Email
                FROM HOCSINH hs
                JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
                JOIN LOP l ON qth.MaLop = l.MaLop
            `;
            
            if (lop) {
                params.push(lop);
                conditions.push(`l.MaLop = $${params.length}`);
            }
            
            if (namhoc) {
                params.push(namhoc);
                conditions.push(`l.MaNamHoc = $${params.length}`);
            }
        }
        
        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        
        // Sắp xếp theo mã học sinh tăng dần (HS001, HS002, HS003...)
        query += ' ORDER BY hs.MaHocSinh ASC';
        
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy danh sách học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY 1 HỌC SINH THEO MÃ ==========
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM HOCSINH WHERE MaHocSinh = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy học sinh' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi lấy học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== THÊM HỌC SINH ==========
router.post('/', async (req, res) => {
    try {
        const { MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email } = req.body;
        
        // Kiểm tra tuổi học sinh theo THAMSO
        const thamsoResult = await pool.query(
            "SELECT GiaTri FROM THAMSO WHERE TenThamSo IN ('TuoiToiThieu', 'TuoiToiDa')"
        );
        
        const result = await pool.query(
            `INSERT INTO HOCSINH (MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi thêm học sinh:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Mã học sinh đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

// ========== CẬP NHẬT HỌC SINH ==========
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { HoTen, GioiTinh, NgaySinh, DiaChi, Email } = req.body;
        
        const result = await pool.query(
            `UPDATE HOCSINH 
             SET HoTen = $1, GioiTinh = $2, NgaySinh = $3, DiaChi = $4, Email = $5
             WHERE MaHocSinh = $6
             RETURNING *`,
            [HoTen, GioiTinh, NgaySinh, DiaChi, Email, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy học sinh' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi cập nhật học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== XÓA HỌC SINH ==========
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM HOCSINH WHERE MaHocSinh = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy học sinh' });
        }
        
        res.json({ message: 'Đã xóa học sinh', deleted: result.rows[0] });
    } catch (err) {
        console.error('Lỗi xóa học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
