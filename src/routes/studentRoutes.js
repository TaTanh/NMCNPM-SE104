const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { validateStudent } = require('../middleware/validationMiddleware');

// ========== LẤY DANH SÁCH HỌC SINH KÈM THÔNG TIN LỚP ==========
router.get('/with-class', studentController.getStudentsWithClass);

// ========== LẤY DANH SÁCH HỌC SINH ==========
router.get('/', studentController.getStudents);

// ========== LẤY 1 HỌC SINH THEO MÃ ==========
router.get('/:id', studentController.getStudentById);

// ========== THÊM HỌC SINH ==========
router.post('/', validateStudent, studentController.createStudent);

// ========== CẬP NHẬT HỌC SINH ==========
router.put('/:id', validateStudent, studentController.updateStudent);

// ========== XÓA HỌC SINH ==========
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
