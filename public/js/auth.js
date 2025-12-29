// ========== API HELPER - XỬ LÝ XÁC THỰC VÀ PHÂN QUYỀN ==========

// Lấy JWT token từ localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Lưu JWT token vào localStorage
function setAuthToken(token) {
    localStorage.setItem('authToken', token);
}

// Xóa JWT token
function removeAuthToken() {
    localStorage.removeItem('authToken');
}

// Lấy thông tin user từ localStorage
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('userInfo') || '{}');
    } catch {
        return {};
    }
}

// Kiểm tra đã đăng nhập chưa
function isLoggedIn() {
    return getAuthToken() && getCurrentUser().maNguoiDung;
}

// Chuyển hướng đến trang login nếu chưa đăng nhập
function requireLogin() {
    if (!isLoggedIn()) {
        window.location.href = '/pages/login.html';
        return false;
    }
    return true;
}

// Đăng xuất
function logout() {
    removeAuthToken();
    localStorage.removeItem('userInfo');
    localStorage.removeItem('isLoggedIn');
    window.location.href = '/pages/login.html';
}

// Kiểm tra quyền
function hasPermission(permission) {
    const user = getCurrentUser();
    if (!user.quyen) return false;
    
    // Admin có toàn quyền
    if (user.vaiTro === 'ADMIN' || user.quyen.phanQuyen === true || user.quyen.all === true) {
        return true;
    }
    
    return user.quyen[permission] === true;
}

// Kiểm tra vai trò
function hasRole(role) {
    const user = getCurrentUser();
    return user.vaiTro === role;
}

// Fetch API với header xác thực (JWT token)
async function authFetch(url, options = {}) {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    // Thêm JWT token vào Authorization header
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    // Nếu bị từ chối quyền, logout và chuyển về trang login
    if (response.status === 401) {
        logout();
        throw new Error('Phiên đăng nhập hết hạn');
    }
    
    if (response.status === 403) {
        const result = await response.json();
        throw new Error(result.error || 'Bạn không có quyền thực hiện thao tác này');
    }
    
    return response;
}

// Ẩn các phần tử theo selector
function hideElements(selectors) {
    selectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            el.style.display = 'none';
        });
    });
}

// Hiển thị thông báo chế độ chỉ xem
function showReadOnlyNotice() {
    const content = document.querySelector('.content');
    if (content && !document.querySelector('.readonly-notice')) {
        const notice = document.createElement('div');
        notice.className = 'readonly-notice';
        notice.innerHTML = '🔒 Bạn đang ở chế độ chỉ xem. Liên hệ quản trị viên để có quyền chỉnh sửa.';
        notice.style.cssText = 'background: #fff3cd; color: #856404; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; border: 1px solid #ffc107; font-size: 14px;';
        content.insertBefore(notice, content.firstChild);
    }
}

// Disable tất cả input
function disableAllInputs() {
    document.querySelectorAll('input[type="number"], input[type="text"]:not(#searchStudent):not([placeholder*="Tìm"])').forEach(input => {
        if (!input.closest('.search-box') && !input.id?.includes('search')) {
            input.disabled = true;
            input.style.backgroundColor = '#f0f0f0';
        }
    });
}

