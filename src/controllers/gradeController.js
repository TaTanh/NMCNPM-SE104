const gradeModel = require('../models/gradeModel');
const { normalizeHocKy } = require('../utils/semesterUtil');

// ========== LẤY BẢNG ĐIỂM MÔN CỦA LỚP ==========
const getClassSubjectGrades = async (req, res) => {
    try {
        const { maLop, maMonHoc } = req.params;
        const { hocky, namhoc } = req.query;
        const hk = hocky ? normalizeHocKy(hocky) : null;

        // Admin có toàn quyền, GVBM chỉ được xem/sửa môn mình dạy theo phân công
        try {
            const user = req.user;
            if (user && (user.vaiTro === 'GVBM' || user.vaiTro === 'GVCN')) {
                const db = require('../config/db');
                const permQuery = `
                    SELECT 1 FROM GIANGDAY gd
                    WHERE gd.MaLop = $1 AND gd.MaMonHoc = $2 AND gd.MaGiaoVien = $3
                    ${hk ? 'AND gd.MaHocKy = $4' : ''}
                    ${namhoc ? (hk ? 'AND gd.MaNamHoc = $5' : 'AND gd.MaNamHoc = $4') : ''}
                `;
                const params = [maLop, maMonHoc, user.maNguoiDung];
                if (hk) params.push(hk);
                if (namhoc) params.push(namhoc);
                const permRes = await db.query(permQuery, params);
                if (!permRes.rows || permRes.rows.length === 0) {
                    return res.status(403).json({ error: 'Bạn không có quyền nhập điểm cho môn này trong lớp/học kỳ đã chọn' });
                }
            }
            // Admin không cần kiểm tra phân công
        } catch (e) {
            console.warn('Permission check failed:', e.message);
        }
        
        // Nếu chọn "Cả năm" hoặc không chọn học kỳ, trả về cả 3 học kỳ
        if (!hk || hk === 'CN' || hk === 0 || hk === '0') {
            const rows = await gradeModel.getClassSubjectGradesAllSemesters(maLop, maMonHoc);
            
            // Format data giống như reports: group by student với cả 3 học kỳ
            const studentsMap = new Map();
            rows.forEach(row => {
                if (!studentsMap.has(row.mahocsinh)) {
                    studentsMap.set(row.mahocsinh, {
                        MaHocSinh: row.mahocsinh,
                        HoTen: row.hoten,
                        Diem: {}
                    });
                }
                
                const student = studentsMap.get(row.mahocsinh);
                if (!student.Diem[row.tenlhkt]) {
                    student.Diem[row.tenlhkt] = {
                        HK1: row.diemhk1 || null,
                        HK2: row.diemhk2 || null,
                        CN: null // Sẽ tính sau nếu cần
                    };
                } else {
                    // Merge nếu có nhiều điểm cùng loại (không nên xảy ra với query hiện tại)
                    if (row.diemhk1 !== null) student.Diem[row.tenlhkt].HK1 = row.diemhk1;
                    if (row.diemhk2 !== null) student.Diem[row.tenlhkt].HK2 = row.diemhk2;
                }
            });
            
            // Tính điểm cả năm cho mỗi loại kiểm tra: (HK1 + HK2*2) / 3
            studentsMap.forEach(student => {
                Object.keys(student.Diem).forEach(tenlhkt => {
                    const hk1 = student.Diem[tenlhkt].HK1;
                    const hk2 = student.Diem[tenlhkt].HK2;
                    if (hk1 !== null && hk2 !== null) {
                        student.Diem[tenlhkt].CN = parseFloat(((hk1 + hk2 * 2) / 3).toFixed(2));
                    } else if (hk1 !== null) {
                        student.Diem[tenlhkt].CN = hk1;
                    } else if (hk2 !== null) {
                        student.Diem[tenlhkt].CN = hk2;
                    }
                });
            });
            
            return res.json(Array.from(studentsMap.values()));
        }
        
        // Trường hợp chọn HK1 hoặc HK2 cụ thể - giữ nguyên logic cũ
        const rows = await gradeModel.getClassSubjectGrades(maLop, maMonHoc, hk);
        
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
        // Admin có toàn quyền, GVBM/GVCN phải được phân công
        try {
            const user = req.user;
            if (user && (user.vaiTro === 'GVBM' || user.vaiTro === 'GVCN')) {
                const db = require('../config/db');
                // Resolve class and subject from MaBangDiem
                const infoRes = await db.query(
                    `SELECT bdm.MaLop, bdm.MaMonHoc, bdm.MaHocKy FROM BANGDIEMMON bdm WHERE bdm.MaBangDiem = $1`,
                    [MaBangDiem]
                );
                if (!infoRes.rows || infoRes.rows.length === 0) {
                    return res.status(404).json({ error: 'Không tìm thấy bảng điểm' });
                }
                const { malop, mamonhoc, mahocky } = infoRes.rows[0];
                const permQuery = `
                    SELECT 1 FROM GIANGDAY gd
                    WHERE gd.MaLop = $1 AND gd.MaMonHoc = $2 AND gd.MaGiaoVien = $3
                      AND ($4::text IS NULL OR gd.MaHocKy = $4)
                `;
                const permRes = await db.query(permQuery, [malop, mamonhoc, user.maNguoiDung, mahocky || null]);
                if (!permRes.rows || permRes.rows.length === 0) {
                    return res.status(403).json({ error: 'Bạn không có quyền cập nhật điểm cho môn này' });
                }
            }
            // Admin không cần kiểm tra phân công
        } catch (e) {
            console.warn('Update permission check failed:', e.message);
        }
        
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
        const { MaLop, MaMonHoc, MaHocKy, MaNamHoc } = req.body;
        const MaHocKyNormalized = MaHocKy ? normalizeHocKy(MaHocKy) : MaHocKy;
        // Admin có toàn quyền, GVBM/GVCN phải được phân công
        try {
            const user = req.user;
            if (user && (user.vaiTro === 'GVBM' || user.vaiTro === 'GVCN')) {
                const db = require('../config/db');
                const permQuery = `
                    SELECT 1 FROM GIANGDAY gd
                    WHERE gd.MaLop = $1 AND gd.MaMonHoc = $2 AND gd.MaGiaoVien = $3
                      AND ($4::text IS NULL OR gd.MaHocKy = $4)
                      AND ($5::text IS NULL OR gd.MaNamHoc = $5)
                `;
                const permRes = await db.query(permQuery, [MaLop, MaMonHoc, user.maNguoiDung, MaHocKyNormalized || null, MaNamHoc || null]);
                if (!permRes.rows || permRes.rows.length === 0) {
                    return res.status(403).json({ error: 'Bạn không có quyền tạo hoặc truy cập bảng điểm môn này' });
                }
            }
            // Admin không cần kiểm tra phân công
        } catch (e) {
            console.warn('Create permission check failed:', e.message);
        }
        
        // Kiểm tra đã có bảng điểm chưa
        const existing = await gradeModel.findGradeSheet(MaLop, MaMonHoc, MaHocKyNormalized);
        
        if (existing) {
            return res.json(existing);
        }
        
        // Tạo bảng điểm mới
        const gradeSheet = await gradeModel.createGradeSheet(MaLop, MaMonHoc, MaHocKyNormalized);
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
        const hkParam = hocky ? normalizeHocKy(hocky) : null;
        
        // Lấy thông tin lớp của học sinh
        const lopInfo = await gradeModel.getStudentClass(maHocSinh, namhoc);
        if (!lopInfo) {
            return res.json([]);
        }
        const maLop = lopInfo.malop;
        
        // Lấy tất cả các môn học
        const allMonHoc = await gradeModel.getAllSubjects();
        
        // Lấy tất cả học kỳ
        const allHocKy = await gradeModel.getAllSemesters(hkParam);
        
        // Lấy điểm của học sinh
        const diemRows = await gradeModel.getStudentAllGrades(maHocSinh, maLop, hkParam);
        
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
