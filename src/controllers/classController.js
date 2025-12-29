const classModel = require('../models/classModel');
const settingModel = require('../models/settingModel');
const userModel = require('../models/userModel');
const auditModel = require('../models/auditModel');

// ========== LẤY DANH SÁCH LỚP ==========
const getClasses = async (req, res) => {
    try {
        // SECURITY: Học sinh chỉ được xem lớp của mình
        if (req.user && req.user.vaiTro === 'STUDENT') {
            const userMaHS = req.user.tenDangNhap;
            // Lấy lớp học của học sinh này
            const studentClasses = await classModel.getClassesByStudent(userMaHS);
            return res.json(studentClasses);
        }
        
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
        const { MaLop, TenLop, MaKhoiLop, MaNamHoc, SiSo, MaGVCN } = req.body;
        if (MaGVCN) {
            const mg = parseInt(MaGVCN, 10);
            if (isNaN(mg)) return res.status(400).json({ error: 'MaGVCN không hợp lệ' });
            const isTeacher = await userModel.isGVBM(mg); // chấp nhận GVBM, GVCN, ADMIN
            if (!isTeacher) {
                return res.status(400).json({ error: 'Người được chọn không phải giáo viên hợp lệ hoặc sai ID' });
            }
            
            // Kiểm tra GVCN đã phụ trách lớp khác trong cùng năm học chưa
            const conflict = await classModel.checkGvcnConflict(mg, MaNamHoc);
            if (conflict) {
                return res.status(400).json({ 
                    error: `Giáo viên này đã là GVCN của lớp ${conflict.tenlop} trong năm học ${conflict.tennamhoc}. Một GVCN chỉ có thể phụ trách một lớp trong cùng năm học.`,
                    conflict: {
                        maLop: conflict.malop,
                        tenLop: conflict.tenlop,
                        tenNamHoc: conflict.tennamhoc
                    }
                });
            }
            
            // Auto-switch role to GVCN if needed
            await userModel.setRole(mg, 'GVCN');
        }
        
        const classData = await classModel.create({ MaLop, TenLop, MaKhoiLop, MaNamHoc, SiSo, MaGVCN });

        // Audit if MaGVCN provided
        if (MaGVCN) {
            try {
                await auditModel.createLog({
                    MaNguoiDung: req.user && req.user.maNguoiDung ? req.user.maNguoiDung : null,
                    HanhDong: 'ASSIGN_GVCN',
                    BangMuc: 'LOP',
                    MaDoiTuong: MaLop,
                    ChiTiet: { newGvcn: MaGVCN }
                });
            } catch (err) {
                console.error('Không thể ghi audit log (create):', err);
            }
        }

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
        const { TenLop, MaKhoiLop, MaNamHoc, SiSo, MaGVCN } = req.body;
        if (MaGVCN) {
            const mg = parseInt(MaGVCN, 10);
            if (isNaN(mg)) return res.status(400).json({ error: 'MaGVCN không hợp lệ' });
            const isTeacher = await userModel.isGVBM(mg); // chấp nhận GVBM, GVCN, ADMIN
            if (!isTeacher) {
                return res.status(400).json({ error: 'Người được chọn không phải giáo viên hợp lệ hoặc sai ID' });
            }
            
            // Kiểm tra GVCN đã phụ trách lớp khác trong cùng năm học chưa
            const conflict = await classModel.checkGvcnConflict(mg, MaNamHoc, id);
            if (conflict) {
                return res.status(400).json({ 
                    error: `Giáo viên này đã là GVCN của lớp ${conflict.tenlop} trong năm học ${conflict.tennamhoc}. Một GVCN chỉ có thể phụ trách một lớp trong cùng năm học.`,
                    conflict: {
                        maLop: conflict.malop,
                        tenLop: conflict.tenlop,
                        tenNamHoc: conflict.tennamhoc
                    }
                });
            }
            
            // Auto-switch role to GVCN if needed
            await userModel.setRole(mg, 'GVCN');
        }
        
        // Fetch previous to detect GVCN changes
        const prev = await classModel.findById(id);
        const classData = await classModel.update(id, { TenLop, MaKhoiLop, MaNamHoc, SiSo, MaGVCN });
        
        if (!classData) {
            return res.status(404).json({ error: 'Không tìm thấy lớp' });
        }
        
        // Audit if GVCN changed
        try {
            const prevGvcn = prev ? prev.magvcn : null;
            const newGvcn = MaGVCN || null;
            if (MaGVCN !== undefined && String(prevGvcn) !== String(newGvcn)) {
                await auditModel.createLog({
                    MaNguoiDung: req.user && req.user.maNguoiDung ? req.user.maNguoiDung : null,
                    HanhDong: prevGvcn ? 'CHANGE_GVCN' : 'ASSIGN_GVCN',
                    BangMuc: 'LOP',
                    MaDoiTuong: id,
                    ChiTiet: { previousGvcn: prevGvcn, newGvcn: newGvcn }
                });
            }
        } catch (err) {
            console.error('Không thể ghi audit log (update):', err);
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

// ========== THÊM NHIỀU HỌC SINH VÀO LỚP (BULK) ==========
const bulkAddStudentsToClass = async (req, res) => {
    try {
        const { id: maLop } = req.params;
        const { students } = req.body; // Array of MaHocSinh
        
        if (!students || !Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ error: 'Danh sách học sinh không hợp lệ' });
        }
        
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
        const sisoSauKhiThem = sisoHienTai + students.length;
        
        if (sisoSauKhiThem > sisoToiDa) {
            return res.status(400).json({ 
                error: `Vượt quá sĩ số tối đa. Lớp hiện có ${sisoHienTai}/${sisoToiDa} học sinh. Không thể thêm ${students.length} học sinh.`,
                currentSize: sisoHienTai,
                maxSize: sisoToiDa,
                requestedAdd: students.length
            });
        }
        
        // QĐ4: Xử lý học sinh đã thuộc lớp khác trong cùng năm học
        // Nếu học sinh đã ở lớp khác trong năm, tự động chuyển lớp
        for (const maHocSinh of students) {
            const existingClass = await classModel.checkStudentInYearClass(maHocSinh, lop.manamhoc);
            if (existingClass && existingClass.malop !== maLop) {
                // Xóa khỏi lớp cũ trước khi thêm vào lớp mới
                await classModel.removeStudent(existingClass.malop, maHocSinh);
            }
        }
        
        // Thêm học sinh vào lớp (bulk)
        const result = await classModel.bulkAddStudents(maLop, students);
        
        res.status(201).json({ 
            message: `Đã thêm ${result.success.length}/${students.length} học sinh vào lớp thành công`,
            success: result.success,
            failed: result.failed,
            total: students.length
        });
    } catch (err) {
        console.error('Lỗi thêm nhiều học sinh vào lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY DANH SÁCH HỌC SINH CHƯA ĐƯỢC PHÂN LỚP ==========
const getUnassignedStudents = async (req, res) => {
    try {
        const { namhoc } = req.query;
        
        if (!namhoc) {
            return res.status(400).json({ error: 'Thiếu tham số năm học' });
        }
        
        const students = await classModel.getUnassignedStudents(namhoc);
        res.json(students);
    } catch (err) {
        console.error('Lỗi lấy học sinh chưa phân lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY DANH SÁCH HỌC SINH TỪ LỚP NGUỒN (KHẢ DỤNG ĐỂ IMPORT) ==========
const getAvailableStudentsFromClass = async (req, res) => {
    try {
        const { sourceClass, targetYear } = req.query;
        
        if (!sourceClass || !targetYear) {
            return res.status(400).json({ error: 'Thiếu tham số lớp nguồn hoặc năm học đích' });
        }
        
        const students = await classModel.getAvailableStudentsFromClass(sourceClass, targetYear);
        res.json(students);
    } catch (err) {
        console.error('Lỗi lấy học sinh từ lớp nguồn:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== GÁN GVCN CHO LỚP ==========
const assignGvcnToClass = async (req, res) => {
    try {
        const { id } = req.params; // maLop
        const { MaGVCN } = req.body;

        if (!MaGVCN) {
            return res.status(400).json({ error: 'Thiếu MaGVCN' });
        }

        const mg = parseInt(MaGVCN, 10);
        if (isNaN(mg)) return res.status(400).json({ error: 'MaGVCN không hợp lệ' });

        const isTeacher = await userModel.isGVBM(mg); // chấp nhận GVBM, GVCN, ADMIN
        if (!isTeacher) {
            return res.status(400).json({ error: 'Người được chọn không phải giáo viên hợp lệ hoặc sai ID' });
        }

        // Kiểm tra lớp tồn tại
        const lop = await classModel.findById(id);
        if (!lop) return res.status(404).json({ error: 'Không tìm thấy lớp' });

        // Kiểm tra GVCN đã phụ trách lớp khác trong cùng năm học chưa
        const conflict = await classModel.checkGvcnConflict(mg, lop.manamhoc, id);
        if (conflict) {
            return res.status(400).json({ 
                error: `Giáo viên này đã là GVCN của lớp ${conflict.tenlop} trong năm học ${conflict.tennamhoc}. Một GVCN chỉ có thể phụ trách một lớp trong cùng năm học.`,
                conflict: {
                    maLop: conflict.malop,
                    tenLop: conflict.tenlop,
                    tenNamHoc: conflict.tennamhoc
                }
            });
        }

        // Auto-switch role to GVCN if needed
        await userModel.setRole(mg, 'GVCN');

        const previousGvcn = lop.magvcn || lop.magvcn === 0 ? lop.magvcn : null;
        const updated = await classModel.updateGvcn(id, mg);

        // Log audit
        try {
            await auditModel.createLog({
                MaNguoiDung: req.user && req.user.maNguoiDung ? req.user.maNguoiDung : null,
                HanhDong: 'ASSIGN_GVCN',
                BangMuc: 'LOP',
                MaDoiTuong: id,
                ChiTiet: { previousGvcn, newGvcn: mg }
            });
        } catch (err) {
            console.error('Không thể ghi audit log:', err);
        }

        res.json(updated);
    } catch (err) {
        console.error('Lỗi gán GVCN cho lớp:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== HỦY GVCN CHO LỚP ==========
const removeGvcnFromClass = async (req, res) => {
    try {
        const { id } = req.params; // maLop
        // Kiểm tra lớp tồn tại
        const lop = await classModel.findById(id);
        if (!lop) return res.status(404).json({ error: 'Không tìm thấy lớp' });

        const previousGvcn = lop.magvcn || lop.magvcn === 0 ? lop.magvcn : null;
        const updated = await classModel.updateGvcn(id, null);

        try {
            await auditModel.createLog({
                MaNguoiDung: req.user && req.user.maNguoiDung ? req.user.maNguoiDung : null,
                HanhDong: 'UNASSIGN_GVCN',
                BangMuc: 'LOP',
                MaDoiTuong: id,
                ChiTiet: { previousGvcn }
            });
        } catch (err) {
            console.error('Không thể ghi audit log:', err);
        }

        res.json(updated);
    } catch (err) {
        console.error('Lỗi hủy GVCN cho lớp:', err);
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
    removeStudentFromClass,
    bulkAddStudentsToClass,
    getUnassignedStudents,
    getAvailableStudentsFromClass
    ,
    assignGvcnToClass,
    removeGvcnFromClass
};
