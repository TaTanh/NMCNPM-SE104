// ========== MIDDLEWARE PHÂN QUYỀN ==========

const userModel = require('../models/userModel');

// Middleware kiểm tra đăng nhập (dựa vào header x-user-id)
// Lưu ý: Đây là cách đơn giản cho đồ án, production nên dùng JWT
const checkAuth = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: 'Chưa đăng nhập' });
        }
        
        const user = await userModel.findById(userId);
        
        if (!user) {
            return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ' });
        }
        
        // Gắn thông tin user vào request
        req.user = {
            maNguoiDung: user.manguoidung,
            tenDangNhap: user.tendangnhap,
            hoTen: user.hoten,
            vaiTro: user.mavaitro,
            tenVaiTro: user.tenvaitro,
            quyen: typeof user.quyen === 'string' ? JSON.parse(user.quyen) : user.quyen
        };
        
        next();
    } catch (err) {
        console.error('Lỗi xác thực:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// Middleware kiểm tra quyền cụ thể
const checkPermission = (permission) => {
    return (req, res, next) => {
        // Nếu chưa qua checkAuth, bỏ qua (cho phép truy cập công khai)
        if (!req.user) {
            return next();
        }
        
        const quyen = req.user.quyen || {};
        
        // Admin có toàn quyền
        if (req.user.vaiTro === 'ADMIN' || quyen.phanQuyen === true) {
            return next();
        }
        
        // Kiểm tra quyền cụ thể
        if (quyen[permission] !== true) {
            return res.status(403).json({ 
                error: `Bạn không có quyền thực hiện thao tác này (yêu cầu: ${permission})` 
            });
        }
        
        next();
    };
};

// Middleware tùy chọn - chỉ gắn user info nếu có, không bắt buộc đăng nhập
const optionalAuth = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        
        if (userId) {
            const user = await userModel.findById(userId);
            
            if (user) {
                req.user = {
                    maNguoiDung: user.manguoidung,
                    tenDangNhap: user.tendangnhap,
                    hoTen: user.hoten,
                    vaiTro: user.tenvaitro,
                    quyen: typeof user.quyen === 'string' ? JSON.parse(user.quyen) : user.quyen
                };
            }
        }
        
        next();
    } catch (err) {
        // Không throw error, chỉ bỏ qua
        next();
    }
};

// ========== KIỂM TRA VAI TRÒ ADMIN ==========
const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    
    if (req.user.vaiTro !== 'ADMIN') {
        return res.status(403).json({ error: 'Chỉ Admin mới có quyền thực hiện thao tác này' });
    }
    
    next();
};

// ========== KIỂM TRA VAI TRÒ GVCN (hoặc Admin) ==========
const isGVCN = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    
    if (req.user.vaiTro !== 'GVCN' && req.user.vaiTro !== 'ADMIN') {
        return res.status(403).json({ 
            error: 'Chỉ Giáo viên chủ nhiệm hoặc Admin mới có quyền thực hiện thao tác này' 
        });
    }
    
    next();
};

// ========== KIỂM TRA VAI TRÒ GVBM, GVCN (hoặc Admin) ==========
const isTeacher = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    
    const allowedRoles = ['GVBM', 'GVCN', 'ADMIN'];
    if (!allowedRoles.includes(req.user.vaiTro)) {
        return res.status(403).json({ 
            error: 'Chỉ Giáo viên mới có quyền thực hiện thao tác này' 
        });
    }
    
    next();
};

// ========== KIỂM TRA QUYỀN NHẬP HẠNH KIỂM ==========
const canInputHanhKiem = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    
    // Admin và GVCN có quyền nhập hạnh kiểm
    if (req.user.vaiTro === 'ADMIN' || req.user.vaiTro === 'GVCN') {
        return next();
    }
    
    // GVBM không có quyền nhập hạnh kiểm
    return res.status(403).json({ 
        error: 'Bạn không có quyền nhập hạnh kiểm. Chỉ GVCN và Admin mới được phép.' 
    });
};

// ========== KIỂM TRA QUYỀN XEM TỔNG KẾT LỚP ==========
const canViewClassSummary = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    
    // Admin và GVCN có quyền xem tổng kết lớp
    if (req.user.vaiTro === 'ADMIN' || req.user.vaiTro === 'GVCN') {
        return next();
    }
    
    return res.status(403).json({ 
        error: 'Bạn không có quyền xem tổng kết lớp. Chỉ GVCN và Admin mới được phép.' 
    });
};

module.exports = {
    checkAuth,
    checkPermission,
    optionalAuth,
    isAdmin,
    isGVCN,
    isTeacher,
    canInputHanhKiem,
    canViewClassSummary
};
