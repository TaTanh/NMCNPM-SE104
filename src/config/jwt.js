// ========== CẤU HÌNH JWT ==========

// Secret key để sign JWT token (trong production nên để trong .env)
const JWT_SECRET = process.env.JWT_SECRET || 'student-management-secret-key-2024';

// Thời gian expire của token (24 giờ)
const JWT_EXPIRES_IN = '24h';

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN
};
