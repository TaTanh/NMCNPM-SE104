// ========== QUẢN LÝ LỚP HỌC - KẾT NỐI API ==========

const API_URL = '/api/classes';

// ========== LOAD DANH SÁCH LỚP ==========
async function loadClasses() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Lỗi tải dữ liệu');
        
        const classes = await response.json();
        renderClassTable(classes);
    } catch (error) {
        console.error('Lỗi:', error);
        // Giữ dữ liệu mẫu nếu không kết nối được DB
        console.log('Sử dụng dữ liệu mẫu');
    }
}

// ========== RENDER BẢNG LỚP ==========
function renderClassTable(classes) {
    const tbody = document.getElementById('classTableBody');
    
    if (!classes || classes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Không có dữ liệu</td></tr>';
        return;
    }
    
    tbody.innerHTML = classes.map(lop => `
        <tr data-id="${lop.malop}" data-gvcn="${lop.magvcn || ''}">
            <td class="select-cell">
                <input type="checkbox" class="row-select-checkbox">
            </td>
            <td>${lop.malop}</td>
            <td>${lop.tenlop}</td>
            <td>${lop.khoi || ''}</td>
            <td>${lop.siso || 0}</td>
            <td>${lop.tengvcn || 'Chưa phân công'}</td>
            <td>${lop.namhoc || ''}</td>
            <td>
                <button class="btn btn-sm btn-outline" onclick="viewStudentList('${lop.malop}', '${lop.tenlop}')">Xem DS</button>
            </td>
            <td style="white-space: nowrap;">
                ${lop.magvcn ? `
                    <button class="btn btn-sm btn-warning" onclick="openAssignGvcnModal('${lop.malop}', '${lop.magvcn || ''}')" title="Thay GVCN">🔁 Gán lại</button>
                    <button class="btn btn-sm btn-danger" onclick="removeGvcn('${lop.malop}')" title="Huỷ GVCN">⛔ Huỷ GVCN</button>
                ` : `
                    <button class="btn btn-sm btn-success" onclick="openAssignGvcnModal('${lop.malop}', '')" title="Gán GVCN">➕ Gán GVCN</button>
                `}
            </td>
        </tr>
    `).join('');
    
    // Gắn lại event cho checkbox
    attachCheckboxEvents();
}

// ========== THÊM LỚP ==========
async function addClass(data) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                MaLop: data.MaLop,
                TenLop: data.TenLop,
                MaKhoiLop: data.MaKhoiLop,
                MaNamHoc: data.MaNamHoc,
                MaGVCN: data.MaGVCN || null
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi thêm lớp');
        }
        
        alert('Thêm lớp thành công!');
        loadClasses();
        return true;
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Lỗi: ' + error.message);
        return false;
    }
}

// ========== CẬP NHẬT LỚP ==========
async function updateClass(maLop, data) {
    try {
        const response = await fetch(`${API_URL}/${maLop}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi cập nhật lớp');
        }
        
        alert('Cập nhật lớp thành công!');
        loadClasses();
        return true;
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Lỗi: ' + error.message);
        return false;
    }
}

// ========== XÓA LỚP ==========
async function deleteClass(maLop) {
    try {
        const response = await fetch(`${API_URL}/${maLop}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi xóa lớp');
        }
        
        alert('Đã xóa lớp!');
        loadClasses();
        return true;
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Lỗi: ' + error.message);
        return false;
    }
}

// ========== GẮN EVENT CHO CHECKBOX ==========
function attachCheckboxEvents() {
    const tableBody = document.getElementById('classTableBody');
    const checkboxes = tableBody.querySelectorAll('.row-select-checkbox');
    const rows = tableBody.querySelectorAll('tr');
    
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            if (!window.classSelectModeOn) {
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
                window.classSelectedRow = cb.closest('tr');
                window.classSelectedRow.classList.add('row-selected');
            } else {
                cb.closest('tr').classList.remove('row-selected');
                if (window.classSelectedRow === cb.closest('tr')) window.classSelectedRow = null;
            }
        });
    });
    
    rows.forEach(row => {
        row.addEventListener('click', (e) => {
            if (!window.classSelectModeOn) return;
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
    loadClasses();
});
