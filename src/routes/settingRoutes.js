const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');

// ========== THAM SỐ ==========
router.get('/params', settingController.getParams);
router.put('/params/:name', settingController.updateParam);

// ========== NĂM HỌC ==========
router.get('/school-years', settingController.getSchoolYears);
router.post('/school-years', settingController.createSchoolYear);
router.put('/school-years/:id', settingController.updateSchoolYear);
router.delete('/school-years/:id', settingController.deleteSchoolYear);

// ========== HỌC KỲ ==========
router.get('/semesters', settingController.getSemesters);
router.post('/semesters', settingController.createSemester);
router.put('/semesters/:id', settingController.updateSemester);
router.delete('/semesters/:id', settingController.deleteSemester);

// ========== KHỐI LỚP ==========
router.get('/grade-levels', settingController.getGradeLevels);

// ========== LOẠI HÌNH KIỂM TRA (READ-ONLY) ==========
router.get('/exam-types', settingController.getExamTypes);

module.exports = router;
