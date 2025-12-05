const express = require('express');
const router = express.Router();
const giangdayController = require('../controllers/giangdayController');
const { checkAuth, isAdmin, isTeacher } = require('../middleware/authMiddleware');

// ========== ROUTES GIẢNG DẠY ==========

// Lấy phân công của giáo viên
router.get('/giaovien/:maGiaoVien', checkAuth, isTeacher, giangdayController.getByGiaoVien);

// Lấy danh sách giáo viên dạy lớp
router.get('/lop/:maLop', checkAuth, giangdayController.getByLop);

// Kiểm tra quyền nhập điểm
router.get('/permission/:maGiaoVien/:maLop/:maMonHoc', checkAuth, giangdayController.checkPermission);

// Phân công giảng dạy (chỉ Admin)
router.post('/', checkAuth, isAdmin, giangdayController.create);

// Phân công hàng loạt (chỉ Admin)
router.post('/bulk', checkAuth, isAdmin, giangdayController.bulkCreate);

// Cập nhật phân công (chỉ Admin)
router.put('/:maLop/:maMonHoc/:maHocKy/:maNamHoc', checkAuth, isAdmin, giangdayController.update);

// Xóa phân công (chỉ Admin)
router.delete('/', checkAuth, isAdmin, giangdayController.deleteGiangDay);

// Lấy môn học giáo viên dạy
router.get('/monhoc/giaovien/:maGiaoVien', checkAuth, isTeacher, giangdayController.getMonHocByGiaoVien);

// Lấy lớp giáo viên dạy môn cụ thể
router.get('/lop/giaovien/:maGiaoVien/monhoc/:maMonHoc', checkAuth, isTeacher, giangdayController.getLopByGiaoVienAndMonHoc);

// Lấy tất cả phân công (chỉ Admin)
router.get('/', checkAuth, isAdmin, giangdayController.getAll);

module.exports = router;
