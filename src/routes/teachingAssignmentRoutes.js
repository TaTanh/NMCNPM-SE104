/**
 * Teaching Assignment Routes
 */

const express = require('express');
const router = express.Router();
const teachingAssignmentController = require('../controllers/teachingAssignmentController');
const { checkAuth, isAdmin } = require('../middleware/authMiddleware');

/**
 * GET /api/teaching-assignments
 * Fetch aggregated teaching assignments data
 * Query: maNamHoc, maHocKy, maKhoiLop
 */
router.get('/', teachingAssignmentController.getAssignments);

/**
 * PATCH /api/teaching-assignments
 * Save teaching assignments for a class
 * Requires: Admin or authorized user
 */
router.patch('/', checkAuth, isAdmin, teachingAssignmentController.saveAssignments);

module.exports = router;
