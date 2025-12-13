// ========================================
// HANHKIEM.JS - Nhập hạnh kiểm
// Phiên bản: Bảng theo mẫu (HK1/HK2 riêng, Cả năm tổng hợp)
// ========================================

let currentData = {
    yearId: '',
    semesterId: '',
    classId: '',
    className: '',
    students: [],
    hanhkiemData: {} // { maHocSinh: { HK1: {xepLoai, ghiChu}, HK2: {}, CN: {} } }
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
    
    // YẾU: DTB >= 3.5
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
    document.getElementById('btnLoadClass').addEventListener('click', loadStudentsTable);
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
// TẢI DANH SÁCH HỌC SINH VÀ HIỂN THỊ BẢNG
// ========================================
async function loadStudentsTable() {
    const yearId = document.getElementById('yearFilter').value;
    const semesterId = document.getElementById('semesterFilter').value;
    const classId = document.getElementById('classFilter').value;
    
    if (!yearId || !semesterId || !classId) {
        showToast('Vui lòng chọn đầy đủ năm học, học kỳ và lớp!', 'warning');
        return;
    }
    
    try {
        // Lấy danh sách học sinh với điểm TK và học lực từ API tổng kết
        const res = await fetch(`/api/report/class-summary-subjects/${classId}/${yearId}/${semesterId}`);
        if (!res.ok) throw new Error('Lỗi tải dữ liệu học sinh');
        const data = await res.json();
        const students = data.students || [];
        
        if (students.length === 0) {
            showToast('Lớp này chưa có học sinh!', 'warning');
            return;
        }
        
        // Lưu thông tin
        currentData.yearId = yearId;
        currentData.semesterId = semesterId;
        currentData.classId = classId;
        currentData.className = document.getElementById('classFilter').selectedOptions[0].text;
        currentData.students = students;
        currentData.hanhkiemData = {};
        
        // Load dữ liệu hạnh kiểm hiện có
        await loadExistingHanhKiem();
        
        // Hiển thị bảng
        if (semesterId === 'CN') {
            renderTableCaNam();
        } else {
            renderTableHocKy();
        }
        
    } catch (err) {
        console.error('Lỗi load học sinh:', err);
        showToast('Lỗi tải danh sách học sinh!', 'error');
    }
}

// ========================================
// LOAD DỮ LIỆU HẠNH KIỂM HIỆN CÓ
// ========================================
async function loadExistingHanhKiem() {
    const { yearId, classId, students } = currentData;
    
    console.log('Loading existing hanhkiem for:', { yearId, classId, studentCount: students.length });
    
    for (const student of students) {
        currentData.hanhkiemData[student.mahocsinh] = {
            HK1: { xepLoai: '', ghiChu: '' },
            HK2: { xepLoai: '', ghiChu: '' },
            CN: { xepLoai: '', ghiChu: '' }
        };
        
        // Load HK1
        try {
            const res1 = await authFetch(`/api/hanhkiem/${student.mahocsinh}/${yearId}/HK1`);
            if (res1.ok) {
                const data1 = await res1.json();
                console.log(`✓ HK1 for ${student.mahocsinh}:`, data1);
                if (data1 && data1.xeploai) {
                    currentData.hanhkiemData[student.mahocsinh].HK1 = {
                        xepLoai: data1.xeploai,
                        ghiChu: data1.ghichu || ''
                    };
                }
            }
        } catch (err) {
            console.error('Lỗi load HK1:', student.mahocsinh, err);
        }
        
        // Load HK2
        try {
            const res2 = await authFetch(`/api/hanhkiem/${student.mahocsinh}/${yearId}/HK2`);
            if (res2.ok) {
                const data2 = await res2.json();
                console.log(`✓ HK2 for ${student.mahocsinh}:`, data2);
                if (data2 && data2.xeploai) {
                    currentData.hanhkiemData[student.mahocsinh].HK2 = {
                        xepLoai: data2.xeploai,
                        ghiChu: data2.ghichu || ''
                    };
                }
            }
        } catch (err) {
            console.error('Lỗi load HK2:', student.mahocsinh, err);
        }
        
        // Load Cả năm
        try {
            const resCN = await authFetch(`/api/hanhkiem/${student.mahocsinh}/${yearId}/CN`);
            if (resCN.ok) {
                const dataCN = await resCN.json();
                console.log(`✓ CN for ${student.mahocsinh}:`, dataCN);
                if (dataCN && dataCN.xeploai) {
                    currentData.hanhkiemData[student.mahocsinh].CN = {
                        xepLoai: dataCN.xeploai,
                        ghiChu: dataCN.ghichu || ''
                    };
                }
            }
        } catch (err) {
            console.error('Lỗi load CN:', student.mahocsinh, err);
        }
    }
    
    console.log('✅ Loaded hanhkiemData:', currentData.hanhkiemData);
}

// ========================================
// RENDER BẢNG THEO HỌC KỲ (HK1 hoặc HK2)
// ========================================
function renderTableHocKy() {
    const { semesterId, className, students, hanhkiemData } = currentData;
    const hkDisplay = semesterId === 'HK1' ? 'Học kỳ 1' : 'Học kỳ 2';
    
    console.log('Rendering table for semester:', semesterId);
    console.log('hanhkiemData:', hanhkiemData);
    
    let html = `
        <div class="hanhkiem-header-info">
            <div class="hanhkiem-header-row">
                <span class="hanhkiem-header-label">Lớp:</span>
                <span class="hanhkiem-header-value">${className}</span>
            </div>
            <div class="hanhkiem-header-row">
                <span class="hanhkiem-header-label">Học kỳ:</span>
                <span class="hanhkiem-header-value">${hkDisplay}</span>
            </div>
        </div>
        
        <div class="hanhkiem-hints">
            <strong>Cách nhập bằng phím tắt:</strong> 
            [Tốt] = 1, T, tốt, t | 
            [Khá] = 2, K, khá, k | 
            [Trung bình] = 3, TB, tb | 
            [Yếu] = 4, Y, yếu, y
        </div>
        
        <div class="hanhkiem-table-wrapper">
            <table class="hanhkiem-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Mã học sinh</th>
                        <th>Họ và tên</th>
                        <th>Điểm TK</th>
                        <th>Học lực</th>
                        <th>Hạnh kiểm</th>
                        <th>Ghi chú</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>`;
    
    students.forEach((student, index) => {
        const hkData = hanhkiemData[student.mahocsinh][semesterId];
        
        // Tính điểm TK từ điểm từng môn
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
        
        const hasGrades = diemTK !== null;
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.mahocsinh}</td>
                <td style="text-align:left;">${student.hoten}</td>
                <td>${diemTK || '-'}</td>
                <td>${hocLuc}</td>
                <td>
                    <input type="text" 
                           class="hanhkiem-input xeploai-input" 
                           data-ma="${student.mahocsinh}" 
                           data-field="xepLoai"
                           value="${hkData.xepLoai}"
                           ${!hasGrades ? 'disabled' : ''}
                           placeholder="Tốt/Khá/Trung bình/Yếu"
                           title="${!hasGrades ? 'Học sinh chưa có điểm' : 'Nhập hạnh kiểm'}">
                </td>
                <td>
                    <input type="text" 
                           class="hanhkiem-input" 
                           data-ma="${student.mahocsinh}" 
                           data-field="ghiChu"
                           value="${hkData.ghiChu}"
                           placeholder="Ghi chú">
                </td>
                <td>
                    <button type="button" 
                            class="btn-delete-hanhkiem" 
                            onclick="deleteHanhKiem('${student.mahocsinh}', '${student.hoten.replace(/'/g, "\\'")}')"
                            title="Xóa hạnh kiểm"
                            ${!hkData.xepLoai ? 'disabled' : ''}>
                        🗑️
                    </button>
                </td>
            </tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <div class="hanhkiem-button-group">
            <button type="button" class="btn-save-all" onclick="saveAllHanhKiem()">💾 Lưu tất cả</button>
        </div>`;
    
    document.getElementById('mainContainer').innerHTML = html;
    
    // Gắn sự kiện phím tắt
    attachShortcutHandlers();
}

// ========================================
// RENDER BẢNG CẢ NĂM
// ========================================
function renderTableCaNam() {
    const { className, students, hanhkiemData } = currentData;
    
    let html = `
        <div class="hanhkiem-header-info">
            <div class="hanhkiem-header-row">
                <span class="hanhkiem-header-label">Lớp:</span>
                <span class="hanhkiem-header-value">${className}</span>
            </div>
            <div class="hanhkiem-header-row">
                <span class="hanhkiem-header-label">Học kỳ:</span>
                <span class="hanhkiem-header-value">Cả năm</span>
            </div>
        </div>
        
        <div class="hanhkiem-hints">
            <strong>Cách nhập bằng phím tắt:</strong> 
            [Tốt] = 1, T, tốt, t | 
            [Khá] = 2, K, khá, k | 
            [Trung bình] = 3, TB, tb | 
            [Yếu] = 4, Y, yếu, y
        </div>
        
        <div class="hanhkiem-table-wrapper">
            <table class="hanhkiem-table">
                <thead>
                    <tr>
                        <th rowspan="2">STT</th>
                        <th rowspan="2">Mã học sinh</th>
                        <th rowspan="2">Họ và tên</th>
                        <th rowspan="2">Điểm TK</th>
                        <th rowspan="2">Học lực</th>
                        <th colspan="2">Học kỳ 1</th>
                        <th colspan="2">Học kỳ 2</th>
                        <th colspan="2">Cả năm</th>
                        <th rowspan="2">Ghi chú</th>
                        <th rowspan="2">Thao tác</th>
                    </tr>
                    <tr>
                        <th>HK1</th>
                        <th>HK2</th>
                        <th>HK1</th>
                        <th>HK2</th>
                        <th>Kết quả học tập</th>
                        <th>Hạnh kiểm</th>
                    </tr>
                </thead>
                <tbody>`;
    
    students.forEach((student, index) => {
        const hk1 = hanhkiemData[student.mahocsinh].HK1;
        const hk2 = hanhkiemData[student.mahocsinh].HK2;
        const cn = hanhkiemData[student.mahocsinh].CN;
        
        // Tính điểm TK từ điểm từng môn
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
        
        const hasGrades = diemTK !== null;
        
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${student.mahocsinh}</td>
                <td style="text-align:left;">${student.hoten}</td>
                <td>${diemTK || '-'}</td>
                <td>${hocLuc}</td>
                <td>${hk1.xepLoai || ''}</td>
                <td>${hk2.xepLoai || ''}</td>
                <td>-</td>
                <td>
                    <input type="text" 
                           class="hanhkiem-input xeploai-input" 
                           data-ma="${student.mahocsinh}" 
                           data-field="xepLoai"
                           value="${cn.xepLoai}"
                           ${!hasGrades ? 'disabled' : ''}
                           placeholder="Tốt/Khá/Trung bình/Yếu"
                           title="${!hasGrades ? 'Học sinh chưa có điểm' : 'Nhập hạnh kiểm'}">
                </td>
                <td>
                    <input type="text" 
                           class="hanhkiem-input" 
                           data-ma="${student.mahocsinh}" 
                           data-field="ghiChu"
                           value="${cn.ghiChu}"
                           placeholder="Ghi chú">
                </td>
                <td>
                    <button type="button" 
                            class="btn-delete-hanhkiem" 
                            onclick="deleteHanhKiem('${student.mahocsinh}', '${student.hoten.replace(/'/g, "\\'")}')"
                            title="Xóa hạnh kiểm"
                            ${!cn.xepLoai ? 'disabled' : ''}>
                        🗑️
                    </button>
                </td>
            </tr>`;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <div class="hanhkiem-button-group">
            <button type="button" class="btn-save-all" onclick="saveAllHanhKiem()">💾 Lưu tất cả</button>
        </div>`;
    
    document.getElementById('mainContainer').innerHTML = html;
    
    // Gắn sự kiện phím tắt
    attachShortcutHandlers();
}

// ========================================
// GẮN SỰ KIỆN PHÍM TẮT
// ========================================
function attachShortcutHandlers() {
    const inputs = document.querySelectorAll('.xeploai-input');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            const val = this.value.trim().toLowerCase();
            let normalized = '';
            
            // Phím tắt
            if (val === '1' || val === 't' || val === 'tốt') {
                normalized = 'Tốt';
            } else if (val === '2' || val === 'k' || val === 'khá') {
                normalized = 'Khá';
            } else if (val === '3' || val === 'tb' || val === 'trung bình' || val === 'trung binh') {
                normalized = 'Trung bình';
            } else if (val === '4' || val === 'y' || val === 'yếu' || val === 'yeu') {
                normalized = 'Yếu';
            } else if (val === 'tốt' || val === 'khá' || val === 'trung bình' || val === 'yếu') {
                normalized = val.charAt(0).toUpperCase() + val.slice(1);
            } else if (val) {
                // Giá trị không hợp lệ
                this.classList.add('error');
                showToast('Xếp loại không hợp lệ! Dùng: Tốt, Khá, Trung bình, Yếu', 'warning');
                return;
            }
            
            this.value = normalized;
            this.classList.remove('error');
            if (normalized) {
                this.classList.add('success');
            }
            
            // Lưu vào bộ nhớ
            const ma = this.dataset.ma;
            const field = this.dataset.field;
            currentData.hanhkiemData[ma][currentData.semesterId][field] = normalized;
        });
        
        // Enter -> Tab
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const next = this.parentElement.nextElementSibling?.querySelector('input');
                if (next) {
                    next.focus();
                } else {
                    // Chuyển sang dòng tiếp theo
                    const nextRow = this.closest('tr').nextElementSibling;
                    if (nextRow) {
                        nextRow.querySelector('.xeploai-input')?.focus();
                    }
                }
            }
        });
    });
    
    // Ghi chú
    const ghiChuInputs = document.querySelectorAll('[data-field="ghiChu"]');
    ghiChuInputs.forEach(input => {
        input.addEventListener('blur', function() {
            const ma = this.dataset.ma;
            const field = this.dataset.field;
            currentData.hanhkiemData[ma][currentData.semesterId][field] = this.value;
        });
    });
}

// ========================================
// LƯU TẤT CẢ HẠNH KIỂM
// ========================================
async function saveAllHanhKiem() {
    const { yearId, semesterId, classId, students, hanhkiemData } = currentData;
    
    console.log('saveAllHanhKiem called with:', { yearId, semesterId, classId });
    
    if (!yearId || !semesterId || !classId) {
        showToast('Thiếu thông tin!', 'error');
        return;
    }
    
    if (!isLoggedIn()) {
        showToast('Chưa đăng nhập!', 'error');
        return;
    }
    
    // ĐỌC DỮ LIỆU TỪ CÁC Ô INPUT TRƯỚC KHI LƯU (để không bỏ sót dữ liệu chưa blur)
    const xepLoaiInputs = document.querySelectorAll('.xeploai-input');
    xepLoaiInputs.forEach(input => {
        const ma = input.dataset.ma;
        const val = input.value.trim();
        if (ma && val) {
            // Chuẩn hóa giá trị
            let normalized = '';
            const valLower = val.toLowerCase();
            if (valLower === '1' || valLower === 't' || valLower === 'tốt') {
                normalized = 'Tốt';
            } else if (valLower === '2' || valLower === 'k' || valLower === 'khá') {
                normalized = 'Khá';
            } else if (valLower === '3' || valLower === 'tb' || valLower === 'trung bình' || valLower === 'trung binh') {
                normalized = 'Trung bình';
            } else if (valLower === '4' || valLower === 'y' || valLower === 'yếu' || valLower === 'yeu') {
                normalized = 'Yếu';
            } else if (val === 'Tốt' || val === 'Khá' || val === 'Trung bình' || val === 'Yếu') {
                normalized = val;
            }
            
            if (normalized) {
                currentData.hanhkiemData[ma][semesterId].xepLoai = normalized;
            }
        }
    });
    
    // Đọc ghi chú
    const ghiChuInputs = document.querySelectorAll('[data-field="ghiChu"]');
    ghiChuInputs.forEach(input => {
        const ma = input.dataset.ma;
        if (ma) {
            currentData.hanhkiemData[ma][semesterId].ghiChu = input.value.trim();
        }
    });
    
    // Thu thập danh sách hạnh kiểm cần lưu
    const hanhKiemList = [];
    
    for (const student of students) {
        const data = hanhkiemData[student.mahocsinh][semesterId];
        
        if (!data.xepLoai) {
            continue; // Bỏ qua nếu chưa nhập
        }
        
        hanhKiemList.push({
            maHocSinh: student.mahocsinh,
            maNamHoc: yearId,
            maHocKy: semesterId,
            xepLoai: data.xepLoai,
            ghiChu: data.ghiChu || null
        });
    }
    
    console.log('hanhKiemList to save:', hanhKiemList);
    
    if (hanhKiemList.length === 0) {
        showToast('Chưa có dữ liệu hạnh kiểm nào để lưu!', 'warning');
        return;
    }
    
    try {
        // Sử dụng bulk-upsert để lưu hàng loạt
        const res = await authFetch('/api/hanhkiem/bulk-upsert', {
            method: 'POST',
            body: JSON.stringify({
                hanhKiemList: hanhKiemList
            })
        });
        
        console.log('Save response status:', res.status);
        
        if (res.ok) {
            const result = await res.json();
            console.log('Save result:', result);
            showToast(`✅ Lưu thành công ${result.data.length} bản ghi!`, 'success');
            
            // Tải lại dữ liệu để đảm bảo đồng bộ
            await loadExistingHanhKiem();
            
            // Render lại bảng
            if (semesterId === 'CN') {
                renderTableCaNam();
            } else {
                renderTableHocKy();
            }
        } else {
            const error = await res.json();
            console.error('Lỗi lưu hạnh kiểm:', error);
            showToast(`❌ Lỗi: ${error.message || 'Không thể lưu hạnh kiểm'}`, 'error');
        }
    } catch (err) {
        console.error('Lỗi khi lưu hạnh kiểm:', err);
        showToast(`❌ Lỗi: ${err.message || 'Không thể kết nối server'}`, 'error');
    }
}

// ========================================
// XÓA HẠNH KIỂM
// ========================================
async function deleteHanhKiem(maHocSinh, hoTen) {
    const { yearId, semesterId } = currentData;
    
    if (!confirm(`Bạn có chắc muốn xóa hạnh kiểm của học sinh ${hoTen}?`)) {
        return;
    }
    
    try {
        // Encode các tham số để tránh lỗi URL
        const params = new URLSearchParams({
            maNamHoc: yearId,
            maHocKy: semesterId
        });
        
        const res = await authFetch(`/api/hanhkiem/hocsinh/${maHocSinh}?${params.toString()}`, {
            method: 'DELETE'
        });
        
        console.log('Delete response:', res.status);
        
        if (res.ok) {
            showToast(`✅ Đã xóa hạnh kiểm của ${hoTen}`, 'success');
            
            // Xóa dữ liệu trong bộ nhớ
            currentData.hanhkiemData[maHocSinh][semesterId] = {
                xepLoai: '',
                ghiChu: ''
            };
            
            // Tải lại bảng
            if (semesterId === 'CN') {
                renderTableCaNam();
            } else {
                renderTableHocKy();
            }
        } else {
            const error = await res.json();
            console.error('Delete error:', error);
            showToast(`❌ Lỗi: ${error.message || 'Không thể xóa'}`, 'error');
        }
    } catch (err) {
        console.error('Lỗi khi xóa hạnh kiểm:', err);
        showToast(`❌ Lỗi: ${err.message}`, 'error');
    }
}
