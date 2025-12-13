const pool = require('./src/config/db');

async function testDatabase() {
    try {
        console.log('🔍 Đang kiểm tra kết nối database...');
        
        // Test connection
        const testConnection = await pool.query('SELECT NOW()');
        console.log('✅ Kết nối database thành công:', testConnection.rows[0].now);
        
        // Kiểm tra bảng VAITRO
        console.log('\n📋 Danh sách vai trò:');
        const vaitro = await pool.query('SELECT * FROM VAITRO');
        console.table(vaitro.rows);
        
        // Kiểm tra bảng NGUOIDUNG
        console.log('\n👤 Danh sách người dùng:');
        const users = await pool.query(`
            SELECT u.MaNguoiDung, u.TenDangNhap, u.MatKhau, u.HoTen, u.Email, 
                   u.MaVaiTro, r.TenVaiTro, u.TrangThai
            FROM NGUOIDUNG u
            LEFT JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
            ORDER BY u.MaNguoiDung
            LIMIT 10
        `);
        console.table(users.rows);
        
        // Test đăng nhập với admin
        console.log('\n🔑 Test đăng nhập với tài khoản admin:');
        const loginTest = await pool.query(
            `SELECT u.*, r.TenVaiTro, r.Quyen
             FROM NGUOIDUNG u
             JOIN VAITRO r ON u.MaVaiTro = r.MaVaiTro
             WHERE u.TenDangNhap = $1 AND u.MatKhau = $2 AND u.TrangThai = true`,
            ['admin', 'admin123']
        );
        
        if (loginTest.rows.length > 0) {
            console.log('✅ Đăng nhập thành công với admin/admin123');
            console.log('Thông tin:', loginTest.rows[0]);
        } else {
            console.log('❌ Không thể đăng nhập với admin/admin123');
            
            // Thử xem có tài khoản admin không
            const adminCheck = await pool.query(
                'SELECT TenDangNhap, MatKhau, TrangThai FROM NGUOIDUNG WHERE TenDangNhap = $1',
                ['admin']
            );
            if (adminCheck.rows.length > 0) {
                console.log('ℹ️  Tài khoản admin tồn tại với thông tin:', adminCheck.rows[0]);
            } else {
                console.log('❌ Không tìm thấy tài khoản admin trong database');
            }
        }
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
        console.error('Chi tiết:', err);
        process.exit(1);
    }
}

testDatabase();
