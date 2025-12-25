const reportModel = require('../models/reportModel');
const { normalizeHocKy } = require('../utils/semesterUtil');

// ========== BÁO CÁO TỔNG KẾT MÔN ==========
const getSubjectReport = async (req, res) => {
    try {
        const { namhoc, hocky, monhoc } = req.query;
        
        if (!namhoc || !hocky || !monhoc) {
            return res.status(400).json({ error: 'Thiếu tham số: namhoc, hocky, monhoc' });
        }
        
        const rows = await reportModel.getSubjectReport(namhoc, normalizeHocKy(hocky), monhoc);
        
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
        
        const rows = await reportModel.getSemesterReport(namhoc, normalizeHocKy(hocky));
        
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

// ========== THỐNG KÊ THEO KHỐI LỚP ==========
const getStatsByGrade = async (req, res) => {
    try {
        const stats = await reportModel.getStatsByGrade();
        res.json(stats);
    } catch (err) {
        console.error('Stats by grade error:', err);
        res.status(500).json({ error: 'Lỗi lấy thống kê theo khối' });
    }
};

// ========== PHÂN BỐ XẾP LOẠI HỌC LỰC ==========
const getGradeDistribution = async (req, res) => {
    try {
        const distribution = await reportModel.getGradeDistribution();
        res.json(distribution);
    } catch (err) {
        console.error('Grade distribution error:', err);
        res.status(500).json({ error: 'Lỗi lấy phân bố xếp loại' });
    }
};

// ========== HOẠT ĐỘNG GẦN ĐÂY ==========
const getRecentActivities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const activities = await reportModel.getRecentActivities(limit);
        res.json(activities);
    } catch (err) {
        console.error('Recent activities error:', err);
        res.status(500).json({ error: 'Lỗi lấy hoạt động gần đây' });
    }
};

module.exports = {
    getSubjectReport,
    getSemesterReport,
    getDashboardStats,
    getStatsByGrade,
    getGradeDistribution,
    getRecentActivities,
    getClassFinalReport: async (req, res) => {
        try {
            const { maLop, namhoc } = req.query;
            if (!maLop || !namhoc) {
                return res.status(400).json({ error: 'Thiếu tham số: maLop, namhoc' });
            }

            const rows = await reportModel.getClassFinalReport(maLop, namhoc);
            res.json({ success: true, data: rows });
        } catch (err) {
            console.error('Lỗi báo cáo tổng kết theo lớp:', err);
            res.status(500).json({ error: 'Lỗi server' });
        }
    },
    getStudentScoresForHanhKiem: async (req, res) => {
        try {
            const { maLop, namhoc, mahocky } = req.query;
            if (!maLop || !namhoc || !mahocky) {
                return res.status(400).json({ error: 'Thiếu tham số: maLop, namhoc, mahocky' });
            }

            const rows = await reportModel.getStudentScoresForHanhKiem(maLop, namhoc, mahocky);
            res.json({ success: true, data: rows });
        } catch (err) {
            console.error('Lỗi lấy điểm TK cho hạnh kiểm:', err);
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};
