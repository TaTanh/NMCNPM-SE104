const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { checkAuth, isAdmin } = require('../middleware/authMiddleware');

// ========== LẤY DANH SÁCH LỚP ==========
router.get('/', checkAuth, classController.getClasses);

// ========== LẤY DANH SÁCH HỌC SINH CHƯA ĐƯỢC PHÂN LỚP (PHẢI ĐẶT TRƯỚC /:id) ==========
router.get('/unassigned/students', checkAuth, classController.getUnassignedStudents);

// ========== LẤY DANH SÁCH HỌC SINH TỪ LỚP NGUỒN (PHẢI ĐẶT TRƯỚC /:id) ==========
router.get('/available/from-class', checkAuth, classController.getAvailableStudentsFromClass);

// ========== LẤY 1 LỚP THEO MÃ ==========
router.get('/:id', checkAuth, classController.getClassById);

// ========== THÊM LỚP ==========
router.post('/', checkAuth, classController.createClass);

// ========== CẬP NHẬT LỚP ==========
router.put('/:id', checkAuth, classController.updateClass);

// ========== XÓA LỚP ==========
router.delete('/:id', checkAuth, classController.deleteClass);

// ========== LẤY DANH SÁCH HỌC SINH TRONG LỚP ==========
router.get('/:id/students', checkAuth, classController.getClassStudents);

// ========== THÊM NHIỀU HỌC SINH VÀO LỚP (BULK) ==========
router.post('/:id/students/bulk', checkAuth, classController.bulkAddStudentsToClass);

// ========== GÁN HỌC SINH VÀO LỚP ==========
router.post('/:id/students', checkAuth, classController.addStudentToClass);

// ========== XÓA HỌC SINH KHỎI LỚP ==========
router.delete('/:id/students/:maHocSinh', checkAuth, classController.removeStudentFromClass);

// ========== GÁN / HỦY GVCN CHO LỚP (Chỉ Admin) ==========
router.put('/:id/gvcn', checkAuth, isAdmin, classController.assignGvcnToClass);
router.delete('/:id/gvcn', checkAuth, isAdmin, classController.removeGvcnFromClass);

module.exports = router;
