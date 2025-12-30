const userModel = require('../models/userModel');
const classModel = require('../models/classModel');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/jwt');

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
        
        // Tạo JWT token
        const token = jwt.sign(
            {
                maNguoiDung: user.manguoidung,
                tenDangNhap: user.tendangnhap,
                vaiTro: user.mavaitro
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Trả về thông tin user và token
        res.json({
            success: true,
            token,
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
        const { role } = req.query;

        if (role === 'teacher') {
            // Return both GVBM and GVCN
            const gvbm = await userModel.findAllGVBM();
            const gvcn = await userModel.findAllGVCN();
            // Merge and sort by name
            const users = [...gvcn, ...gvbm].sort((a, b) => (a.hoten || a.hoTen || '').localeCompare(b.hoten || b.hoTen || ''));
            return res.json(users);
        }

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
        
        // BẢO VỆ 1: Không được sửa super admin (ID = 1 hoặc username = 'admin')
        const targetUser = await userModel.findByIdIgnoreStatus(id);
        if (!targetUser) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        if (targetUser.manguoidung === 1 || targetUser.tendangnhap === 'admin') {
            return res.status(403).json({ error: 'Không thể thay đổi thông tin super admin!' });
        }
        
        // BẢO VỆ 2: Admin không được tự demote chính mình
        if (req.user && req.user.maNguoiDung) {
            const currentUserId = req.user.maNguoiDung;
            if (parseInt(id) === currentUserId && targetUser.mavaitro === 'ADMIN' && MaVaiTro !== 'ADMIN') {
                return res.status(403).json({ error: 'Bạn không thể hạ quyền chính mình!' });
            }
        }
        
        // BẢO VỆ 3: Nếu demote admin, phải còn ít nhất 1 admin khác
        if (targetUser.mavaitro === 'ADMIN' && MaVaiTro !== 'ADMIN') {
            const adminCount = await userModel.countAdmins();
            if (adminCount <= 1) {
                return res.status(403).json({ error: 'Phải có ít nhất 1 admin trong hệ thống!' });
            }
        }
        
        // 🔒 BẢO VỆ 4: Không cho demote GVCN về GVBM nếu đang chủ nhiệm lớp
        if (targetUser.mavaitro === 'GVCN' && MaVaiTro === 'GVBM') {
            const classInfo = await classModel.countClassesByGvcn(id);
            if (classInfo.total > 0) {
                const danhSachLop = classInfo.classes.join(', ');
                return res.status(403).json({ 
                    error: `Giáo viên này đang chủ nhiệm ${classInfo.total} lớp: ${danhSachLop}. Vui lòng gỡ chủ nhiệm trước khi thay đổi vai trò về Giáo viên Bộ môn.`,
                    classes: classInfo.classes,
                    total: classInfo.total
                });
            }
        }
        
        const user = await userModel.update(id, { HoTen, Email, MaVaiTro, TrangThai });
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
        
        // BẢO VỆ 1: Không được xóa super admin
        const targetUser = await userModel.findByIdIgnoreStatus(id);
        if (!targetUser) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }
        
        if (targetUser.manguoidung === 1 || targetUser.tendangnhap === 'admin') {
            return res.status(403).json({ error: 'Không thể xóa super admin!' });
        }
        
        // BẢO VỆ 2: Không cho admin tự xóa chính mình
        const currentUserId = req.user.maNguoiDung;
        if (parseInt(id) === currentUserId) {
            return res.status(403).json({ error: 'Bạn không thể xóa chính mình!' });
        }
        
        // BẢO VỆ 3: Nếu xóa admin, phải còn ít nhất 1 admin khác
        if (targetUser.mavaitro === 'ADMIN') {
            const adminCount = await userModel.countAdmins();
            if (adminCount <= 1) {
                return res.status(403).json({ error: 'Phải có ít nhất 1 admin trong hệ thống!' });
            }
        }
                // BẢO VỆ 4: Kiểm tra giáo viên còn chủ nhiệm lớp không
        if (targetUser.mavaitro === 'GVCN') {
            const classInfo = await classModel.countClassesByGvcn(id);
            if (classInfo.total > 0) {
                const danhSachLop = classInfo.classes.join(', ');
                return res.status(403).json({ 
                    error: `Không thể xóa! Giáo viên đang chủ nhiệm ${classInfo.total} lớp: ${danhSachLop}. Vui lòng gỡ chủ nhiệm trước khi xóa.`,
                    classes: classInfo.classes,
                    total: classInfo.total
                });
            }
        }
        
        // BẢO VỆ 5: Kiểm tra giáo viên còn phân công giảng dạy không
        if (targetUser.mavaitro === 'GVBM' || targetUser.mavaitro === 'GVCN') {
            const teachingResult = await pool.query(
                `SELECT DISTINCT l.TenLop, mh.TenMonHoc, hk.TenHocKy, nh.TenNamHoc
                 FROM GIANGDAY gd
                 JOIN LOP l ON gd.MaLop = l.MaLop
                 JOIN MONHOC mh ON gd.MaMonHoc = mh.MaMonHoc
                 JOIN HOCKY hk ON gd.MaHocKy = hk.MaHocKy
                 JOIN NAMHOC nh ON gd.MaNamHoc = nh.MaNamHoc
                 WHERE gd.MaGiaoVien = $1
                 ORDER BY nh.TenNamHoc DESC, l.TenLop, mh.TenMonHoc`,
                [id]
            );
            
            if (teachingResult.rows.length > 0) {
                const danhSach = teachingResult.rows.map(r => 
                    `${r.tenmonhoc} - ${r.tenlop} (${r.tenhocky}, ${r.tennamhoc})`
                ).join('; ');
                return res.status(403).json({ 
                    error: `Giáo viên đang được phân công giảng dạy ${teachingResult.rows.length} môn. Vui lòng gỡ phân công trước khi xóa.`,
                    assignments: teachingResult.rows,
                    total: teachingResult.rows.length
                });
            }
        }
                const user = await userModel.remove(id);
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
