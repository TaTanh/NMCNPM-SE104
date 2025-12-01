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
        
        // QĐ6: Lấy giới hạn điểm từ THAMSO
        const diemResult = await pool.query(
            "SELECT TenThamSo, GiaTri FROM THAMSO WHERE TenThamSo IN ('DiemToiThieu', 'DiemToiDa')"
        );
        
        let diemMin = 0, diemMax = 10;
        diemResult.rows.forEach(row => {
            if (row.tenthamso === 'DiemToiThieu') diemMin = parseFloat(row.giatri);
            if (row.tenthamso === 'DiemToiDa') diemMax = parseFloat(row.giatri);
        });
        
        // Kiểm tra điểm hợp lệ
        if (Diem < diemMin || Diem > diemMax) {
            return res.status(400).json({ error: `Điểm phải từ ${diemMin} đến ${diemMax}` });
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

// ========== QĐ6: TÍNH ĐIỂM TRUNG BÌNH MÔN ==========
router.get('/average/:maBangDiem/:maHocSinh', async (req, res) => {
    try {
        const { maBangDiem, maHocSinh } = req.params;
        
        // Lấy tất cả điểm và hệ số
        const result = await pool.query(
            `SELECT ct.Diem, lhkt.HeSo 
             FROM CT_BANGDIEMMON_HOCSINH ct
             JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
             WHERE ct.MaBangDiem = $1 AND ct.MaHocSinh = $2`,
            [maBangDiem, maHocSinh]
        );
        
        if (result.rows.length === 0) {
            return res.json({ diemTB: null, dat: null, message: 'Chưa có điểm' });
        }
        
        // Tính điểm TB = (∑ điểm × trọng số) / ∑ trọng số
        let tongDiem = 0;
        let tongHeSo = 0;
        
        result.rows.forEach(row => {
            tongDiem += parseFloat(row.diem) * parseInt(row.heso);
            tongHeSo += parseInt(row.heso);
        });
        
        // Làm tròn 0.1
        const diemTB = Math.round((tongDiem / tongHeSo) * 10) / 10;
        
        // QĐ7: Kiểm tra đạt môn
        const diemDatResult = await pool.query(
            "SELECT GiaTri FROM THAMSO WHERE TenThamSo = 'DiemDatMon'"
        );
        const diemDat = diemDatResult.rows.length > 0 ? parseFloat(diemDatResult.rows[0].giatri) : 5;
        
        const dat = diemTB >= diemDat;
        
        res.json({ 
            diemTB, 
            dat, 
            diemDatMon: diemDat,
            message: dat ? 'Đạt' : 'Chưa đạt'
        });
    } catch (err) {
        console.error('Lỗi tính điểm TB:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== LẤY BẢNG ĐIỂM TỔNG HỢP CỦA HỌC SINH ==========
router.get('/student/:maHocSinh', async (req, res) => {
    try {
        const { maHocSinh } = req.params;
        const { namhoc, hocky } = req.query;
        
        // Lấy thông tin lớp của học sinh
        let lopQuery = `
            SELECT l.MaLop, l.MaNamHoc 
            FROM QUATRINHHOC qth 
            JOIN LOP l ON qth.MaLop = l.MaLop 
            WHERE qth.MaHocSinh = $1
        `;
        const lopParams = [maHocSinh];
        if (namhoc) {
            lopParams.push(namhoc);
            lopQuery += ` AND l.MaNamHoc = $${lopParams.length}`;
        }
        lopQuery += ' LIMIT 1';
        
        const lopResult = await pool.query(lopQuery, lopParams);
        if (lopResult.rows.length === 0) {
            return res.json([]);
        }
        const maLop = lopResult.rows[0].malop;
        const maNamHoc = lopResult.rows[0].manamhoc;
        
        // Lấy tất cả các môn học
        const monHocResult = await pool.query('SELECT MaMonHoc, TenMonHoc FROM MONHOC ORDER BY TenMonHoc');
        const allMonHoc = monHocResult.rows;
        
        // Lấy tất cả học kỳ
        let hocKyQuery = 'SELECT MaHocKy, TenHocKy FROM HOCKY';
        const hocKyParams = [];
        if (hocky) {
            hocKyParams.push(hocky);
            hocKyQuery += ` WHERE MaHocKy = $1`;
        }
        hocKyQuery += ' ORDER BY MaHocKy';
        const hocKyResult = await pool.query(hocKyQuery, hocKyParams);
        const allHocKy = hocKyResult.rows;
        
        // Lấy điểm của học sinh
        let diemQuery = `
            SELECT 
                mh.MaMonHoc, mh.TenMonHoc,
                bdm.MaBangDiem, bdm.MaHocKy,
                hk.TenHocKy,
                ct.Diem, lhkt.TenLHKT, lhkt.HeSo
            FROM BANGDIEMMON bdm
            JOIN MONHOC mh ON bdm.MaMonHoc = mh.MaMonHoc
            JOIN HOCKY hk ON bdm.MaHocKy = hk.MaHocKy
            LEFT JOIN CT_BANGDIEMMON_HOCSINH ct ON ct.MaBangDiem = bdm.MaBangDiem AND ct.MaHocSinh = $1
            LEFT JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
            WHERE bdm.MaLop = $2
        `;
        
        const diemParams = [maHocSinh, maLop];
        
        if (hocky) {
            diemParams.push(hocky);
            diemQuery += ` AND bdm.MaHocKy = $${diemParams.length}`;
        }
        
        diemQuery += ' ORDER BY mh.TenMonHoc, lhkt.HeSo';
        
        const diemResult = await pool.query(diemQuery, diemParams);
        
        // Gom điểm theo môn học và học kỳ
        const resultMap = new Map();
        
        // Khởi tạo tất cả các môn với tất cả học kỳ
        allMonHoc.forEach(mh => {
            allHocKy.forEach(hk => {
                const key = `${mh.mamonhoc}_${hk.mahocky}`;
                resultMap.set(key, {
                    MaMonHoc: mh.mamonhoc,
                    TenMonHoc: mh.tenmonhoc,
                    MaHocKy: hk.mahocky,
                    TenHocKy: hk.tenhocky,
                    Diem: {}
                });
            });
        });
        
        // Điền điểm vào
        diemResult.rows.forEach(row => {
            const key = `${row.mamonhoc}_${row.mahocky}`;
            if (resultMap.has(key)) {
                const mon = resultMap.get(key);
                if (row.tenlhkt && row.diem !== null) {
                    if (!mon.Diem[row.tenlhkt]) {
                        mon.Diem[row.tenlhkt] = [];
                    }
                    mon.Diem[row.tenlhkt].push({ diem: row.diem, heso: row.heso });
                }
            }
        });
        
        // Chuyển thành array và sắp xếp
        const result = Array.from(resultMap.values()).sort((a, b) => {
            if (a.TenMonHoc < b.TenMonHoc) return -1;
            if (a.TenMonHoc > b.TenMonHoc) return 1;
            return a.MaHocKy.localeCompare(b.MaHocKy);
        });
        
        res.json(result);
    } catch (err) {
        console.error('Lỗi lấy bảng điểm học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
