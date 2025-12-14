const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// ========== BÁO CÁO TỔNG KẾT MÔN ==========
router.get('/subject', reportController.getSubjectReport);

// ========== BÁO CÁO TỔNG KẾT HỌC KỲ ==========
router.get('/semester', reportController.getSemesterReport);

// ========== BÁO CÁO TỔNG KẾT THEO LỚP (HK1/HK2/CẢ NĂM) ==========
router.get('/class-final', reportController.getClassFinalReport);

// ========== LẤY ĐIỂM TK & HỌC LỰC CHO NHẬP HẠNH KIỂM ==========
router.get('/student-scores-for-hanhkiem', reportController.getStudentScoresForHanhKiem);

module.exports = router;
