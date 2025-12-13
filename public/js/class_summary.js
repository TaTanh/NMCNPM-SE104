// ========================================
// CLASS_SUMMARY.JS - Tổng kết lớp
// ========================================

let currentData = {
    yearId: '',
    semesterId: '',
    classId: '',
    className: '',
    students: [],
    subjects: []
};

// ========================================
// TÍNH HỌC LỰC THEO THÔNG TƯ 58/2011/TT-BGDĐT
// ========================================
function tinhHocLuc(diemTK, subjectGrades) {
    if (!diemTK || diemTK === null) return '-';
    
    const dtk = parseFloat(diemTK);
    
    // Lấy điểm Toán và Văn
    const diemToan = subjectGrades?.['TOAN'] ? parseFloat(subjectGrades['TOAN']) : null;
    const diemVan = subjectGrades?.['VAN'] ? parseFloat(subjectGrades['VAN']) : null;
    
    // Tìm điểm thấp nhất trong các môn
    let diemThapNhat = 10;
    if (subjectGrades) {
        Object.values(subjectGrades).forEach(diem => {
            if (diem !== null && diem !== '-') {
                const d = parseFloat(diem);
                if (d < diemThapNhat) diemThapNhat = d;
            }
        });
    }
    
    // KÉM: DTB < 3.5 HOẶC có môn < 2.0
    if (dtk < 3.5 || diemThapNhat < 2.0) {
        return 'Kém';
    }
    
    // YẾU: DTB >= 3.5, không có môn < 2.0
    if (dtk < 5.0) {
        return 'Yếu';
    }
    
    // TRUNG BÌNH: DTB >= 5.0, ít nhất 1 trong 2 môn Toán/Văn >= 5.0, không có môn < 3.5
    if (dtk >= 5.0 && dtk < 6.5) {
        const coToanVanDat = (diemToan && diemToan >= 5.0) || (diemVan && diemVan >= 5.0);
        if (coToanVanDat && diemThapNhat >= 3.5) {
            return 'Trung bình';
        }
        return 'Yếu';
    }
    
    // KHÁ: DTB >= 6.5, ít nhất 1 trong 2 môn Toán/Văn >= 6.5, không có môn < 5.0
    if (dtk >= 6.5 && dtk < 8.0) {
        const coToanVanKha = (diemToan && diemToan >= 6.5) || (diemVan && diemVan >= 6.5);
        if (coToanVanKha && diemThapNhat >= 5.0) {
            return 'Khá';
        }
        return 'Trung bình';
    }
    
    // GIỎI: DTB >= 8.0, ít nhất 1 trong 2 môn Toán/Văn >= 8.0, không có môn < 6.5
    if (dtk >= 8.0) {
        const coToanVanGioi = (diemToan && diemToan >= 8.0) || (diemVan && diemVan >= 8.0);
        if (coToanVanGioi && diemThapNhat >= 6.5) {
            return 'Giỏi';
        }
        return 'Khá';
    }
    
    return 'Yếu';
}

// ========================================
// KHỞI TẠO
// ========================================
document.addEventListener('DOMContentLoaded', () => {
    loadYears();
    loadClasses();
    
    document.getElementById('khoiFilter').addEventListener('change', loadClasses);
    document.getElementById('btnLoadSummary').addEventListener('click', loadClassSummary);
});

// ========================================
// LOAD DỮ LIỆU
// ========================================
async function loadYears() {
    try {
        const res = await fetch('/api/classes/nam-hoc');
        const data = await res.json();
        
        const yearFilter = document.getElementById('yearFilter');
        yearFilter.innerHTML = '<option value="">-- Chọn năm học --</option>';
        
        data.forEach(year => {
            yearFilter.innerHTML += `<option value="${year.manamhoc}">${year.tennamhoc}</option>`;
        });
    } catch (err) {
        console.error('Lỗi load năm học:', err);
    }
}

async function loadClasses() {
    try {
        const khoi = document.getElementById('khoiFilter').value;
        const url = khoi ? `/api/classes?khoi=${khoi}` : '/api/classes';
        const res = await fetch(url);
        const data = await res.json();
        
        console.log('Classes loaded:', data);
        
        const classFilter = document.getElementById('classFilter');
        classFilter.innerHTML = '<option value="">-- Chọn lớp --</option>';
        
        data.forEach(cls => {
            classFilter.innerHTML += `<option value="${cls.malop}">${cls.tenlop}</option>`;
        });
    } catch (err) {
        console.error('Lỗi load lớp:', err);
    }
}

