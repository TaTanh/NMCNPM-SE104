const express = require('express');
const router = express.Router();
const hanhkiemController = require('../controllers/hanhkiemController');
const { checkAuth, canInputHanhKiem } = require('../middleware/authMiddleware');

// ========== ROUTES HẠNH KIỂM ==========

// Lấy hạnh kiểm của học sinh (theo mã học sinh)
router.get('/hocsinh/:maHocSinh', checkAuth, hanhkiemController.getByHocSinh);

// Lấy hạnh kiểm của lớp
router.get('/lop/:maLop', checkAuth, hanhkiemController.getByLop);

// Nhập/cập nhật hạnh kiểm (chỉ GVCN và Admin)
router.post('/upsert', checkAuth, canInputHanhKiem, hanhkiemController.upsert);

// Nhập hạnh kiểm hàng loạt (chỉ GVCN và Admin)
router.post('/bulk-upsert', checkAuth, canInputHanhKiem, hanhkiemController.bulkUpsert);

// Xóa hạnh kiểm (chỉ GVCN và Admin)
router.delete('/hocsinh/:maHocSinh', checkAuth, canInputHanhKiem, hanhkiemController.deleteHanhKiem);

// Thống kê hạnh kiểm lớp
router.get('/thongke/lop/:maLop', checkAuth, hanhkiemController.getThongKeLop);

// Lấy hạnh kiểm năm của học sinh
router.get('/nam/hocsinh/:maHocSinh', checkAuth, hanhkiemController.getHanhKiemNam);

module.exports = router;
