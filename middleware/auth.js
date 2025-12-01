// ========== MIDDLEWARE PHÂN QUYỀN ==========

const pool = require('../db');

// Middleware kiểm tra đăng nhập (dựa vào header x-user-id)
// Lưu ý: Đây là cách đơn giản cho đồ án, production nên dùng JWT
const checkAuth = async (req, res, next) => {
    try {
        const userId = req.headers['x-user-id'];
        
        if (!userId) {
            return res.status(401).json({ error: 'Chưa đăng nhập' });
        }
        
        const result = await pool.query(
            `SELECT u.*, r.TenVaiTro, r.Quyen
             FROM NGUOIDUNG u
             JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
             WHERE u.MaNguoiDung = $1 AND u.TrangThai = true`,
            [userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ' });
        }
        
        // Gắn thông tin user vào request
        const user = result.rows[0];
        req.user = {
            maNguoiDung: user.manguoidung,
            tenDangNhap: user.tendangnhap,
            hoTen: user.hoten,
            vaiTro: user.tenvaitro,
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
            const result = await pool.query(
                `SELECT u.*, r.TenVaiTro, r.Quyen
                 FROM NGUOIDUNG u
                 JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
                 WHERE u.MaNguoiDung = $1 AND u.TrangThai = true`,
                [userId]
            );
            
            if (result.rows.length > 0) {
                const user = result.rows[0];
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

module.exports = {
    checkAuth,
    checkPermission,
    optionalAuth
};
