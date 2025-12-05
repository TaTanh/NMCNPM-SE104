const giangdayModel = require('../models/giangdayModel');

// ========== LẤY PHÂN CÔNG GIẢNG DẠY CỦA GIÁO VIÊN ==========
const getByGiaoVien = async (req, res) => {
    try {
        const { maGiaoVien } = req.params;
        const { maNamHoc, maHocKy } = req.query;

        const danhSach = await giangdayModel.getByGiaoVien(
            parseInt(maGiaoVien),
            maNamHoc ? parseInt(maNamHoc) : null,
            maHocKy ? parseInt(maHocKy) : null
        );

        res.json({
            success: true,
            data: danhSach
        });
    } catch (error) {
        console.error('Error in getByGiaoVien:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy phân công giảng dạy của giáo viên',
            error: error.message
        });
    }
};

// ========== LẤY DANH SÁCH GIÁO VIÊN DẠY LỚP ==========
const getByLop = async (req, res) => {
    try {
        const { maLop } = req.params;
        const { maNamHoc, maHocKy } = req.query;

        const danhSach = await giangdayModel.getByLop(
            parseInt(maLop),
            maNamHoc ? parseInt(maNamHoc) : null,
            maHocKy ? parseInt(maHocKy) : null
        );

        res.json({
            success: true,
            data: danhSach
        });
    } catch (error) {
        console.error('Error in getByLop:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách giáo viên dạy lớp',
            error: error.message
        });
    }
};

// ========== KIỂM TRA QUYỀN NHẬP ĐIỂM ==========
const checkPermission = async (req, res) => {
    try {
        const { maGiaoVien, maLop, maMonHoc } = req.params;
        const { maHocKy, maNamHoc } = req.query;

        if (!maHocKy || !maNamHoc) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin học kỳ hoặc năm học'
            });
        }

        const hasPermission = await giangdayModel.checkPermission(
            parseInt(maGiaoVien),
            parseInt(maLop),
            parseInt(maMonHoc),
            parseInt(maHocKy),
            parseInt(maNamHoc)
        );

        res.json({
            success: true,
            hasPermission
        });
    } catch (error) {
        console.error('Error in checkPermission:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi kiểm tra quyền nhập điểm',
            error: error.message
        });
    }
};

// ========== PHÂN CÔNG GIẢNG DẠY ==========
const create = async (req, res) => {
    try {
        const { maLop, maMonHoc, maGiaoVien, maHocKy, maNamHoc } = req.body;

        if (!maLop || !maMonHoc || !maGiaoVien || !maHocKy || !maNamHoc) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        const result = await giangdayModel.create(
            maLop,
            maMonHoc,
            maGiaoVien,
            maHocKy,
            maNamHoc
        );

        res.json({
            success: true,
            message: 'Phân công giảng dạy thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in create:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phân công giảng dạy',
            error: error.message
        });
    }
};

// ========== PHÂN CÔNG GIẢNG DẠY HÀNG LOẠT ==========
const bulkCreate = async (req, res) => {
    try {
        const { giangDayList } = req.body;

        if (!Array.isArray(giangDayList) || giangDayList.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách phân công không hợp lệ'
            });
        }

        const results = await giangdayModel.bulkCreate(giangDayList);

        res.json({
            success: true,
            message: `Phân công thành công ${results.length} bản ghi`,
            data: results
        });
    } catch (error) {
        console.error('Error in bulkCreate:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi phân công hàng loạt',
            error: error.message
        });
    }
};

// ========== CẬP NHẬT PHÂN CÔNG ==========
const update = async (req, res) => {
    try {
        const { maLop, maMonHoc, maHocKy, maNamHoc } = req.params;
        const { maGiaoVienMoi } = req.body;

        if (!maGiaoVienMoi) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin giáo viên mới'
            });
        }

        const result = await giangdayModel.update(
            parseInt(maLop),
            parseInt(maMonHoc),
            parseInt(maHocKy),
            parseInt(maNamHoc),
            maGiaoVienMoi
        );

        if (result) {
            res.json({
                success: true,
                message: 'Cập nhật phân công thành công',
                data: result
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân công giảng dạy'
            });
        }
    } catch (error) {
        console.error('Error in update:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật phân công',
            error: error.message
        });
    }
};

// ========== XÓA PHÂN CÔNG ==========
const deleteGiangDay = async (req, res) => {
    try {
        const { maLop, maMonHoc, maGiaoVien, maHocKy, maNamHoc } = req.query;

        if (!maLop || !maMonHoc || !maGiaoVien || !maHocKy || !maNamHoc) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        const result = await giangdayModel.delete(
            parseInt(maLop),
            parseInt(maMonHoc),
            parseInt(maGiaoVien),
            parseInt(maHocKy),
            parseInt(maNamHoc)
        );

        if (result) {
            res.json({
                success: true,
                message: 'Xóa phân công thành công'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy phân công giảng dạy'
            });
        }
    } catch (error) {
        console.error('Error in deleteGiangDay:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa phân công',
            error: error.message
        });
    }
};

// ========== LẤY CÁC MÔN HỌC GIÁO VIÊN DẠY ==========
const getMonHocByGiaoVien = async (req, res) => {
    try {
        const { maGiaoVien } = req.params;
        const { maNamHoc, maHocKy } = req.query;

        const danhSach = await giangdayModel.getMonHocByGiaoVien(
            parseInt(maGiaoVien),
            maNamHoc ? parseInt(maNamHoc) : null,
            maHocKy ? parseInt(maHocKy) : null
        );

        res.json({
            success: true,
            data: danhSach
        });
    } catch (error) {
        console.error('Error in getMonHocByGiaoVien:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy môn học của giáo viên',
            error: error.message
        });
    }
};

// ========== LẤY LỚP GIÁO VIÊN DẠY MÔN CỤ THỂ ==========
const getLopByGiaoVienAndMonHoc = async (req, res) => {
    try {
        const { maGiaoVien, maMonHoc } = req.params;
        const { maNamHoc, maHocKy } = req.query;

        const danhSach = await giangdayModel.getLopByGiaoVienAndMonHoc(
            parseInt(maGiaoVien),
            parseInt(maMonHoc),
            maNamHoc ? parseInt(maNamHoc) : null,
            maHocKy ? parseInt(maHocKy) : null
        );

        res.json({
            success: true,
            data: danhSach
        });
    } catch (error) {
        console.error('Error in getLopByGiaoVienAndMonHoc:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lớp giáo viên dạy môn',
            error: error.message
        });
    }
};

// ========== LẤY TẤT CẢ PHÂN CÔNG ==========
const getAll = async (req, res) => {
    try {
        const { maNamHoc, maHocKy } = req.query;

        const danhSach = await giangdayModel.getAll(
            maNamHoc ? parseInt(maNamHoc) : null,
            maHocKy ? parseInt(maHocKy) : null
        );

        res.json({
            success: true,
            data: danhSach
        });
    } catch (error) {
        console.error('Error in getAll:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách phân công',
            error: error.message
        });
    }
};

module.exports = {
    getByGiaoVien,
    getByLop,
    checkPermission,
    create,
    bulkCreate,
    update,
    deleteGiangDay,
    getMonHocByGiaoVien,
    getLopByGiaoVienAndMonHoc,
    getAll
};
