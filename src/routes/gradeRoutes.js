const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { checkAuth } = require('../middleware/authMiddleware');

// ========== LẤY BẢNG ĐIỂM MÔN CỦA LỚP ==========
router.get('/class/:maLop/subject/:maMonHoc', checkAuth, gradeController.getClassSubjectGrades);

// ========== LẤY LOẠI HÌNH KIỂM TRA ==========
router.get('/exam-types', gradeController.getExamTypes);

// ========== CẬP NHẬT ĐIỂM HỌC SINH ==========
router.post('/update', checkAuth, gradeController.updateGrade);

// ========== TẠO BẢNG ĐIỂM MÔN CHO LỚP ==========
router.post('/create', checkAuth, gradeController.createGradeSheet);

// ========== TÍNH ĐIỂM TRUNG BÌNH MÔN ==========
router.get('/average/:maBangDiem/:maHocSinh', gradeController.getStudentAverage);

// ========== LẤY BẢNG ĐIỂM TỔNG HỢP CỦA HỌC SINH ==========
router.get('/student/:maHocSinh', checkAuth, gradeController.getStudentGrades);

module.exports = router;
