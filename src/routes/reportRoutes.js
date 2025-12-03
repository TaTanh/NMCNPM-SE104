const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// ========== BÁO CÁO TỔNG KẾT MÔN ==========
router.get('/subject', reportController.getSubjectReport);

// ========== BÁO CÁO TỔNG KẾT HỌC KỲ ==========
router.get('/semester', reportController.getSemesterReport);

module.exports = router;
