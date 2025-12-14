const hanhkiemModel = require('../models/hanhkiemModel');
const { normalizeHocKy } = require('../utils/semesterUtil');

// ========== LẤY HẠNH KIỂM CỦA HỌC SINH ==========
const getByHocSinh = async (req, res) => {
    try {
        const { maHocSinh } = req.params;
        const { maNamHoc, maHocKy } = req.query;

        const hanhkiem = await hanhkiemModel.getByHocSinh(
            maHocSinh, // Giữ nguyên chuỗi (ví dụ HS010001)
            maNamHoc || null, // Chuỗi năm học
            maHocKy ? normalizeHocKy(maHocKy) : null
        );

        res.json({
            success: true,
            data: hanhkiem
        });
    } catch (error) {
        console.error('Error in getByHocSinh:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy hạnh kiểm học sinh',
            error: error.message
        });
    }
};

// ========== LẤY HẠNH KIỂM CỦA LỚP ==========
const getByLop = async (req, res) => {
    try {
        const { maLop } = req.params;
        const { maNamHoc, maHocKy } = req.query;

        if (!maNamHoc || !maHocKy) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin năm học hoặc học kỳ'
            });
        }

        const danhSach = await hanhkiemModel.getByLop(
            maLop, // Giữ nguyên chuỗi mã lớp (10A1,...)
            maNamHoc, // Chuỗi năm học
            normalizeHocKy(maHocKy)
        );

        res.json({
            success: true,
            data: danhSach
        });
    } catch (error) {
        console.error('Error in getByLop:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy hạnh kiểm lớp',
            error: error.message
        });
    }
};

// ========== NHẬP/CẬP NHẬT HẠNH KIỂM ==========
const upsert = async (req, res) => {
    try {
        const { maHocSinh, maNamHoc, maHocKy, diemHanhKiem, xepLoai, ghiChu } = req.body;

        if (!maHocSinh || !maNamHoc || !maHocKy || !xepLoai) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin bắt buộc'
            });
        }

        const result = await hanhkiemModel.upsert(
            maHocSinh,
            maNamHoc,
            normalizeHocKy(maHocKy),
            diemHanhKiem || null,
            xepLoai,
            ghiChu || null
        );

        res.json({
            success: true,
            message: 'Cập nhật hạnh kiểm thành công',
            data: result
        });
    } catch (error) {
        console.error('Error in upsert:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật hạnh kiểm',
            error: error.message
        });
    }
};

// ========== NHẬP HẠNH KIỂM HÀNG LOẠT ==========
const bulkUpsert = async (req, res) => {
    try {
        const { hanhKiemList } = req.body;

        if (!Array.isArray(hanhKiemList) || hanhKiemList.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Danh sách hạnh kiểm không hợp lệ'
            });
        }

        const results = await hanhkiemModel.bulkUpsert(hanhKiemList);

        res.json({
            success: true,
            message: `Cập nhật thành công ${results.length} học sinh`,
            data: results
        });
    } catch (error) {
        console.error('Error in bulkUpsert:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi cập nhật hàng loạt',
            error: error.message
        });
    }
};

// ========== XÓA HẠNH KIỂM ==========
const deleteHanhKiem = async (req, res) => {
    try {
        const { maHocSinh } = req.params;
        // Support both query and headers
        const maNamHoc = req.query.maNamHoc || req.headers['x-nam-hoc'];
        const maHocKy = req.query.maHocKy || req.headers['x-hoc-ky'];

        if (!maNamHoc || !maHocKy) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin năm học hoặc học kỳ'
            });
        }

        const result = await hanhkiemModel.delete(
            maHocSinh, // Giữ nguyên chuỗi mã HS
            maNamHoc, // Giữ nguyên chuỗi năm học
            normalizeHocKy(maHocKy)
        );

        if (result) {
            res.json({
                success: true,
                message: 'Xóa hạnh kiểm thành công'
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Không tìm thấy hạnh kiểm'
            });
        }
    } catch (error) {
        console.error('Error in deleteHanhKiem:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa hạnh kiểm',
            error: error.message
        });
    }
};

// ========== THỐNG KÊ HẠNH KIỂM LỚP ==========
const getThongKeLop = async (req, res) => {
    try {
        const { maLop } = req.params;
        const { maNamHoc, maHocKy } = req.query;

        if (!maNamHoc || !maHocKy) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin năm học hoặc học kỳ'
            });
        }

        const thongKe = await hanhkiemModel.getThongKeLop(
            parseInt(maLop),
            parseInt(maNamHoc),
            normalizeHocKy(maHocKy)
        );

        res.json({
            success: true,
            data: thongKe
        });
    } catch (error) {
        console.error('Error in getThongKeLop:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê hạnh kiểm',
            error: error.message
        });
    }
};

// ========== LẤY HẠNH KIỂM NĂM CỦA HỌC SINH ==========
const getHanhKiemNam = async (req, res) => {
    try {
        const { maHocSinh } = req.params;
        const { maNamHoc } = req.query;

        if (!maNamHoc) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu thông tin năm học'
            });
        }

        const result = await hanhkiemModel.getHanhKiemNam(
            maHocSinh,
            maNamHoc
        );

        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error in getHanhKiemNam:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy hạnh kiểm năm',
            error: error.message
        });
    }
};

module.exports = {
    getByHocSinh,
    getByLop,
    upsert,
    bulkUpsert,
    deleteHanhKiem,
    getThongKeLop,
    getHanhKiemNam
};