// ========================================
// TẢI TỔNG KẾT LỚP
// ========================================
async function loadClassSummary() {
    const yearId = document.getElementById('yearFilter').value;
    const semesterId = document.getElementById('semesterFilter').value;
    const classId = document.getElementById('classFilter').value;
    
    console.log('DEBUG:', { yearId, semesterId, classId });
    
    if (!yearId || !semesterId || !classId) {
        showToast('Vui lòng chọn đầy đủ năm học, học kỳ và lớp!', 'warning');
        return;
    }
    
    try {
        if (semesterId === 'CN') {
            // Lấy dữ liệu HK1 và HK2, sau đó gộp tính trung bình năm: (HK1*1 + HK2*2)/3
            const [resHK1, resHK2] = await Promise.all([
                fetch(`/api/report/class-summary-subjects/${classId}/${yearId}/HK1`),
                fetch(`/api/report/class-summary-subjects/${classId}/${yearId}/HK2`)
            ]);
            if (!resHK1.ok || !resHK2.ok) throw new Error('Lỗi tải dữ liệu học kỳ');
            const dataHK1 = await resHK1.json();
            const dataHK2 = await resHK2.json();
            const subjectsUnion = {};
            (dataHK1.subjects || []).forEach(s => { subjectsUnion[s.mamonhoc] = s; });
            (dataHK2.subjects || []).forEach(s => { subjectsUnion[s.mamonhoc] = s; });
            const subjects = Object.values(subjectsUnion);

            // Map HK1/HK2 theo học sinh
            const mapHK1 = {};
            (dataHK1.students || []).forEach(st => { mapHK1[st.mahocsinh] = st; });
            const mergedStudents = (dataHK2.students || []).map(st2 => {
                const st1 = mapHK1[st2.mahocsinh] || { subjectgrades: {} };
                // Tính điểm từng môn: (HK1*1 + HK2*2)/3
                const subjectgrades = {};
                subjects.forEach(s => {
                    const g1Raw = st1.subjectgrades?.[s.mamonhoc];
                    const g2Raw = st2.subjectgrades?.[s.mamonhoc];
                    const g1 = isNaN(parseFloat(g1Raw)) ? null : parseFloat(g1Raw);
                    const g2 = isNaN(parseFloat(g2Raw)) ? null : parseFloat(g2Raw);
                    let annual = null;
                    if (g1 !== null && g2 !== null) annual = ((g1 + 2 * g2) / 3).toFixed(2);
                    else if (g2 !== null) annual = g2.toFixed(2);
                    else if (g1 !== null) annual = g1.toFixed(2);
                    if (annual !== null) subjectgrades[s.mamonhoc] = annual;
                });
                return { ...st2, subjectgrades };
            });

            currentData = {
                yearId,
                semesterId,
                classId,
                className: document.getElementById('classFilter').selectedOptions[0].text,
                students: mergedStudents,
                subjects
            };
        } else {
            // Dữ liệu theo học kỳ đơn
            const url = `/api/report/class-summary-subjects/${classId}/${yearId}/${semesterId}`;
            console.log('Fetch URL:', url);
            const summaryRes = await fetch(url);
            if (!summaryRes.ok) throw new Error('Lỗi tải tổng kết lớp');
            const data = await summaryRes.json();
            currentData = {
                yearId,
                semesterId,
                classId,
                className: document.getElementById('classFilter').selectedOptions[0].text,
                students: data.students || [],
                subjects: data.subjects || []
            };
        }
        console.log('Loaded data:', currentData);
        renderTable();
    } catch (err) {
        console.error('Lỗi:', err);
        showToast('Lỗi tải dữ liệu!', 'error');
    }
}

