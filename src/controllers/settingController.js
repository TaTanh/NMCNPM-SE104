const settingModel = require('../models/settingModel');

// ========== THAM SỐ ==========
const getParams = async (req, res) => {
    try {
        const params = await settingModel.getAllParams();
        res.json(params);
    } catch (err) {
        console.error('Lỗi lấy tham số:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

const updateParam = async (req, res) => {
    try {
        const { name } = req.params;
        const { GiaTri } = req.body;
        
        const param = await settingModel.updateParam(name, GiaTri);
        
        if (!param) {
            return res.status(404).json({ error: 'Không tìm thấy tham số' });
        }
        
        res.json(param);
    } catch (err) {
        console.error('Lỗi cập nhật tham số:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== NĂM HỌC ==========
const getSchoolYears = async (req, res) => {
    try {
        const years = await settingModel.getAllSchoolYears();
        res.json(years);
    } catch (err) {
        console.error('Lỗi lấy năm học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

const createSchoolYear = async (req, res) => {
    try {
        const { MaNamHoc, TenNamHoc } = req.body;
        const year = await settingModel.createSchoolYear({ MaNamHoc, TenNamHoc });
        res.status(201).json(year);
    } catch (err) {
        console.error('Lỗi thêm năm học:', err);
        if (err.code === '23505') {
            res.status(400).json({ message: 'Mã năm học đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

const updateSchoolYear = async (req, res) => {
    try {
        const { id } = req.params;
        const { TenNamHoc } = req.body;
        
        const year = await settingModel.updateSchoolYear(id, { TenNamHoc });
        
        if (!year) {
            return res.status(404).json({ error: 'Không tìm thấy năm học' });
        }
        
        res.json(year);
    } catch (err) {
        console.error('Lỗi cập nhật năm học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

const deleteSchoolYear = async (req, res) => {
    try {
        const { id } = req.params;
        const year = await settingModel.deleteSchoolYear(id);
        
        if (!year) {
            return res.status(404).json({ error: 'Không tìm thấy năm học' });
        }
        
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        console.error('Lỗi xóa năm học:', err);
        if (err.code === '23503') {
            res.status(400).json({ message: 'Không thể xóa năm học đang được sử dụng' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

// ========== HỌC KỲ ==========
const getSemesters = async (req, res) => {
    try {
        const semesters = await settingModel.getAllSemesters();
        res.json(semesters);
    } catch (err) {
        console.error('Lỗi lấy học kỳ:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

const createSemester = async (req, res) => {
    try {
        const { MaHocKy, TenHocKy } = req.body;
        const semester = await settingModel.createSemester({ MaHocKy, TenHocKy });
        res.status(201).json(semester);
    } catch (err) {
        console.error('Lỗi thêm học kỳ:', err);
        if (err.code === '23505') {
            res.status(400).json({ message: 'Mã học kỳ đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

const updateSemester = async (req, res) => {
    try {
        const { id } = req.params;
        const { TenHocKy } = req.body;
        
        const semester = await settingModel.updateSemester(id, { TenHocKy });
        
        if (!semester) {
            return res.status(404).json({ error: 'Không tìm thấy học kỳ' });
        }
        
        res.json(semester);
    } catch (err) {
        console.error('Lỗi cập nhật học kỳ:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

const deleteSemester = async (req, res) => {
    try {
        const { id } = req.params;
        const semester = await settingModel.deleteSemester(id);
        
        if (!semester) {
            return res.status(404).json({ error: 'Không tìm thấy học kỳ' });
        }
        
        res.json({ message: 'Xóa thành công' });
    } catch (err) {
        console.error('Lỗi xóa học kỳ:', err);
        if (err.code === '23503') {
            res.status(400).json({ message: 'Không thể xóa học kỳ đang được sử dụng' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

// ========== KHỐI LỚP ==========
const getGradeLevels = async (req, res) => {
    try {
        const levels = await settingModel.getAllGradeLevels();
        res.json(levels);
    } catch (err) {
        console.error('Lỗi lấy khối lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LOẠI HÌNH KIỂM TRA (READ-ONLY) ==========
const getExamTypes = async (req, res) => {
    try {
        const types = await settingModel.getAllExamTypes();
        res.json(types);
    } catch (err) {
        console.error('Lỗi lấy loại hình kiểm tra:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

module.exports = {
    getParams,
    updateParam,
    getSchoolYears,
    createSchoolYear,
    updateSchoolYear,
    deleteSchoolYear,
    getSemesters,
    createSemester,
    updateSemester,
    deleteSemester,
    getGradeLevels,
    getExamTypes
};
