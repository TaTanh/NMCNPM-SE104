const express = require('express');
const router = express.Router();
const pool = require('../db');

// ========== LẤY BẢNG ĐIỂM MÔN CỦA LỚP ==========
router.get('/class/:maLop/subject/:maMonHoc', async (req, res) => {
    try {
        const { maLop, maMonHoc } = req.params;
        const { hocky } = req.query;
        
        let query = `
            SELECT 
                hs.MaHocSinh, hs.HoTen,
                bdm.MaBangDiem, bdm.MaHocKy,
                ct.Diem, lhkt.TenLHKT, lhkt.HeSo as HeSoLoaiKT
            FROM HOCSINH hs
            JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
            LEFT JOIN BANGDIEMMON bdm ON bdm.MaLop = qth.MaLop AND bdm.MaMonHoc = $2
            LEFT JOIN CT_BANGDIEMMON_HOCSINH ct ON ct.MaBangDiem = bdm.MaBangDiem AND ct.MaHocSinh = hs.MaHocSinh
            LEFT JOIN CT_BANGDIEMMON_LHKT ctlhkt ON ctlhkt.MaBangDiem = bdm.MaBangDiem
            LEFT JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
            WHERE qth.MaLop = $1
        `;
        
        const params = [maLop, maMonHoc];
        
        if (hocky) {
            params.push(hocky);
            query += ` AND bdm.MaHocKy = $${params.length}`;
        }
        
        query += ' ORDER BY hs.HoTen, lhkt.HeSo';
        
        const result = await pool.query(query, params);
        
        // Gom điểm theo học sinh
        const studentsMap = new Map();
        result.rows.forEach(row => {
            if (!studentsMap.has(row.mahocsinh)) {
                studentsMap.set(row.mahocsinh, {
                    MaHocSinh: row.mahocsinh,
                    HoTen: row.hoten,
                    Diem: {}
                });
            }
            if (row.tenlhkt && row.diem !== null) {
                const student = studentsMap.get(row.mahocsinh);
                if (!student.Diem[row.tenlhkt]) {
                    student.Diem[row.tenlhkt] = [];
                }
                student.Diem[row.tenlhkt].push(row.diem);
            }
        });
        
        res.json(Array.from(studentsMap.values()));
    } catch (err) {
        console.error('Lỗi lấy bảng điểm:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY LOẠI HÌNH KIỂM TRA ==========
router.get('/exam-types', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT MaLHKT, TenLHKT, HeSo FROM LOAIHINHKIEMTRA ORDER BY HeSo'
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Lỗi lấy loại hình kiểm tra:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== CẬP NHẬT ĐIỂM HỌC SINH ==========
router.post('/update', async (req, res) => {
    try {
        const { MaBangDiem, MaHocSinh, MaLHKT, Diem } = req.body;
        
        // Kiểm tra điểm hợp lệ (0-10)
        if (Diem < 0 || Diem > 10) {
            return res.status(400).json({ error: 'Điểm phải từ 0 đến 10' });
        }
        
        // Upsert điểm
        const result = await pool.query(
            `INSERT INTO CT_BANGDIEMMON_HOCSINH (MaBangDiem, MaHocSinh, MaLHKT, Diem)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (MaBangDiem, MaHocSinh, MaLHKT) 
             DO UPDATE SET Diem = $4
             RETURNING *`,
            [MaBangDiem, MaHocSinh, MaLHKT, Diem]
        );
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi cập nhật điểm:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== TẠO BẢNG ĐIỂM MÔN CHO LỚP ==========
router.post('/create', async (req, res) => {
    try {
        const { MaLop, MaMonHoc, MaHocKy } = req.body;
        
        // Kiểm tra đã có bảng điểm chưa
        const existing = await pool.query(
            'SELECT * FROM BANGDIEMMON WHERE MaLop = $1 AND MaMonHoc = $2 AND MaHocKy = $3',
            [MaLop, MaMonHoc, MaHocKy]
        );
        
        if (existing.rows.length > 0) {
            return res.json(existing.rows[0]);
        }
        
        // Tạo mã bảng điểm mới
        const maBangDiem = `BDM_${MaLop}_${MaMonHoc}_${MaHocKy}`;
        
        const result = await pool.query(
            `INSERT INTO BANGDIEMMON (MaBangDiem, MaLop, MaMonHoc, MaHocKy)
             VALUES ($1, $2, $3, $4)
             RETURNING *`,
            [maBangDiem, MaLop, MaMonHoc, MaHocKy]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Lỗi tạo bảng điểm:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
