// ====== Lấy các phần tử cần dùng ======
const classTableBody   = document.getElementById('classTableBody');
const classRows        = classTableBody.querySelectorAll('tr');
const classCheckboxes  = classTableBody.querySelectorAll('.row-select-checkbox');

const btnToggle        = document.getElementById('btnToggleEditMode');
const btnAddClass      = document.getElementById('btnAddClass');
const btnEditClass     = document.getElementById('btnEditClass');
const btnDeleteClass   = document.getElementById('btnDeleteClass');
const btnViewStudents  = document.getElementById('btnViewStudents');

// Modals
const addClassModal    = document.getElementById('addClassModal');
const editClassModal   = document.getElementById('editClassModal');
const deleteClassModal = document.getElementById('deleteClassModal');
const viewStudentsModal = document.getElementById('viewStudentsModal');

let selectedRow   = null;
let selectModeOn  = false;

// ========= SELECTION MODE =========
function resetSelection() {
    selectedRow = null;
    classCheckboxes.forEach(cb => {
        cb.checked = false;
        cb.closest('tr').classList.remove('row-selected');
    });
}

function enterSelectMode() {
    selectModeOn = true;
    document.body.classList.add('select-mode');
    btnToggle.classList.add('btn-toggle-active');
    resetSelection();
}

function exitSelectMode() {
    selectModeOn = false;
    document.body.classList.remove('select-mode');
    btnToggle.classList.remove('btn-toggle-active');
    resetSelection();
}

btnToggle.addEventListener('click', (e) => {
    e.preventDefault();
    if (selectModeOn) exitSelectMode();
    else enterSelectMode();
});

// Checkbox: chỉ cho chọn 1 dòng
classCheckboxes.forEach(cb => {
    cb.addEventListener('change', () => {
        if (!selectModeOn) {
            cb.checked = false;
            return;
        }
        if (cb.checked) {
            classCheckboxes.forEach(other => {
                if (other !== cb) {
                    other.checked = false;
                    other.closest('tr').classList.remove('row-selected');
                }
            });
            selectedRow = cb.closest('tr');
            selectedRow.classList.add('row-selected');
        } else {
            cb.closest('tr').classList.remove('row-selected');
            if (selectedRow === cb.closest('tr')) selectedRow = null;
        }
    });
});

// Click cả dòng để toggle checkbox
classRows.forEach(row => {
    row.addEventListener('click', (e) => {
        if (!selectModeOn) return;
        if (e.target.classList.contains('row-select-checkbox')) return;

        const cb = row.querySelector('.row-select-checkbox');
        cb.checked = !cb.checked;
        cb.dispatchEvent(new Event('change'));
    });
});

// ========= POPUP THÊM LỚP =========
const addClassForm = document.getElementById('addClassForm');

btnAddClass.addEventListener('click', (e) => {
    e.preventDefault();
    addClassModal.classList.add('show');
});

document.getElementById('closeAddModalBtn').onclick =
document.getElementById('btnCancelAdd').onclick = () => {
    addClassModal.classList.remove('show');
    addClassForm.reset();
};

addClassModal.addEventListener('click', (e) => {
    if (e.target === addClassModal) {
        addClassModal.classList.remove('show');
        addClassForm.reset();
    }
});

addClassForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // TODO: Gửi dữ liệu lên server
    alert('Đã nhấn Lưu (Thêm lớp) – demo UI, chưa kết nối DB.');
    addClassModal.classList.remove('show');
    addClassForm.reset();
});

// ========= POPUP SỬA LỚP =========
const editClassForm = document.getElementById('editClassForm');

btnEditClass.addEventListener('click', (e) => {
    e.preventDefault();

    if (!selectModeOn) {
        alert('Hãy bấm "Sửa đổi" và chọn một lớp trước.');
        return;
    }
    if (!selectedRow) {
        alert('Vui lòng chọn một lớp để sửa.');
        return;
    }

    const cells = selectedRow.querySelectorAll('td');
    document.getElementById('classIdEdit').value = cells[1].textContent.trim();
    document.getElementById('classNameEdit').value = cells[2].textContent.trim();
    document.getElementById('gradeEdit').value = cells[3].textContent.trim();
    document.getElementById('currentStudentsEdit').value = cells[4].textContent.trim();
    document.getElementById('yearEdit').value = cells[5].textContent.trim();

    editClassModal.classList.add('show');
});

