const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');

// ========== LẤY DANH SÁCH MÔN HỌC ==========
router.get('/', subjectController.getSubjects);

// ========== LẤY 1 MÔN HỌC THEO MÃ ==========
router.get('/:id', subjectController.getSubjectById);

// ========== THÊM MÔN HỌC ==========
router.post('/', subjectController.createSubject);

// ========== CẬP NHẬT MÔN HỌC ==========
router.put('/:id', subjectController.updateSubject);

// ========== XÓA MÔN HỌC ==========
router.delete('/:id', subjectController.deleteSubject);

module.exports = router;
