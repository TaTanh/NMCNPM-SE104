const classModel = require('../models/classModel');
const settingModel = require('../models/settingModel');

// ========== LẤY DANH SÁCH LỚP ==========
const getClasses = async (req, res) => {
    try {
        const { namhoc, khoi } = req.query;
        const classes = await classModel.findAll({ namhoc, khoi });
        res.json(classes);
    } catch (err) {
        console.error('Lỗi lấy danh sách lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY 1 LỚP THEO MÃ ==========
const getClassById = async (req, res) => {
    try {
        const { id } = req.params;
        const classData = await classModel.findById(id);
        
        if (!classData) {
            return res.status(404).json({ error: 'Không tìm thấy lớp' });
        }
        
        res.json(classData);
    } catch (err) {
        console.error('Lỗi lấy lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== THÊM LỚP ==========
const createClass = async (req, res) => {
    try {
        const { MaLop, TenLop, MaKhoiLop, MaNamHoc, SiSo } = req.body;
        
        const classData = await classModel.create({ MaLop, TenLop, MaKhoiLop, MaNamHoc, SiSo });
        res.status(201).json(classData);
    } catch (err) {
        console.error('Lỗi thêm lớp:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Mã lớp đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

// ========== CẬP NHẬT LỚP ==========
const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { TenLop, MaKhoiLop, MaNamHoc, SiSo } = req.body;
        
        const classData = await classModel.update(id, { TenLop, MaKhoiLop, MaNamHoc, SiSo });
        
        if (!classData) {
            return res.status(404).json({ error: 'Không tìm thấy lớp' });
        }
        
        res.json(classData);
    } catch (err) {
        console.error('Lỗi cập nhật lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== XÓA LỚP ==========
const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra xem lớp có học sinh không
        const hasStudents = await classModel.hasStudents(id);
        if (hasStudents) {
            return res.status(400).json({ 
                error: 'Không thể xóa lớp này vì đã có học sinh được xếp vào lớp. Vui lòng chuyển học sinh sang lớp khác trước.' 
            });
        }
        
        const classData = await classModel.remove(id);
        
        if (!classData) {
            return res.status(404).json({ error: 'Không tìm thấy lớp' });
        }
        
        res.json({ message: 'Đã xóa lớp', deleted: classData });
    } catch (err) {
        console.error('Lỗi xóa lớp:', err);
        if (err.code === '23503') {
            res.status(400).json({ error: 'Không thể xóa vì lớp có dữ liệu liên quan trong hệ thống' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

// ========== LẤY DANH SÁCH HỌC SINH TRONG LỚP ==========
const getClassStudents = async (req, res) => {
    try {
        const { id } = req.params;
        const students = await classModel.getStudents(id);
        res.json(students);
    } catch (err) {
        console.error('Lỗi lấy học sinh trong lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== GÁN HỌC SINH VÀO LỚP (QĐ3, QĐ4) ==========
const addStudentToClass = async (req, res) => {
    try {
        const { id: maLop } = req.params;
        const { MaHocSinh } = req.body;
        
        // Lấy thông tin lớp
        const lop = await classModel.findById(maLop);
        if (!lop) {
            return res.status(404).json({ error: 'Không tìm thấy lớp' });
        }
        
        // QĐ3: Kiểm tra sĩ số tối đa
        const sisoParam = await settingModel.getParam('SiSoToiDa');
        const sisoToiDa = sisoParam ? parseInt(sisoParam.giatri) : 40;
        
        // Đếm số học sinh hiện tại trong lớp
        const sisoHienTai = await classModel.countStudents(maLop);
        
        if (sisoHienTai >= sisoToiDa) {
            return res.status(400).json({ 
                error: `Lớp ${lop.tenlop} đã đủ sĩ số tối đa (${sisoToiDa} học sinh)` 
            });
        }
        
        // QĐ4: Kiểm tra học sinh đã thuộc lớp khác trong cùng năm học chưa
        const existingClass = await classModel.checkStudentInYearClass(MaHocSinh, lop.manamhoc);
        if (existingClass) {
            return res.status(400).json({ 
                error: `Học sinh đã thuộc lớp ${existingClass.tenlop} trong năm học ${lop.manamhoc}. Mỗi học sinh chỉ thuộc một lớp trong cùng năm học.` 
            });
        }
        
        // Thêm học sinh vào lớp
        await classModel.addStudent(maLop, MaHocSinh);
        
        res.status(201).json({ message: 'Đã thêm học sinh vào lớp thành công' });
    } catch (err) {
        console.error('Lỗi gán học sinh vào lớp:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Học sinh đã có trong lớp này' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

// ========== XÓA HỌC SINH KHỎI LỚP ==========
const removeStudentFromClass = async (req, res) => {
    try {
        const { id: maLop, maHocSinh } = req.params;
        
        const result = await classModel.removeStudent(maLop, maHocSinh);
        
        if (!result) {
            return res.status(404).json({ error: 'Không tìm thấy học sinh trong lớp' });
        }
        
        res.json({ message: 'Đã xóa học sinh khỏi lớp' });
    } catch (err) {
        console.error('Lỗi xóa học sinh khỏi lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

module.exports = {
    getClasses,
    getClassById,
    createClass,
    updateClass,
    deleteClass,
    getClassStudents,
    addStudentToClass,
    removeStudentFromClass
};
