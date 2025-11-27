const express = require('express');
const router = express.Router();
const pool = require('../db');

// ========== BÁO CÁO TỔNG KẾT MÔN ==========
router.get('/subject', async (req, res) => {
    try {
        const { namhoc, hocky, monhoc } = req.query;
        
        if (!namhoc || !hocky || !monhoc) {
            return res.status(400).json({ error: 'Thiếu tham số: namhoc, hocky, monhoc' });
        }
        
        // Lấy báo cáo từ bảng BAOCAOTONGKETMON nếu đã có
        let result = await pool.query(
            `SELECT bctk.*, ct.MaLop, ct.SoLuongDat, ct.TiLe, l.TenLop
             FROM BAOCAOTONGKETMON bctk
             JOIN CT_BCTKM ct ON bctk.MaBaoCao = ct.MaBaoCao
             JOIN LOP l ON ct.MaLop = l.MaLop
             WHERE bctk.MaMonHoc = $1 AND bctk.MaHocKy = $2
             ORDER BY l.TenLop`,
            [monhoc, hocky]
        );
        
        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
        
        // Nếu chưa có, tính toán từ dữ liệu điểm
        result = await pool.query(
            `SELECT l.MaLop, l.TenLop, l.SiSo,
                    COUNT(CASE WHEN avg_diem.DiemTB >= 5 THEN 1 END) as SoLuongDat
             FROM LOP l
             LEFT JOIN (
                 SELECT qth.MaLop, hs.MaHocSinh, 
                        AVG(ct.Diem * lhkt.HeSo) / SUM(lhkt.HeSo) as DiemTB
                 FROM HOCSINH hs
                 JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
                 JOIN BANGDIEMMON bdm ON bdm.MaLop = qth.MaLop
                 JOIN CT_BANGDIEMMON_HOCSINH ct ON ct.MaBangDiem = bdm.MaBangDiem AND ct.MaHocSinh = hs.MaHocSinh
                 JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                 WHERE bdm.MaMonHoc = $1 AND bdm.MaHocKy = $2
                 GROUP BY qth.MaLop, hs.MaHocSinh
             ) avg_diem ON avg_diem.MaLop = l.MaLop
             WHERE l.MaNamHoc = $3
             GROUP BY l.MaLop, l.TenLop, l.SiSo
             ORDER BY l.TenLop`,
            [monhoc, hocky, namhoc]
        );
        
        // Tính tỉ lệ
        const report = result.rows.map(row => ({
            ...row,
            TiLe: row.siso > 0 ? ((row.soluongdat / row.siso) * 100).toFixed(2) : 0
        }));
        
        res.json(report);
    } catch (err) {
        console.error('Lỗi lấy báo cáo tổng kết môn:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ========== BÁO CÁO TỔNG KẾT HỌC KỲ ==========
router.get('/semester', async (req, res) => {
    try {
        const { namhoc, hocky } = req.query;
        
        if (!namhoc || !hocky) {
            return res.status(400).json({ error: 'Thiếu tham số: namhoc, hocky' });
        }
        
        // Lấy báo cáo từ bảng BAOCAOTONGKETHOCKY nếu đã có
        let result = await pool.query(
            `SELECT bctkhk.*, l.TenLop
             FROM BAOCAOTONGKETHOCKY bctkhk
             JOIN LOP l ON bctkhk.MaLop = l.MaLop
             WHERE bctkhk.MaHocKy = $1 AND l.MaNamHoc = $2
             ORDER BY l.TenLop`,
            [hocky, namhoc]
        );
        
        if (result.rows.length > 0) {
            return res.json(result.rows);
        }
        
        // Nếu chưa có, tính toán từ dữ liệu điểm (tính điểm TB tất cả môn)
        result = await pool.query(
            `SELECT l.MaLop, l.TenLop, l.SiSo,
                    COUNT(CASE WHEN student_avg.DiemTBHK >= 5 THEN 1 END) as SoLuongDat
             FROM LOP l
             LEFT JOIN (
                 SELECT qth.MaLop, hs.MaHocSinh,
                        SUM(subject_avg.DiemTBMon * mh.HeSo) / SUM(mh.HeSo) as DiemTBHK
                 FROM HOCSINH hs
                 JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
                 JOIN (
                     SELECT ct.MaHocSinh, bdm.MaMonHoc, bdm.MaLop,
                            SUM(ct.Diem * lhkt.HeSo) / SUM(lhkt.HeSo) as DiemTBMon
                     FROM CT_BANGDIEMMON_HOCSINH ct
                     JOIN BANGDIEMMON bdm ON ct.MaBangDiem = bdm.MaBangDiem
                     JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                     WHERE bdm.MaHocKy = $1
                     GROUP BY ct.MaHocSinh, bdm.MaMonHoc, bdm.MaLop
                 ) subject_avg ON subject_avg.MaHocSinh = hs.MaHocSinh AND subject_avg.MaLop = qth.MaLop
                 JOIN MONHOC mh ON subject_avg.MaMonHoc = mh.MaMonHoc
                 GROUP BY qth.MaLop, hs.MaHocSinh
             ) student_avg ON student_avg.MaLop = l.MaLop
             WHERE l.MaNamHoc = $2
             GROUP BY l.MaLop, l.TenLop, l.SiSo
             ORDER BY l.TenLop`,
            [hocky, namhoc]
        );
        
        // Tính tỉ lệ
        const report = result.rows.map(row => ({
            ...row,
            TiLe: row.siso > 0 ? ((row.soluongdat / row.siso) * 100).toFixed(2) : 0
        }));
        
        res.json(report);
    } catch (err) {
        console.error('Lỗi lấy báo cáo tổng kết học kỳ:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
