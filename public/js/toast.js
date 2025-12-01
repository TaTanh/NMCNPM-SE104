// ============================= 
// TOAST NOTIFICATION SYSTEM
// =============================

// Tạo container nếu chưa có
function getToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

// Hàm hiển thị toast
function showToast(message, type = 'success', duration = 3000) {
    const container = getToastContainer();
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    const titles = {
        success: 'Thành công',
        error: 'Lỗi',
        warning: 'Cảnh báo',
        info: 'Thông báo'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <div class="toast-content">
            <div class="toast-title">${titles[type] || titles.info}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="closeToast(this)">&times;</button>
    `;
    
    container.appendChild(toast);
    
    // Tự động đóng sau duration ms
    if (duration > 0) {
        setTimeout(() => {
            closeToast(toast.querySelector('.toast-close'));
        }, duration);
    }
    
    return toast;
}

// Hàm đóng toast
function closeToast(btn) {
    const toast = btn.closest ? btn.closest('.toast') : btn.parentElement;
    if (toast) {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
}

// Các hàm tiện ích
function toastSuccess(message, duration = 3000) {
    return showToast(message, 'success', duration);
}

function toastError(message, duration = 4000) {
    return showToast(message, 'error', duration);
}

function toastWarning(message, duration = 3500) {
    return showToast(message, 'warning', duration);
}

function toastInfo(message, duration = 3000) {
    return showToast(message, 'info', duration);
}
