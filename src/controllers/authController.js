const userModel = require('../models/userModel');

// ========== ĐĂNG NHẬP ==========
const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
        }
        
        const user = await userModel.findByCredentials(username, password);
        
        if (!user) {
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
        
        // Parse quyền từ JSONB
        let quyen = user.quyen;
        if (typeof quyen === 'string') {
            try {
                quyen = JSON.parse(quyen);
            } catch {
                quyen = {};
            }
        }
        
        // Trả về thông tin user (không bao gồm mật khẩu)
        res.json({
            success: true,
            user: {
                maNguoiDung: user.manguoidung,
                tenDangNhap: user.tendangnhap,
                hoTen: user.hoten,
                email: user.email,
                vaiTro: user.mavaitro,
                tenVaiTro: user.tenvaitro,
                quyen: quyen
            }
        });
    } catch (err) {
        console.error('Lỗi đăng nhập:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY DANH SÁCH NGƯỜI DÙNG ==========
const getUsers = async (req, res) => {
    try {
        const users = await userModel.findAll();
        res.json(users);
    } catch (err) {
        console.error('Lỗi lấy danh sách người dùng:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== THÊM NGƯỜI DÙNG ==========
const createUser = async (req, res) => {
    try {
        const { TenDangNhap, MatKhau, HoTen, Email, MaVaiTro } = req.body;
        
        // Kiểm tra tên đăng nhập đã tồn tại chưa
        const exists = await userModel.existsByUsername(TenDangNhap);
        if (exists) {
            return res.status(400).json({ error: 'Tên đăng nhập đã tồn tại' });
        }
        
        const user = await userModel.create({ TenDangNhap, MatKhau, HoTen, Email, MaVaiTro });
        res.status(201).json(user);
    } catch (err) {
        console.error('Lỗi thêm người dùng:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== CẬP NHẬT NGƯỜI DÙNG ==========
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { HoTen, Email, MaVaiTro, TrangThai } = req.body;
        
        const user = await userModel.update(id, { HoTen, Email, MaVaiTro, TrangThai });
        
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        res.json(user);
    } catch (err) {
        console.error('Lỗi cập nhật người dùng:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== ĐỔI MẬT KHẨU ==========
const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { MatKhauCu, MatKhauMoi } = req.body;
        
        // Kiểm tra mật khẩu cũ
        const valid = await userModel.checkPassword(id, MatKhauCu);
        if (!valid) {
            return res.status(400).json({ error: 'Mật khẩu cũ không đúng' });
        }
        
        await userModel.changePassword(id, MatKhauMoi);
        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (err) {
        console.error('Lỗi đổi mật khẩu:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== XÓA NGƯỜI DÙNG ==========
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await userModel.remove(id);
        
        if (!user) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        res.json({ success: true, message: 'Đã xóa người dùng' });
    } catch (err) {
        console.error('Lỗi xóa người dùng:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== LẤY DANH SÁCH VAI TRÒ ==========
const getRoles = async (req, res) => {
    try {
        const roles = await userModel.findAllRoles();
        res.json(roles);
    } catch (err) {
        console.error('Lỗi lấy danh sách vai trò:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

// ========== THÊM VAI TRÒ ==========
const createRole = async (req, res) => {
    try {
        const { MaVaiTro, TenVaiTro, Quyen, MoTa } = req.body;
        
        const role = await userModel.createRole({ MaVaiTro, TenVaiTro, Quyen, MoTa });
        res.status(201).json(role);
    } catch (err) {
        console.error('Lỗi thêm vai trò:', err);
        if (err.code === '23505') {
            res.status(400).json({ error: 'Mã vai trò đã tồn tại' });
        } else {
            res.status(500).json({ error: 'Lỗi server' });
        }
    }
};

// ========== CẬP NHẬT VAI TRÒ ==========
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { TenVaiTro, Quyen, MoTa } = req.body;
        
        const role = await userModel.updateRole(id, { TenVaiTro, Quyen, MoTa });
        
        if (!role) {
            return res.status(404).json({ error: 'Không tìm thấy vai trò' });
        }
        
        res.json(role);
    } catch (err) {
        console.error('Lỗi cập nhật vai trò:', err);
        res.status(500).json({ error: 'Lỗi server' });
    }
};

module.exports = {
    login,
    getUsers,
    createUser,
    updateUser,
    changePassword,
    deleteUser,
    getRoles,
    createRole,
    updateRole
};