// ========== ÁP DỤNG PHÂN QUYỀN THEO TRANG ==========
function applyPermissions() {
    const user = getCurrentUser();
    const page = window.location.pathname;

    // Cập nhật lời chào
    const greeting = document.querySelector('.user-info span') || document.getElementById('userGreeting');
    if (greeting && user.hoTen) {
        greeting.textContent = `Xin chào, ${user.hoTen}`;
    }

    // ===== PHÂN QUYỀN MENU THEO VAI TRÒ =====
    const sidebarLinks = document.querySelectorAll('.sidebar a, .sidebar .nav-link, .sidebar-menu a');
    
    // GIÁO VIÊN: Chỉ thấy Dashboard, Nhập điểm, Bảng điểm, Tra cứu điểm HS, Báo cáo
    if (user.vaiTro === 'TEACHER') {
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            if (!href.includes('dashboard') && 
                !href.includes('grade') && 
                !href.includes('student_transcript') &&
                !href.includes('reports')) {
                link.style.display = 'none';
            }
        });
        
        // Chặn truy cập trực tiếp các trang quản lý (không bao gồm student_transcript)
        const restrictedPages = ['students.html', 'classes', 'subject', 'users', 'teaching'];
        const isRestricted = restrictedPages.some(p => page.includes(p));
        if (isRestricted) {
            window.location.href = '/pages/dashboard.html';
            return;
        }
    }
    
    // PHỤ HUYNH VÀ HỌC SINH: Chỉ thấy Dashboard và Tra cứu điểm HS
    if (user.vaiTro === 'PARENT' || user.vaiTro === 'STUDENT') {
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href') || '';
            // CHỈ hiển thị Dashboard và Tra cứu điểm học sinh
            if (!href.includes('dashboard') && !href.includes('student_transcript')) {
                link.style.display = 'none';
            }
        });
        
        // Cho phép truy cập dashboard và student_transcript
        const allowedPages = ['dashboard', 'student_transcript'];
        const isAllowed = allowedPages.some(p => page.includes(p));
        if (!isAllowed && !page.includes('login')) {
            window.location.href = '/pages/dashboard.html';
            return;
        }
    }

    // Hiển thị/ẩn menu quản lý người dùng (chỉ Admin)
    const menuUsers = document.getElementById('menuUsers');
    if (menuUsers) {
        menuUsers.style.display = hasPermission('phanQuyen') ? 'block' : 'none';
    }

    // ===== TRANG QUẢN LÝ HỌC SINH =====
    if (page.includes('students')) {
        if (!hasPermission('quanlyHocSinh')) {
            hideElements(['#btnAddStudent', '#addStudentBtn', '.btn-primary:not(#btnSearch)', '.btn-danger', '.modal-footer .btn-primary']);
            showReadOnlyNotice();
            // Ẩn cột thao tác trong bảng
            document.querySelectorAll('th:last-child, td:last-child').forEach(el => {
                if (el.textContent.includes('Thao tác') || el.querySelector('button')) {
                    el.style.display = 'none';
                }
            });
        }
    }

    // ===== TRANG QUẢN LÝ LỚP =====
    if (page.includes('classes')) {
        if (!hasPermission('quanlyLop')) {
            hideElements(['#btnAddClass', '#addClassBtn', '.btn-primary:not(#btnSearch)', '.btn-danger']);
            showReadOnlyNotice();
            document.querySelectorAll('th:last-child, td:last-child').forEach(el => {
                if (el.textContent.includes('Thao tác') || el.querySelector('button')) {
                    el.style.display = 'none';
                }
            });
        }
        // Hides admin-only action buttons if not admin
        if (!hasRole('ADMIN')) {
            hideElements(['.admin-only']);
        }
    }

    // ===== TRANG QUẢN LÝ MÔN HỌC =====
    if (page.includes('subject')) {
        if (!hasPermission('quanlyMonHoc')) {
            hideElements(['#btnAddSubject', '#addSubjectBtn', '.btn-primary:not(#btnSearch)', '.btn-danger']);
            showReadOnlyNotice();
            document.querySelectorAll('th:last-child, td:last-child').forEach(el => {
                if (el.textContent.includes('Thao tác') || el.querySelector('button')) {
                    el.style.display = 'none';
                }
            });
        }
    }

    // ===== TRANG NHẬP ĐIỂM (chỉ áp dụng cho grade_entry) =====
    if (page.includes('grade_entry')) {
        if (!hasPermission('nhapDiem')) {
            // Ẩn nút lưu, nút thay đổi quy định
            hideElements(['#btnSaveGrades', '#btnSave', '#btn-open-rules', '#btnGradeRules', '#btnSemesterRules', '.btn-primary']);
            showReadOnlyNotice();
            // Disable tất cả ô nhập điểm
            disableAllInputs();
        }
    }

    // ===== TRANG BÁO CÁO =====
    if (page.includes('reports')) {
        if (!hasPermission('baoCao')) {
            showReadOnlyNotice();
        }
    }

    // ===== TRANG QUẢN LÝ NGƯỜI DÙNG (chỉ Admin) =====
    if (page.includes('users')) {
        if (!hasPermission('phanQuyen')) {
            // Chuyển hướng về dashboard nếu không có quyền
            window.location.href = '/pages/dashboard.html';
            return;
        }
    }
}

// Cập nhật giao diện dựa trên quyền (alias cũ)
function updateUIByPermission() {
    applyPermissions();
}

// ========== KHỞI TẠO ==========
document.addEventListener('DOMContentLoaded', () => {
    // Kiểm tra login cho các trang không phải login/register
    const currentPath = window.location.pathname;
    const publicPages = ['/pages/login.html', '/pages/register.html', '/', '/index.html'];
    
    if (!publicPages.includes(currentPath)) {
        // Không bắt buộc login cho đồ án đơn giản
        // Nếu muốn bắt buộc, uncomment dòng dưới:
        // requireLogin();
    }
    
    updateUIByPermission();
});
