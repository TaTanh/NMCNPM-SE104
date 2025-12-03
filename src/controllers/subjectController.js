const subjectModel = require('../models/subjectModel');

// ========== LẤY DANH SÁCH MÔN HỌC ==========
const getSubjects = async (req, res) => {
    try {
        const subjects = await subjectModel.findAll();
        res.json(subjects);
    } catch (err) {
        console.error('Lỗi lấy danh sách môn học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY 1 MÔN HỌC THEO MÃ ==========
const getSubjectById = async (req, res) => {
    try {
        const { id } = req.params;
        const subject = await subjectModel.findById(id);
        
        if (!subject) {
            return res.status(404).json({ error: 'Không tìm thấy môn học' });
        }
        
        res.json(subject);
    } catch (err) {
        console.error('Lỗi lấy môn học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== THÊM MÔN HỌC ==========
const createSubject = async (req, res) => {
    try {
        const { MaMonHoc, TenMonHoc, HeSo } = req.body;
        
        const subject = await subjectModel.create({ MaMonHoc, TenMonHoc, HeSo });
        res.status(201).json(subject);
    } catch (err) {
        console.error('Lỗi thêm môn học:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Mã môn học đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

// ========== CẬP NHẬT MÔN HỌC ==========
const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { TenMonHoc, HeSo } = req.body;
        
        const subject = await subjectModel.update(id, { TenMonHoc, HeSo });
        
        if (!subject) {
            return res.status(404).json({ error: 'Không tìm thấy môn học' });
        }
        
        res.json(subject);
    } catch (err) {
        console.error('Lỗi cập nhật môn học:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== XÓA MÔN HỌC ==========
const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra xem môn học có điểm không
        const hasGrades = await subjectModel.hasGrades(id);
        if (hasGrades) {
            return res.status(400).json({ 
                error: 'Không thể xóa môn học này vì đã có dữ liệu điểm. Vui lòng xóa điểm của môn học trước.' 
            });
        }
        
        const subject = await subjectModel.remove(id);
        
        if (!subject) {
            return res.status(404).json({ error: 'Không tìm thấy môn học' });
        }
        
        res.json({ message: 'Đã xóa môn học', deleted: subject });
    } catch (err) {
        console.error('Lỗi xóa môn học:', err);
        if (err.code === '23503') {
            res.status(400).json({ error: 'Không thể xóa vì môn học có dữ liệu liên quan trong hệ thống' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

module.exports = {
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject
};
