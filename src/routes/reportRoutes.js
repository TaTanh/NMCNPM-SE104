const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { checkAuth } = require('../middleware/authMiddleware');

// ========== BÁO CÁO TỔNG KẾT MÔN ==========
router.get('/subject', checkAuth, reportController.getSubjectReport);

// ========== BÁO CÁO TỔNG KẾT HỌC KỲ ==========
router.get('/semester', checkAuth, reportController.getSemesterReport);

// ========== BÁO CÁO TỔNG KẾT THEO LỚP (HK1/HK2/CẢ NĂM) ==========
router.get('/class-final', checkAuth, reportController.getClassFinalReport);

// ========== LẤY ĐIỂM TK & HỌC LỰC CHO NHẬP HẠNH KIỂM ==========
router.get('/student-scores-for-hanhkiem', checkAuth, reportController.getStudentScoresForHanhKiem);

module.exports = router;
