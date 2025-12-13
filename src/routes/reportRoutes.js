const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// ========== TỔNG KẾT LỚP ==========
router.get('/class-summary/:maLop/:maNamHoc/:maHocKy', reportController.getClassSummary);

// ========== TỔNG KẾT LỚP VỚI ĐIỂM TỪNG MÔN ==========
router.get('/class-summary-subjects/:maLop/:maNamHoc/:maHocKy', reportController.getClassSummaryWithSubjects);

// ========== DANH SÁCH MÔN TRONG LỚP ==========
router.get('/subjects/:maLop/:maHocKy', reportController.getSubjectsInClass);

// ========== ĐIỂM TỪNG MÔN CỦA HỌC SINH ==========
router.get('/student-grades/:maHocSinh/:maLop/:maHocKy', reportController.getStudentSubjectGrades);

// ========== BÁO CÁO TỔNG KẾT MÔN ==========
router.get('/subject', reportController.getSubjectReport);

// ========== BÁO CÁO TỔNG KẾT HỌC KỲ ==========
router.get('/semester', reportController.getSemesterReport);

module.exports = router;
