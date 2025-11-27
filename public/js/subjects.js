// ========== QUẢN LÝ MÔN HỌC - KẾT NỐI API ==========

const API_URL = '/api/subjects';

// ========== LOAD DANH SÁCH MÔN HỌC ==========
async function loadSubjects() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Lỗi tải dữ liệu');
        
        const subjects = await response.json();
        renderSubjectTable(subjects);
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Không thể tải danh sách môn học. Kiểm tra kết nối database.');
    }
}

// ========== RENDER BẢNG MÔN HỌC ==========
function renderSubjectTable(subjects) {
    const tbody = document.getElementById('subjectTableBody');
    
    if (subjects.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Không có dữ liệu</td></tr>';
        return;
    }
    
    tbody.innerHTML = subjects.map(mh => `
        <tr data-id="${mh.mamonhoc}">
            <td class="select-cell">
                <input type="checkbox" class="row-select-checkbox">
            </td>
            <td>${mh.mamonhoc}</td>
            <td>${mh.tenmonhoc}</td>
            <td>${mh.heso}</td>
        </tr>
    `).join('');
    
    // Gắn lại event cho checkbox
    attachCheckboxEvents();
}

// ========== THÊM MÔN HỌC ==========
async function addSubject(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                MaMonHoc: data.MaMonHoc || document.getElementById('subjectIdAdd').value,
                TenMonHoc: data.TenMonHoc || document.getElementById('subjectNameAdd').value,
                HeSo: data.HeSo || document.getElementById('subjectCoefficientAdd').value
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi thêm môn học');
        }
        
        alert('Thêm môn học thành công!');
        loadSubjects(); // Reload bảng
        return true;
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Lỗi: ' + error.message);
        return false;
    }
}

// ========== CẬP NHẬT MÔN HỌC ==========
async function updateSubject(maMonHoc, data) {
    try {
        const response = await fetch(`${API_URL}/${maMonHoc}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi cập nhật môn học');
        }
        
        alert('Cập nhật môn học thành công!');
        loadSubjects(); // Reload bảng
        return true;
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Lỗi: ' + error.message);
        return false;
    }
}

// ========== XÓA MÔN HỌC ==========
async function deleteSubject(maMonHoc) {
    try {
        const response = await fetch(`${API_URL}/${maMonHoc}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi xóa môn học');
        }
        
        alert('Đã xóa môn học!');
        loadSubjects(); // Reload bảng
        return true;
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Lỗi: ' + error.message);
        return false;
    }
}

// ========== GẮN EVENT CHO CHECKBOX ==========
function attachCheckboxEvents() {
    const tableBody = document.getElementById('subjectTableBody');
    const checkboxes = tableBody.querySelectorAll('.row-select-checkbox');
    const rows = tableBody.querySelectorAll('tr');
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            if (!window.selectModeOn) {
                cb.checked = false;
                return;
            }
            if (cb.checked) {
                checkboxes.forEach(other => {
                    if (other !== cb) {
                        other.checked = false;
                        other.closest('tr').classList.remove('row-selected');
                    }
                });
                window.selectedRow = cb.closest('tr');
                window.selectedRow.classList.add('row-selected');
            } else {
                cb.closest('tr').classList.remove('row-selected');
                if (window.selectedRow === cb.closest('tr')) window.selectedRow = null;
            }
        });
    });
    
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            if (!window.selectModeOn) return;
            if (e.target.classList.contains('row-select-checkbox')) return;
            
            const cb = row.querySelector('.row-select-checkbox');
            if (cb) {
                cb.checked = !cb.checked;
                cb.dispatchEvent(new Event('change'));
            }
        });
    });
}

// ========== KHỞI TẠO KHI TRANG LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
    loadSubjects();
});
