const studentModel = require('../models/studentModel');
const settingModel = require('../models/settingModel');

// ========== HELPER: KIỂM TRA TUỔI ==========
const validateAge = async (ngaySinh) => {
    if (!ngaySinh) return { valid: true };
    
    const params = await settingModel.getParams(['TuoiToiThieu', 'TuoiToiDa']);
    const tuoiMin = parseInt(params.TuoiToiThieu) || 15;
    const tuoiMax = parseInt(params.TuoiToiDa) || 20;
    
    // Tính tuổi
    const birthDate = new Date(ngaySinh);
    const today = new Date();
    let tuoi = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        tuoi--;
    }
    
    if (tuoi < tuoiMin || tuoi > tuoiMax) {
        return {
            valid: false,
            error: `Tuổi học sinh phải từ ${tuoiMin} đến ${tuoiMax} tuổi (hiện tại: ${tuoi} tuổi)`
        };
    }
    
    return { valid: true };
};

// ========== LẤY DANH SÁCH HỌC SINH KÈM THÔNG TIN LỚP ==========
const getStudentsWithClass = async (req, res) => {
    try {
        const students = await studentModel.findAllWithClass();
        res.json(students);
    } catch (err) {
        console.error('Lỗi lấy danh sách học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY DANH SÁCH HỌC SINH ==========
const getStudents = async (req, res) => {
    try {
        const { namhoc, lop, khoi, search } = req.query;
        const students = await studentModel.findAll({ namhoc, lop, khoi, search });
        res.json(students);
    } catch (err) {
        console.error('Lỗi lấy danh sách học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY 1 HỌC SINH THEO MÃ ==========
const getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await studentModel.findById(id);
        
        if (!student) {
            return res.status(404).json({ error: 'Không tìm thấy học sinh' });
        }
        
        res.json(student);
    } catch (err) {
        console.error('Lỗi lấy học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== THÊM HỌC SINH ==========
const createStudent = async (req, res) => {
    try {
        const { MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh } = req.body;
        
        // QĐ1: Kiểm tra tuổi học sinh
        const ageCheck = await validateAge(NgaySinh);
        if (!ageCheck.valid) {
            return res.status(400).json({ error: ageCheck.error });
        }
        
        const student = await studentModel.create({ MaHocSinh, HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh });
        res.status(201).json(student);
    } catch (err) {
        console.error('Lỗi thêm học sinh:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Mã học sinh đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

// ========== CẬP NHẬT HỌC SINH ==========
const updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        const { HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh } = req.body;
        
        // QĐ1: Kiểm tra tuổi học sinh
        const ageCheck = await validateAge(NgaySinh);
        if (!ageCheck.valid) {
            return res.status(400).json({ error: ageCheck.error });
        }
        
        const student = await studentModel.update(id, { HoTen, GioiTinh, NgaySinh, DiaChi, Email, HoTenPhuHuynh, SdtPhuHuynh });
        
        if (!student) {
            return res.status(404).json({ error: 'Không tìm thấy học sinh' });
        }
        
        res.json(student);
    } catch (err) {
        console.error('Lỗi cập nhật học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== XÓA HỌC SINH ==========
const deleteStudent = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra xem học sinh có được xếp lớp không
        const inClass = await studentModel.isInClass(id);
        if (inClass) {
            return res.status(400).json({ 
                error: 'Không thể xóa học sinh này vì đã được xếp lớp. Vui lòng xóa khỏi lớp trước.' 
            });
        }
        
        // Kiểm tra trong bảng chi tiết điểm
        const hasGrades = await studentModel.hasGrades(id);
        if (hasGrades) {
            return res.status(400).json({ 
                error: 'Không thể xóa học sinh này vì đã có dữ liệu điểm. Vui lòng xóa điểm của học sinh trước.' 
            });
        }
        
        const student = await studentModel.remove(id);
        
        if (!student) {
            return res.status(404).json({ error: 'Không tìm thấy học sinh' });
        }
        
        res.json({ message: 'Đã xóa học sinh', deleted: student });
    } catch (err) {
        console.error('Lỗi xóa học sinh:', err);
        if (err.code === '23503') {
            res.status(400).json({ error: 'Không thể xóa vì học sinh có dữ liệu liên quan trong hệ thống' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

module.exports = {
    getStudentsWithClass,
    getStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};
