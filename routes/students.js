const express = require('express');
const router = express.Router();
const pool = require('../db');

// ========== LẤY DANH SÁCH HỌC SINH KÈM THÔNG TIN LỚP ==========
router.get('/with-class', async (req, res) => {
    try {
        const query = `
            SELECT hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hs.DiaChi, hs.Email,
                   l.MaLop, l.TenLop, l.MaNamHoc
            FROM HOCSINH hs
            LEFT JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
            LEFT JOIN LOP l ON qth.MaLop = l.MaLop
            ORDER BY hs.MaHocSinh ASC
        `;
        
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy danh sách học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY DANH SÁCH HỌC SINH ==========
router.get('/', async (req, res) => {
    try {
        const { namhoc, lop, khoi, search } = req.query;
        
        let query = `
            SELECT hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hs.DiaChi, hs.Email
            FROM HOCSINH hs
        `;
        
        const params = [];
        const conditions = [];
        
        // Nếu có filter theo lớp/namhoc/khoi, cần JOIN với QUATRINHHOC và LOP
        if (lop || namhoc || khoi || search) {
            query = `
                SELECT DISTINCT hs.MaHocSinh, hs.HoTen, hs.GioiTinh, hs.NgaySinh, hs.DiaChi, hs.Email,
                       l.TenLop, l.MaLop
                FROM HOCSINH hs
                LEFT JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
                LEFT JOIN LOP l ON qth.MaLop = l.MaLop
            `;
            
            if (lop) {
                params.push(lop);
                conditions.push(`l.MaLop = $${params.length}`);
            }
            
            if (namhoc) {
                params.push(namhoc);
                conditions.push(`l.MaNamHoc = $${params.length}`);
            }
            
            if (khoi) {
                params.push(khoi);
                conditions.push(`l.MaKhoiLop = $${params.length}`);
            }
            
            // Tìm kiếm theo tên hoặc mã học sinh
            if (search) {
                params.push(`%${search}%`);
                conditions.push(`(LOWER(hs.HoTen) LIKE LOWER($${params.length}) OR LOWER(hs.MaHocSinh) LIKE LOWER($${params.length}))`);
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
        
        // QĐ1: Kiểm tra tuổi học sinh
        if (NgaySinh) {
            const thamsoResult = await pool.query(
                "SELECT TenThamSo, GiaTri FROM THAMSO WHERE TenThamSo IN ('TuoiToiThieu', 'TuoiToiDa')"
            );
            
            let tuoiMin = 15, tuoiMax = 20;
            thamsoResult.rows.forEach(row => {
                if (row.tenthamso === 'TuoiToiThieu') tuoiMin = parseInt(row.giatri);
                if (row.tenthamso === 'TuoiToiDa') tuoiMax = parseInt(row.giatri);
            });
            
            // Tính tuổi
            const birthDate = new Date(NgaySinh);
            const today = new Date();
            let tuoi = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                tuoi--;
            }
            
            if (tuoi < tuoiMin || tuoi > tuoiMax) {
                return res.status(400).json({ 
                    error: `Tuổi học sinh phải từ ${tuoiMin} đến ${tuoiMax} tuổi (hiện tại: ${tuoi} tuổi)` 
                });
            }
        }
        
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
        
        // QĐ1: Kiểm tra tuổi học sinh
        if (NgaySinh) {
            const thamsoResult = await pool.query(
                "SELECT TenThamSo, GiaTri FROM THAMSO WHERE TenThamSo IN ('TuoiToiThieu', 'TuoiToiDa')"
            );
            
            let tuoiMin = 15, tuoiMax = 20;
            thamsoResult.rows.forEach(row => {
                if (row.tenthamso === 'TuoiToiThieu') tuoiMin = parseInt(row.giatri);
                if (row.tenthamso === 'TuoiToiDa') tuoiMax = parseInt(row.giatri);
            });
            
            // Tính tuổi
            const birthDate = new Date(NgaySinh);
            const today = new Date();
            let tuoi = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                tuoi--;
            }
            
            if (tuoi < tuoiMin || tuoi > tuoiMax) {
                return res.status(400).json({ 
                    error: `Tuổi học sinh phải từ ${tuoiMin} đến ${tuoiMax} tuổi (hiện tại: ${tuoi} tuổi)` 
                });
            }
        }
        
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
        
        // Kiểm tra xem học sinh có được xếp lớp không (bảng QUATRINHHOC)
        try {
            const checkQTH = await pool.query(
                'SELECT 1 FROM QUATRINHHOC WHERE MaHocSinh = $1 LIMIT 1',
                [id]
            );
            
            if (checkQTH.rows.length > 0) {
                return res.status(400).json({ 
                    error: 'Không thể xóa học sinh này vì đã được xếp lớp. Vui lòng xóa khỏi lớp trước.' 
                });
            }
        } catch (e) {
            // Bảng QUATRINHHOC có thể không tồn tại, bỏ qua
            console.log('Bảng QUATRINHHOC không tồn tại hoặc lỗi:', e.message);
        }
        
        // Kiểm tra trong bảng chi tiết điểm
        try {
            const checkDiem = await pool.query(
                'SELECT 1 FROM CT_BANGDIEMMON_HOCSINH WHERE MaHocSinh = $1 LIMIT 1',
                [id]
            );
            
            if (checkDiem.rows.length > 0) {
                return res.status(400).json({ 
                    error: 'Không thể xóa học sinh này vì đã có dữ liệu điểm. Vui lòng xóa điểm của học sinh trước.' 
                });
            }
        } catch (e) {
            // Bảng CT_BANGDIEMMON_HOCSINH có thể không tồn tại, bỏ qua
            console.log('Bảng CT_BANGDIEMMON_HOCSINH không tồn tại hoặc lỗi:', e.message);
        }
        
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
        if (err.code === '23503') {
            res.status(400).json({ error: 'Không thể xóa vì học sinh có dữ liệu liên quan trong hệ thống' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
});

module.exports = router;
