const express = require('express');
const router = express.Router();
const pool = require('../db');

// ========== LẤY DANH SÁCH LỚP (với sĩ số thực tế) ==========
router.get('/', async (req, res) => {
    try {
        const { namhoc, khoi } = req.query;
        
        let query = `
            SELECT l.MaLop, l.TenLop, kl.TenKhoiLop as Khoi,
                   COALESCE(hs_count.siso, 0) as SiSo, 
                   l.MaNamHoc as NamHoc, l.MaKhoiLop
            FROM LOP l
            JOIN KHOILOP kl ON l.MaKhoiLop = kl.MaKhoiLop
            LEFT JOIN (
                SELECT MaLop, COUNT(*) as siso 
                FROM QUATRINHHOC 
                GROUP BY MaLop
            ) hs_count ON l.MaLop = hs_count.MaLop
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
        
        // Kiểm tra xem lớp có học sinh không
        const checkQTH = await pool.query(
            'SELECT 1 FROM QUATRINHHOC WHERE MaLop = $1 LIMIT 1',
            [id]
        );
        
        if (checkQTH.rows.length > 0) {
            return res.status(400).json({ 
                error: 'Không thể xóa lớp này vì đã có học sinh được xếp vào lớp. Vui lòng chuyển học sinh sang lớp khác trước.' 
            });
        }
        
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
        if (err.code === '23503') {
            res.status(400).json({ error: 'Không thể xóa vì lớp có dữ liệu liên quan trong hệ thống' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
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

// ========== GÁN HỌC SINH VÀO LỚP (QĐ3, QĐ4) ==========
router.post('/:id/students', async (req, res) => {
    try {
        const { id: maLop } = req.params;
        const { MaHocSinh } = req.body;
        
        // Lấy thông tin lớp và năm học
        const lopResult = await pool.query(
            'SELECT MaLop, TenLop, SiSo, MaNamHoc FROM LOP WHERE MaLop = $1',
            [maLop]
        );
        
        if (lopResult.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy lớp' });
        }
        
        const lop = lopResult.rows[0];
        
        // QĐ3: Kiểm tra sĩ số tối đa
        const sisoResult = await pool.query(
            "SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'SiSoToiDa'"
        );
        const sisoToiDa = sisoResult.rows.length > 0 ? parseInt(sisoResult.rows[0].giatri) : 40;
        
        // Đếm số học sinh hiện tại trong lớp
        const countResult = await pool.query(
            'SELECT COUNT(*) as siso FROM QUATRINHHOC WHERE MaLop = $1',
            [maLop]
        );
        const sisoHienTai = parseInt(countResult.rows[0].siso);
        
        if (sisoHienTai >= sisoToiDa) {
            return res.status(400).json({ 
                error: `Lớp ${lop.tenlop} đã đủ sĩ số tối đa (${sisoToiDa} học sinh)` 
            });
        }
        
        // QĐ4: Kiểm tra học sinh đã thuộc lớp khác trong cùng năm học chưa
        const checkResult = await pool.query(
            `SELECT l.TenLop 
             FROM QUATRINHHOC qth
             JOIN LOP l ON qth.MaLop = l.MaLop
             WHERE qth.MaHocSinh = $1 AND l.MaNamHoc = $2`,
            [MaHocSinh, lop.manamhoc]
        );
        
        if (checkResult.rows.length > 0) {
            return res.status(400).json({ 
                error: `Học sinh đã thuộc lớp ${checkResult.rows[0].tenlop} trong năm học ${lop.manamhoc}. Mỗi học sinh chỉ thuộc một lớp trong cùng năm học.` 
            });
        }
        
        // Thêm học sinh vào lớp
        await pool.query(
            'INSERT INTO QUATRINHHOC (MaHocSinh, MaLop) VALUES ($1, $2)',
            [MaHocSinh, maLop]
        );
        
        // Cập nhật sĩ số của lớp
        await pool.query(
            'UPDATE LOP SET SiSo = SiSo + 1 WHERE MaLop = $1',
            [maLop]
        );
        
        res.status(201).json({ message: 'Đã thêm học sinh vào lớp thành công' });
    } catch (err) {
        console.error('Lỗi gán học sinh vào lớp:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Học sinh đã có trong lớp này' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

// ========== XÓA HỌC SINH KHỎI LỚP ==========
router.delete('/:id/students/:maHocSinh', async (req, res) => {
    try {
        const { id: maLop, maHocSinh } = req.params;
        
        const result = await pool.query(
            'DELETE FROM QUATRINHHOC WHERE MaLop = $1 AND MaHocSinh = $2 RETURNING *',
            [maLop, maHocSinh]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy học sinh trong lớp' });
        }
        
        // Cập nhật sĩ số của lớp
        await pool.query(
            'UPDATE LOP SET SiSo = GREATEST(SiSo - 1, 0) WHERE MaLop = $1',
            [maLop]
        );
        
        res.json({ message: 'Đã xóa học sinh khỏi lớp' });
    } catch (err) {
        console.error('Lỗi xóa học sinh khỏi lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