document.getElementById('closeEditModalBtn').onclick =
document.getElementById('btnCancelEdit').onclick = () => {
    editClassModal.classList.remove('show');
    editClassForm.reset();
};

editClassModal.addEventListener('click', (e) => {
    if (e.target === editClassModal) {
        editClassModal.classList.remove('show');
        editClassForm.reset();
    }
});

editClassForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // TODO: Gửi dữ liệu cập nhật lên server
    alert('Đã nhấn Lưu (Sửa lớp) – demo UI, chưa kết nối DB.');
    editClassModal.classList.remove('show');
    editClassForm.reset();
    exitSelectMode();
});

// ========= POPUP XÓA LỚP =========
btnDeleteClass.addEventListener('click', (e) => {
    e.preventDefault();

    if (!selectModeOn) {
        alert('Hãy bấm "Sửa đổi" và chọn một lớp trước.');
        return;
    }
    if (!selectedRow) {
        alert('Vui lòng chọn một lớp để xóa.');
        return;
    }

    const cells = selectedRow.querySelectorAll('td');
    const maLop = cells[1].textContent.trim();
    const tenLop = cells[2].textContent.trim();

    document.getElementById('deleteMessage').textContent = 
        `Bạn có chắc chắn muốn xóa lớp ${tenLop} (Mã: ${maLop}) không?`;

    deleteClassModal.classList.add('show');
});

document.getElementById('closeDeleteModalBtn').onclick =
document.getElementById('btnCancelDelete').onclick = () => {
    deleteClassModal.classList.remove('show');
};

deleteClassModal.addEventListener('click', (e) => {
    if (e.target === deleteClassModal) {
        deleteClassModal.classList.remove('show');
    }
});

document.getElementById('btnConfirmDelete').onclick = () => {
    // TODO: Gọi API xóa lớp
    alert('Đã nhấn Xóa – demo UI, chưa kết nối DB.');
    deleteClassModal.classList.remove('show');
    exitSelectMode();
};

// ========= POPUP XEM DANH SÁCH HỌC SINH =========
btnViewStudents.addEventListener('click', (e) => {
    e.preventDefault();

    if (!selectModeOn) {
        alert('Hãy bấm "Sửa đổi" và chọn một lớp trước.');
        return;
    }
    if (!selectedRow) {
        alert('Vui lòng chọn một lớp để xem danh sách học sinh.');
        return;
    }

    const cells = selectedRow.querySelectorAll('td');
    const tenLop = cells[2].textContent.trim();

    document.getElementById('studentsModalTitle').textContent = `Danh sách học sinh lớp ${tenLop}`;
    
    // TODO: Load danh sách học sinh từ server
    viewStudentsModal.classList.add('show');
});

document.getElementById('closeStudentsModalBtn').onclick =
document.getElementById('btnCloseStudents').onclick = () => {
    viewStudentsModal.classList.remove('show');
};

viewStudentsModal.addEventListener('click', (e) => {
    if (e.target === viewStudentsModal) {
        viewStudentsModal.classList.remove('show');
    }
});

document.getElementById('btnExportStudents').onclick = () => {
    alert('Xuất Excel – demo UI, chưa kết nối backend.');
};

// ========= SEARCH & FILTER =========
document.getElementById('searchInput').addEventListener('input', function() {
    const query = this.value.toLowerCase();
    const rows = classTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
});

document.getElementById('gradeSelect').addEventListener('change', function() {
    filterTable();
});

document.getElementById('yearSelect').addEventListener('change', function() {
    filterTable();
});

function filterTable() {
    const gradeFilter = document.getElementById('gradeSelect').value;
    const yearFilter = document.getElementById('yearSelect').value;
    const rows = classTableBody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const grade = cells[3].textContent.trim();
        const year = cells[5].textContent.trim();
        
        let show = true;
        if (gradeFilter && grade !== gradeFilter) show = false;
        if (yearFilter && !year.includes(yearFilter)) show = false;
        
        row.style.display = show ? '' : 'none';
    });
}

// ========= EXPORT EXCEL =========
document.getElementById('btnExport').addEventListener('click', () => {
    alert('Xuất Excel – demo UI, chưa kết nối backend.');
});
