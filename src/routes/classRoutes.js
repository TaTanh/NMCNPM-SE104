const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');

// ========== LẤY DANH SÁCH LỚP ==========
router.get('/', classController.getClasses);

// ========== LẤY 1 LỚP THEO MÃ ==========
router.get('/:id', classController.getClassById);

// ========== THÊM LỚP ==========
router.post('/', classController.createClass);

// ========== CẬP NHẬT LỚP ==========
router.put('/:id', classController.updateClass);

// ========== XÓA LỚP ==========
router.delete('/:id', classController.deleteClass);

// ========== LẤY DANH SÁCH HỌC SINH TRONG LỚP ==========
router.get('/:id/students', classController.getClassStudents);

// ========== GÁN HỌC SINH VÀO LỚP ==========
router.post('/:id/students', classController.addStudentToClass);

// ========== XÓA HỌC SINH KHỎI LỚP ==========
router.delete('/:id/students/:maHocSinh', classController.removeStudentFromClass);

module.exports = router;
