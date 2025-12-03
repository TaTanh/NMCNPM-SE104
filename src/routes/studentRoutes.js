const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// ========== LẤY DANH SÁCH HỌC SINH KÈM THÔNG TIN LỚP ==========
router.get('/with-class', studentController.getStudentsWithClass);

// ========== LẤY DANH SÁCH HỌC SINH ==========
router.get('/', studentController.getStudents);

// ========== LẤY 1 HỌC SINH THEO MÃ ==========
router.get('/:id', studentController.getStudentById);

// ========== THÊM HỌC SINH ==========
router.post('/', studentController.createStudent);

// ========== CẬP NHẬT HỌC SINH ==========
router.put('/:id', studentController.updateStudent);

// ========== XÓA HỌC SINH ==========
router.delete('/:id', studentController.deleteStudent);

module.exports = router;
