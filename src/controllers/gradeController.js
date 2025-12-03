const gradeModel = require('../models/gradeModel');

// ========== LẤY BẢNG ĐIỂM MÔN CỦA LỚP ==========
const getClassSubjectGrades = async (req, res) => {
    try {
        const { maLop, maMonHoc } = req.params;
        const { hocky } = req.query;
        
        const rows = await gradeModel.getClassSubjectGrades(maLop, maMonHoc, hocky);
        
        // Gom điểm theo học sinh
        const studentsMap = new Map();
        rows.forEach(row => {
            if (!studentsMap.has(row.mahocsinh)) {
                studentsMap.set(row.mahocsinh, {
                    MaHocSinh: row.mahocsinh,
                    HoTen: row.hoten,
                    Diem: {}
                });
            }
            if (row.tenlhkt && row.diem !== null) {
                const student = studentsMap.get(row.mahocsinh);
                if (!student.Diem[row.tenlhkt]) {
                    student.Diem[row.tenlhkt] = [];
                }
                student.Diem[row.tenlhkt].push(row.diem);
            }
        });
        
        res.json(Array.from(studentsMap.values()));
    } catch (err) {
        console.error('Lỗi lấy bảng điểm:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY LOẠI HÌNH KIỂM TRA ==========
const getExamTypes = async (req, res) => {
    try {
        const examTypes = await gradeModel.getExamTypes();
        res.json(examTypes);
    } catch (err) {
        console.error('Lỗi lấy loại hình kiểm tra:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== CẬP NHẬT ĐIỂM HỌC SINH ==========
const updateGrade = async (req, res) => {
    try {
        const { MaBangDiem, MaHocSinh, MaLHKT, Diem } = req.body;
        
        // QĐ6: Lấy giới hạn điểm từ THAMSO
        const { diemMin, diemMax } = await gradeModel.getGradeLimits();
        
        // Kiểm tra điểm hợp lệ
        if (Diem < diemMin || Diem > diemMax) {
            return res.status(400).json({ error: `Điểm phải từ ${diemMin} đến ${diemMax}` });
        }
        
        // Upsert điểm
        const grade = await gradeModel.upsertGrade({ MaBangDiem, MaHocSinh, MaLHKT, Diem });
        res.json(grade);
    } catch (err) {
        console.error('Lỗi cập nhật điểm:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== TẠO BẢNG ĐIỂM MÔN CHO LỚP ==========
const createGradeSheet = async (req, res) => {
    try {
        const { MaLop, MaMonHoc, MaHocKy } = req.body;
        
        // Kiểm tra đã có bảng điểm chưa
        const existing = await gradeModel.findGradeSheet(MaLop, MaMonHoc, MaHocKy);
        
        if (existing) {
            return res.json(existing);
        }
        
        // Tạo bảng điểm mới
        const gradeSheet = await gradeModel.createGradeSheet(MaLop, MaMonHoc, MaHocKy);
        res.status(201).json(gradeSheet);
    } catch (err) {
        console.error('Lỗi tạo bảng điểm:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== QĐ6: TÍNH ĐIỂM TRUNG BÌNH MÔN ==========
const getStudentAverage = async (req, res) => {
    try {
        const { maBangDiem, maHocSinh } = req.params;
        
        // Lấy tất cả điểm và hệ số
        const grades = await gradeModel.getStudentGrades(maBangDiem, maHocSinh);
        
        if (grades.length === 0) {
            return res.json({ diemTB: null, dat: null, message: 'Chưa có điểm' });
        }
        
        // Tính điểm TB = (∑ điểm × trọng số) / ∑ trọng số
        let tongDiem = 0;
        let tongHeSo = 0;
        
        grades.forEach(row => {
            tongDiem += parseFloat(row.diem) * parseInt(row.heso);
            tongHeSo += parseInt(row.heso);
        });
        
        // Làm tròn 0.1
        const diemTB = Math.round((tongDiem / tongHeSo) * 10) / 10;
        
        // QĐ7: Kiểm tra đạt môn
        const diemDat = await gradeModel.getPassingGrade();
        const dat = diemTB >= diemDat;
        
        res.json({ 
            diemTB, 
            dat, 
            diemDatMon: diemDat,
            message: dat ? 'Đạt' : 'Chưa đạt'
        });
    } catch (err) {
        console.error('Lỗi tính điểm TB:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY BẢNG ĐIỂM TỔNG HỢP CỦA HỌC SINH ==========
const getStudentGrades = async (req, res) => {
    try {
        const { maHocSinh } = req.params;
        const { namhoc, hocky } = req.query;
        
        // Lấy thông tin lớp của học sinh
        const lopInfo = await gradeModel.getStudentClass(maHocSinh, namhoc);
        if (!lopInfo) {
            return res.json([]);
        }
        const maLop = lopInfo.malop;
        
        // Lấy tất cả các môn học
        const allMonHoc = await gradeModel.getAllSubjects();
        
        // Lấy tất cả học kỳ
        const allHocKy = await gradeModel.getAllSemesters(hocky);
        
        // Lấy điểm của học sinh
        const diemRows = await gradeModel.getStudentAllGrades(maHocSinh, maLop, hocky);
        
        // Gom điểm theo môn học và học kỳ
        const resultMap = new Map();
        
        // Khởi tạo tất cả các môn với tất cả học kỳ
        allMonHoc.forEach(mh => {
            allHocKy.forEach(hk => {
                const key = `${mh.mamonhoc}_${hk.mahocky}`;
                resultMap.set(key, {
                    MaMonHoc: mh.mamonhoc,
                    TenMonHoc: mh.tenmonhoc,
                    MaHocKy: hk.mahocky,
                    TenHocKy: hk.tenhocky,
                    Diem: {}
                });
            });
        });
        
        // Điền điểm vào
        diemRows.forEach(row => {
            const key = `${row.mamonhoc}_${row.mahocky}`;
            if (resultMap.has(key)) {
                const mon = resultMap.get(key);
                if (row.tenlhkt && row.diem !== null) {
                    if (!mon.Diem[row.tenlhkt]) {
                        mon.Diem[row.tenlhkt] = [];
                    }
                    mon.Diem[row.tenlhkt].push({ diem: row.diem, heso: row.heso });
                }
            }
        });
        
        // Chuyển thành array và sắp xếp
        const result = Array.from(resultMap.values()).sort((a, b) => {
            if (a.TenMonHoc < b.TenMonHoc) return -1;
            if (a.TenMonHoc > b.TenMonHoc) return 1;
            return a.MaHocKy.localeCompare(b.MaHocKy);
        });
        
        res.json(result);
    } catch (err) {
        console.error('Lỗi lấy bảng điểm học sinh:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

module.exports = {
    getClassSubjectGrades,
    getExamTypes,
    updateGrade,
    createGradeSheet,
    getStudentAverage,
    getStudentGrades
};
