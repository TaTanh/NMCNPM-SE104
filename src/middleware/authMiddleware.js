// ========== MIDDLEWARE PHÂN QUYỀN ==========

const userModel = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

// Middleware kiểm tra đăng nhập (verify JWT token)
const checkAuth = async (req, res, next) => {
    try {
        // Lấy token từ header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : null;
        
        console.log('=== checkAuth middleware ===');
        console.log('Authorization header:', authHeader);
        console.log('Token:', token ? token.substring(0, 20) + '...' : 'null');
        
        if (!token) {
            console.log('ERROR: No token provided');
            return res.status(401).json({ error: 'Chưa đăng nhập' });
        }
        
        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
            console.log('Token decoded:', decoded);
        } catch (jwtError) {
            console.log('ERROR: JWT verification failed:', jwtError.message);
            return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' });
        }
        
        // Lấy thông tin user từ database
        const user = await userModel.findById(decoded.maNguoiDung);
        
        console.log('User from DB:', user);
        
        if (!user) {
            console.log('ERROR: User not found in DB');
            return res.status(401).json({ error: 'Người dùng không tồn tại' });
        }
        
        // Gắn thông tin user vào request
        req.user = {
            maNguoiDung: user.manguoidung,
            tenDangNhap: user.tendangnhap,
            hoTen: user.hoten,
            vaiTro: user.mavaitro || user.MaVaiTro || user.tenvaitro,
            tenVaiTro: user.tenvaitro || user.TenVaiTro,
            quyen: typeof user.quyen === 'string' ? JSON.parse(user.quyen) : user.quyen
        };
        
        console.log('req.user set to:', req.user);
        
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

// Middleware tùy chọn - chỉ gắn user info nếu có token, không bắt buộc đăng nhập
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : null;
        
        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const user = await userModel.findById(decoded.maNguoiDung);
                
                if (user) {
                    req.user = {
                        maNguoiDung: user.manguoidung,
                        tenDangNhap: user.tendangnhap,
                        hoTen: user.hoten,
                        vaiTro: user.mavaitro || user.MaVaiTro || user.tenvaitro,
                        quyen: typeof user.quyen === 'string' ? JSON.parse(user.quyen) : user.quyen
                    };
                }
            } catch (jwtError) {
                // Token không hợp lệ, bỏ qua
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
    console.log('=== canInputHanhKiem middleware ===');
    console.log('Request headers:', req.headers);
    console.log('req.user:', req.user);
    
    if (!req.user) {
        console.log('ERROR: req.user is null/undefined');
        return res.status(401).json({ error: 'Chưa đăng nhập' });
    }

    const roleRaw = (req.user.vaiTro || '').toString().trim();
    const role = roleRaw.toUpperCase();
    const roleName = roleRaw.toLowerCase();
    const quyen = req.user.quyen || {};

    const hasPermission = quyen.all === true || quyen.nhapHanhKiem === true;
    const isAdmin = role === 'ADMIN' || role === 'ADMINISTRATOR' || role.startsWith('ADMIN') || roleName.includes('quản trị viên');
    const isGvcn = role === 'GVCN' || role.startsWith('GVCN') || roleName.includes('giáo viên chủ nhiệm');

    if (hasPermission || isAdmin || isGvcn) {
        console.log('Access granted! Role:', req.user.vaiTro, 'Permission:', quyen);
        return next();
    }

    console.log('Access denied! Role:', req.user.vaiTro, 'Permission:', quyen);
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
