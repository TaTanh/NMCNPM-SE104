const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validateStudent } = require('../middleware/validationMiddleware');
const { checkAuth } = require('../middleware/authMiddleware');

// ========== LẤY DANH SÁCH HỌC SINH KÈM THÔNG TIN LỚP ==========
router.get('/with-class', checkAuth, studentController.getStudentsWithClass);

// ========== LẤY DANH SÁCH HỌC SINH ==========
router.get('/', checkAuth, studentController.getStudents);

// ========== LẤY 1 HỌC SINH THEO MÃ ==========
router.get('/:id', checkAuth, studentController.getStudentById);

// ========== THÊM HỌC SINH ==========
router.post('/', checkAuth, validateStudent, studentController.createStudent);

// ========== CẬP NHẬT HỌC SINH ==========
router.put('/:id', checkAuth, validateStudent, studentController.updateStudent);

// ========== XÓA HỌC SINH ==========
router.delete('/:id', checkAuth, studentController.deleteStudent);

module.exports = router;
