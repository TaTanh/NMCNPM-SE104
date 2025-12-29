// ========== VALIDATION MIDDLEWARE ==========

const { body, validationResult } = require('express-validator');

// Middleware xử lý kết quả validation
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        return res.status(400).json({ error: firstError.msg });
    }
    next();
};

// ========== VALIDATION CHO AUTH ==========

// Validate login
const validateLogin = [
    body('username')
        .trim()
        .notEmpty().withMessage('Vui lòng nhập tên đăng nhập')
        .isLength({ min: 3, max: 50 }).withMessage('Tên đăng nhập phải từ 3-50 ký tự')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới'),
    body('password')
        .notEmpty().withMessage('Vui lòng nhập mật khẩu')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    handleValidationErrors
];

// Validate register/create user
const validateCreateUser = [
    body('TenDangNhap')
        .trim()
        .notEmpty().withMessage('Vui lòng nhập tên đăng nhập')
        .isLength({ min: 3, max: 50 }).withMessage('Tên đăng nhập phải từ 3-50 ký tự')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('Tên đăng nhập chỉ chứa chữ, số và dấu gạch dưới'),
    body('MatKhau')
        .notEmpty().withMessage('Vui lòng nhập mật khẩu')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự'),
    body('HoTen')
        .trim()
        .notEmpty().withMessage('Vui lòng nhập họ tên')
        .isLength({ min: 2, max: 100 }).withMessage('Họ tên phải từ 2-100 ký tự'),
    body('Email')
        .trim()
        .optional({ checkFalsy: true })
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('MaVaiTro')
        .notEmpty().withMessage('Vui lòng chọn vai trò'),
    handleValidationErrors
];

// Validate change password
const validateChangePassword = [
    body('MatKhauCu')
        .notEmpty().withMessage('Vui lòng nhập mật khẩu cũ'),
    body('MatKhauMoi')
        .notEmpty().withMessage('Vui lòng nhập mật khẩu mới')
        .isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự'),
    handleValidationErrors
];

// ========== VALIDATION CHO STUDENT ==========

// Validate tạo/cập nhật học sinh
const validateStudent = [
    body('MaHocSinh')
        .optional()
        .trim()
        .matches(/^HS\d{6}$/).withMessage('Mã học sinh phải theo định dạng HSXXXXXX (VD: HS010001)'),
    body('HoTen')
        .trim()
        .notEmpty().withMessage('Vui lòng nhập họ tên')
        .isLength({ min: 2, max: 100 }).withMessage('Họ tên phải từ 2-100 ký tự')
        .matches(/^[a-zA-ZÀ-ỹ\s]+$/).withMessage('Họ tên chỉ chứa chữ cái và khoảng trắng'),
    body('GioiTinh')
        .optional({ checkFalsy: true })
        .isIn(['Nam', 'Nữ']).withMessage('Giới tính phải là Nam hoặc Nữ'),
    body('NgaySinh')
        .optional({ checkFalsy: true })
        .isISO8601().withMessage('Ngày sinh không hợp lệ')
        .custom((value) => {
            const birthDate = new Date(value);
            const today = new Date();
            const age = today.getFullYear() - birthDate.getFullYear();
            if (age < 10 || age > 25) {
                throw new Error('Tuổi học sinh không hợp lệ');
            }
            return true;
        }),
    body('Email')
        .optional({ checkFalsy: true })
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('SdtPhuHuynh')
        .optional({ checkFalsy: true })
        .matches(/^(0|\+84)[0-9]{9,10}$/).withMessage('Số điện thoại không hợp lệ (VD: 0912345678)'),
    handleValidationErrors
];

// ========== VALIDATION CHO GRADE ==========

// Validate điểm
const validateGrade = [
    body('Diem')
        .notEmpty().withMessage('Vui lòng nhập điểm')
        .isFloat({ min: 0, max: 10 }).withMessage('Điểm phải từ 0 đến 10')
        .custom((value) => {
            // Kiểm tra tối đa 2 chữ số thập phân
            if (!/^\d+(\.\d{1,2})?$/.test(value)) {
                throw new Error('Điểm chỉ được có tối đa 2 chữ số thập phân');
            }
            return true;
        }),
    handleValidationErrors
];

module.exports = {
    validateLogin,
    validateCreateUser,
    validateChangePassword,
    validateStudent,
    validateGrade,
    handleValidationErrors
};