// ========================================
// RENDER BẢNG TỔNG KẾT
// ========================================
function renderTable() {
    const { semesterId, className, students, subjects } = currentData;
    const hkDisplay = semesterId === 'HK1' ? 'Học kỳ 1' : (semesterId === 'HK2' ? 'Học kỳ 2' : 'Cả năm');
    
    if (!students || students.length === 0) {
        document.getElementById('mainContainer').innerHTML = '<p>Không có dữ liệu</p>';
        return;
    }
    
    // Sắp xếp môn theo thứ tự chuẩn
    const subjectOrder = ['TOAN', 'VAN', 'LY', 'HOA', 'SINH', 'SU', 'DIA', 'GDCD', 'ANH'];
    const sortedSubjects = subjects.sort((a, b) => {
        const idxA = subjectOrder.indexOf(a.mamonhoc);
        const idxB = subjectOrder.indexOf(b.mamonhoc);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });
    
    let html = `
        <div class="summary-header">
            <div class="summary-header-row">
                <span><strong>Lớp:</strong> ${className}</span>
                <span><strong>Học kỳ:</strong> ${hkDisplay}</span>
                <span><strong>Năm học:</strong> ${currentData.yearId}</span>
            </div>
        </div>
        
        <div class="summary-table-wrapper">
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Mã HS</th>
                        <th>Họ và tên</th>`;
    
    // Thêm cột cho từng môn (đã sắp xếp)
    sortedSubjects.forEach(subject => {
        html += `<th title="${subject.tenmonhoc}">${subject.tenmonhoc}</th>`;
    });
    
    html += `
                        <th>Điểm TK</th>
                        <th>Học lực</th>
                        <th>Hạnh kiểm</th>
                        <th>Danh hiệu</th>
                        <th>Thứ hạng</th>
                    </tr>
                </thead>
                <tbody>`;
    
    // Sắp xếp học sinh theo điểm TK để tính thứ hạng
    const studentsWithGrades = students.map((student, originalIndex) => {
        let diemTK = null;
        let countMonHavingGrades = 0;
        let totalGrades = 0;
        
        if (student.subjectgrades && Object.keys(student.subjectgrades).length > 0) {
            Object.values(student.subjectgrades).forEach(diem => {
                if (diem !== null && diem !== '-') {
                    totalGrades += parseFloat(diem);
                    countMonHavingGrades++;
                }
            });
            if (countMonHavingGrades > 0) {
                diemTK = parseFloat((totalGrades / countMonHavingGrades).toFixed(2));
            }
        }
        
        return {
            ...student,
            diemTK,
            originalIndex
        };
    });
    
    // Sắp xếp theo hạnh kiểm (ưu tiên) rồi đến điểm TK để tính thứ hạng
    const hanhKiemPriority = {
        'Tốt': 4,
        'Khá': 3,
        'Trung bình': 2,
        'Yếu': 1
    };
    const sortedForRanking = [...studentsWithGrades].sort((a, b) => {
        const hkA = (a.xeploaihanhkiem || '').trim();
        const hkB = (b.xeploaihanhkiem || '').trim();
        const pA = hanhKiemPriority[hkA] || 0;
        const pB = hanhKiemPriority[hkB] || 0;
        if (pA !== pB) return pB - pA; // ưu tiên hạnh kiểm cao hơn
        // nếu hạnh kiểm bằng nhau, so sánh điểm TK
        if (a.diemTK === null && b.diemTK === null) return 0;
        if (a.diemTK === null) return 1;
        if (b.diemTK === null) return -1;
        return b.diemTK - a.diemTK;
    });
    
    // Tạo map thứ hạng
    const rankingMap = {};
    let currentRank = 1;
    for (let i = 0; i < sortedForRanking.length; i++) {
        const student = sortedForRanking[i];
        const hk = (student.xeploaihanhkiem || '').trim();
        const hasHK = !!hanhKiemPriority[hk];
        if (!hasHK || student.diemTK === null) {
            rankingMap[student.mahocsinh] = '-';
            continue;
        }
        // Nếu cả hạnh kiểm và điểm bằng nhau với học sinh trước thì cùng hạng
        const prev = sortedForRanking[i - 1];
        if (i > 0) {
            const prevHK = (prev?.xeploaihanhkiem || '').trim();
            const sameHK = hanhKiemPriority[prevHK] === hanhKiemPriority[hk];
            const sameDTB = prev?.diemTK === student.diemTK;
            if (sameHK && sameDTB) {
                rankingMap[student.mahocsinh] = rankingMap[prev.mahocsinh];
                continue;
            }
        }
        rankingMap[student.mahocsinh] = currentRank;
        currentRank++;
    }
    
    students.forEach((student, index) => {
        // Tính điểm TK từ trung bình các môn
        let diemTK = null;
        let countMonHavingGrades = 0;
        let totalGrades = 0;
        
        if (student.subjectgrades && Object.keys(student.subjectgrades).length > 0) {
            Object.values(student.subjectgrades).forEach(diem => {
                if (diem !== null && diem !== '-') {
                    totalGrades += parseFloat(diem);
                    countMonHavingGrades++;
                }
            });
            if (countMonHavingGrades > 0) {
                diemTK = (totalGrades / countMonHavingGrades).toFixed(2);
            }
        }
        
        // Tính học lực theo Thông tư 58
        const hocLuc = tinhHocLuc(diemTK, student.subjectgrades);
                // Lấy hạnh kiểm
                const hanhkiem = student.xeploaihanhkiem || '-';
        
                // Tính danh hiệu theo Thông tư 58
                let danhHieu = '-';
                if (hocLuc === 'Giỏi' && hanhkiem === 'Tốt') {
                    danhHieu = 'Học sinh Giỏi';
                } else if ((hocLuc === 'Khá' && hanhkiem === 'Tốt') || (hocLuc === 'Giỏi' && hanhkiem === 'Khá')) {
                    danhHieu = 'Học sinh Tiên tiến';
                }
        
                // Lấy thứ hạng
                const thuHang = rankingMap[student.mahocsinh] || '-';
        
        
        const hasGrades = diemTK !== null;
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.mahocsinh}</td>
                <td style="text-align:left;">${student.hoten}</td>`;
        
        // Điểm từng môn (theo thứ tự đã sắp)
        if (sortedSubjects.length > 0) {
            sortedSubjects.forEach(subject => {
                const diem = student.subjectgrades?.[subject.mamonhoc] || '-';
                html += `<td class="subject-cell">${diem}</td>`;
            });
        }
        
        // Điểm TK + Xếp loại + Hạnh kiểm (chỉ hiển thị, không cho nhập)
        html += `
                <td class="diem-tk">${diemTK || '-'}</td>
                <td>${hocLuc}</td>
                <td>${hanhkiem}</td>
                <td>${danhHieu}</td>
                <td>${thuHang}</td>
            </tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>`;
    
    document.getElementById('mainContainer').innerHTML = html;
}

// ========================================
// LƯU HẠNH KIỂM
// ========================================
async function saveHanhKiem(maHocSinh, xepLoai) {
    if (!xepLoai.trim()) return;
    
    // Normalize input
    const val = xepLoai.toLowerCase().trim();
    let normalized = '';
    
    if (val === '1' || val === 't' || val === 'tốt') {
        normalized = 'Tốt';
    } else if (val === '2' || val === 'k' || val === 'khá') {
        normalized = 'Khá';
    } else if (val === '3' || val === 'đ' || val === 'đạt' || val === 'd') {
        normalized = 'Đạt';
    } else if (val === '4' || val === 'cd' || val === 'chưa đạt') {
        normalized = 'Chưa Đạt';
    } else {
        return;
    }
    
    const userId = localStorage.getItem('userId');
    if (!userId) {
        showToast('Chưa đăng nhập!', 'error');
        return;
    }
    
    try {
        const res = await fetch('/api/hanhkiem', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId
            },
            body: JSON.stringify({
                MaHocSinh: maHocSinh,
                MaNamHoc: currentData.yearId,
                MaHocKy: currentData.semesterId,
                XepLoai: normalized,
                GhiChu: null
            })
        });
        
        if (!res.ok) {
            const error = await res.json();
            showToast(error.message || 'Lỗi lưu hạnh kiểm!', 'warning');
        } else {
            showToast('✓ Lưu thành công', 'success');
        }
    } catch (err) {
        console.error('Lỗi:', err);
    }
}

// ========================================
// LƯU TẤT CẢ
// ========================================
async function saveAll() {
    showToast('Chức năng sẽ sớm được cập nhật', 'info');
}

// ========================================
// XUẤT EXCEL
// ========================================
async function exportToExcel() {
    showToast('Chức năng sẽ sớm được cập nhật', 'info');
}
