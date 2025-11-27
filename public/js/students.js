// ========== QUẢN LÝ HỌC SINH - KẾT NỐI API ==========

const API_URL = '/api/students';

// ========== LOAD DANH SÁCH HỌC SINH ==========
async function loadStudents() {
    try {
        const yearFilter = document.getElementById('yearFilter').value;
        const classFilter = document.getElementById('classFilter').value;
        
        let url = API_URL;
        const params = new URLSearchParams();
        if (yearFilter) params.append('namhoc', yearFilter);
        if (classFilter) params.append('lop', classFilter);
        if (params.toString()) url += '?' + params.toString();
        
        const response = await fetch(url);
        if (!response.ok) throw new Error('Lỗi tải dữ liệu');
        
        const students = await response.json();
        renderStudentTable(students);
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Không thể tải danh sách học sinh. Kiểm tra kết nối database.');
    }
}

// ========== RENDER BẢNG HỌC SINH ==========
function renderStudentTable(students) {
    const tbody = document.getElementById('studentTableBody');
    
    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Không có dữ liệu</td></tr>';
        return;
    }
    
    tbody.innerHTML = students.map(hs => `
        <tr data-id="${hs.mahocsinh}">
            <td class="select-cell">
                <input type="checkbox" class="row-select-checkbox">
            </td>
            <td>${hs.mahocsinh}</td>
            <td>${hs.hoten}</td>
            <td>${hs.gioitinh}</td>
            <td>${formatDate(hs.ngaysinh)}</td>
            <td>${hs.diachi || ''}</td>
            <td>${hs.email || ''}</td>
        </tr>
    `).join('');
    
    // Gắn lại event cho checkbox
    attachCheckboxEvents();
}

// ========== ĐỊNH DẠNG NGÀY ==========
function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// ========== THÊM HỌC SINH ==========
async function addStudent(formData) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                MaHocSinh: formData.get('studentId') || document.getElementById('studentIdAdd').value,
                HoTen: formData.get('fullName') || document.getElementById('fullNameAdd').value,
                GioiTinh: formData.get('gender') || document.getElementById('genderAdd').value,
                NgaySinh: formData.get('dob') || document.getElementById('dobAdd').value,
                DiaChi: formData.get('address') || document.getElementById('addressAdd').value,
                Email: formData.get('email') || document.getElementById('emailAdd').value
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi thêm học sinh');
        }
        
        alert('Thêm học sinh thành công!');
        loadStudents(); // Reload bảng
        return true;
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Lỗi: ' + error.message);
        return false;
    }
}

// ========== CẬP NHẬT HỌC SINH ==========
async function updateStudent(maHocSinh, data) {
    try {
        const response = await fetch(`${API_URL}/${maHocSinh}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi cập nhật học sinh');
        }
        
        alert('Cập nhật học sinh thành công!');
        loadStudents(); // Reload bảng
        return true;
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Lỗi: ' + error.message);
        return false;
    }
}

// ========== XÓA HỌC SINH ==========
async function deleteStudent(maHocSinh) {
    try {
        const response = await fetch(`${API_URL}/${maHocSinh}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Lỗi xóa học sinh');
        }
        
        alert('Đã xóa học sinh!');
        loadStudents(); // Reload bảng
        return true;
    } catch (error) {
        console.error('Lỗi:', error);
        alert('Lỗi: ' + error.message);
        return false;
    }
}

// ========== GẮN EVENT CHO CHECKBOX ==========
function attachCheckboxEvents() {
    const tableBody = document.getElementById('studentTableBody');
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

// ========== LOAD NĂM HỌC VÀ LỚP CHO FILTER ==========
async function loadFilters() {
    try {
        // Load năm học
        const yearsRes = await fetch('/api/settings/school-years');
        const years = await yearsRes.json();
        const yearSelect = document.getElementById('yearFilter');
        years.forEach(y => {
            const option = document.createElement('option');
            option.value = y.manamhoc;
            option.textContent = y.tennamhoc;
            yearSelect.appendChild(option);
        });
        
        // Load lớp
        const classesRes = await fetch('/api/classes');
        const classes = await classesRes.json();
        const classSelect = document.getElementById('classFilter');
        classes.forEach(c => {
            const option = document.createElement('option');
            option.value = c.malop;
            option.textContent = c.tenlop;
            classSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Lỗi load filters:', error);
    }
}

// ========== KHỞI TẠO KHI TRANG LOAD ==========
document.addEventListener('DOMContentLoaded', () => {
    loadFilters();
    loadStudents();
    
    // Lắng nghe thay đổi filter
    document.getElementById('yearFilter').addEventListener('change', loadStudents);
    document.getElementById('classFilter').addEventListener('change', loadStudents);
});
