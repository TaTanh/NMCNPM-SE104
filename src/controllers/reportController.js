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

// ========== LẤY TỔNG KẾT LỚP ==========
const getClassSummary = async (req, res) => {
    try {
        const { maLop, maNamHoc, maHocKy } = req.params;
        
        if (!maLop || !maNamHoc || !maHocKy) {
            return res.status(400).json({ error: 'Thiếu tham số: maLop, maNamHoc, maHocKy' });
        }
        
        const summary = await reportModel.getClassSummary(maLop, maNamHoc, maHocKy);
        res.json(summary);
    } catch (err) {
        console.error('Lỗi lấy tổng kết lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY TỔNG KẾT LỚP VỚI ĐIỂM TỪNG MÔN ==========
const getClassSummaryWithSubjects = async (req, res) => {
    try {
        const { maLop, maNamHoc, maHocKy } = req.params;
        
        if (!maLop || !maNamHoc || !maHocKy) {
            return res.status(400).json({ error: 'Thiếu tham số: maLop, maNamHoc, maHocKy' });
        }
        
        const data = await reportModel.getClassSummaryWithSubjectGrades(maLop, maNamHoc, maHocKy);
        res.json(data);
    } catch (err) {
        console.error('Lỗi lấy tổng kết lớp với điểm từng môn:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY DANH SÁCH MÔN ==========
const getSubjectsInClass = async (req, res) => {
    try {
        const { maLop, maHocKy } = req.params;
        
        if (!maLop || !maHocKy) {
            return res.status(400).json({ error: 'Thiếu tham số: maLop, maHocKy' });
        }
        
        const subjects = await reportModel.getSubjectsInClass(maLop, maHocKy);
        res.json(subjects);
    } catch (err) {
        console.error('Lỗi lấy danh sách môn:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY ĐIỂM TỪNG MÔN CỦA HỌC SINH ==========
const getStudentSubjectGrades = async (req, res) => {
    try {
        const { maHocSinh, maLop, maHocKy } = req.params;
        
        if (!maHocSinh || !maLop || !maHocKy) {
            return res.status(400).json({ error: 'Thiếu tham số' });
        }
        
        const grades = await reportModel.getStudentSubjectGrades(maHocSinh, maLop, maHocKy);
        res.json(grades);
    } catch (err) {
        console.error('Lỗi lấy điểm từng môn:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

module.exports = {
    getSubjectReport,
    getSemesterReport,
    getDashboardStats,
    getClassSummary,
    getClassSummaryWithSubjects,
    getSubjectsInClass,
    getStudentSubjectGrades
};
