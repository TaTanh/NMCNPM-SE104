const reportModel = require('../models/reportModel');

// ========== BÁO CÁO TỔNG KẾT MÔN ==========
const getSubjectReport = async (req, res) => {
    try {
        const { namhoc, hocky, monhoc } = req.query;
        
        if (!namhoc || !hocky || !monhoc) {
            return res.status(400).json({ error: 'Thiếu tham số: namhoc, hocky, monhoc' });
        }
        
        const rows = await reportModel.getSubjectReport(namhoc, hocky, monhoc);
        
        // Tính tỉ lệ
        const report = rows.map(row => ({
            ...row,
            TiLe: row.siso > 0 ? ((row.soluongdat / row.siso) * 100).toFixed(2) : 0
        }));
        
        res.json(report);
    } catch (err) {
        console.error('Lỗi lấy báo cáo tổng kết môn:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== BÁO CÁO TỔNG KẾT HỌC KỲ ==========
const getSemesterReport = async (req, res) => {
    try {
        const { namhoc, hocky } = req.query;
        
        if (!namhoc || !hocky) {
            return res.status(400).json({ error: 'Thiếu tham số: namhoc, hocky' });
        }
        
        const rows = await reportModel.getSemesterReport(namhoc, hocky);
        
        // Tính tỉ lệ
        const report = rows.map(row => ({
            ...row,
            TiLe: row.siso > 0 ? ((row.soluongdat / row.siso) * 100).toFixed(2) : 0
        }));
        
        res.json(report);
    } catch (err) {
        console.error('Lỗi lấy báo cáo tổng kết học kỳ:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== DASHBOARD STATS ==========
const getDashboardStats = async (req, res) => {
    try {
        const stats = await reportModel.getDashboardStats();
        res.json(stats);
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ error: 'Lỗi lấy thống kê' });
    }
};

module.exports = {
    getSubjectReport,
    getSemesterReport,
    getDashboardStats
};
