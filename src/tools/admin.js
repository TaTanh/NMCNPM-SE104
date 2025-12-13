// ==========================================
// ADMIN MANAGEMENT TOOLS
// Quản lý tài khoản admin
// ==========================================

const pool = require('../config/db');

// ========== KIỂM TRA ADMIN ==========
async function checkAdmin(username = 'admin') {
  try {
    const result = await pool.query(
      "SELECT MaNguoiDung, TenDangNhap, HoTen, Email, MaVaiTro FROM NGUOIDUNG WHERE TenDangNhap = $1",
      [username]
    );
    
    if (result.rows.length === 0) {
      console.log(`❌ Không tìm thấy tài khoản: ${username}`);
      return null;
    }
    
    console.log('✅ Tìm thấy tài khoản admin:');
    console.table(result.rows);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra admin:', error.message);
    throw error;
  }
}

// ========== TẠO ADMIN ==========
async function createAdmin(config = {}) {
  const {
    username = 'admin',
    password = 'admin123',
    fullName = 'Administrator',
    email = 'admin@local'
  } = config;

  try {
    // Tạo vai trò ADMIN nếu chưa có
    await pool.query(`
      INSERT INTO VAITRO (MaVaiTro, TenVaiTro, Quyen, MoTa)
      VALUES ('ADMIN', 'Quản trị hệ thống', '{}'::jsonb, 'Quyền cao nhất')
      ON CONFLICT (MaVaiTro) DO NOTHING;
    `);

    // Kiểm tra user admin đã tồn tại chưa
    const existing = await pool.query('SELECT * FROM NGUOIDUNG WHERE TenDangNhap = $1', [username]);
    if (existing.rows.length > 0) {
      console.log('⚠️  Tài khoản admin đã tồn tại:', username);
      console.table(existing.rows[0]);
      return existing.rows[0];
    }

    // Tạo tài khoản admin mới
    const result = await pool.query(
      `INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro, TrangThai)
       VALUES ($1, $2, $3, $4, $5, true) 
       RETURNING MaNguoiDung, TenDangNhap, HoTen, Email, MaVaiTro`,
      [username, password, fullName, email, 'ADMIN']
    );

    console.log('✅ Tạo tài khoản admin thành công:');
    console.table(result.rows[0]);
    console.log(`\n🔐 Username: ${username}`);
    console.log(`🔑 Password: ${password}`);
    return result.rows[0];
  } catch (error) {
    console.error('❌ Lỗi khi tạo admin:', error.message);
    throw error;
  }
}

// ========== CLI ==========
if (require.main === module) {
  const command = process.argv[2];
  
  (async () => {
    try {
      if (command === 'check') {
        await checkAdmin(process.argv[3]);
      } else if (command === 'create') {
        await createAdmin({
          username: process.argv[3],
          password: process.argv[4],
          fullName: process.argv[5],
          email: process.argv[6]
        });
      } else {
        console.log(`
📋 ADMIN MANAGEMENT TOOLS

Sử dụng:
  node src/tools/admin.js check [username]              - Kiểm tra tài khoản admin
  node src/tools/admin.js create [user] [pass] [name]   - Tạo tài khoản admin mới

Ví dụ:
  node src/tools/admin.js check
  node src/tools/admin.js create admin admin123 "Administrator"
        `);
      }
      await pool.end();
      process.exit(0);
    } catch (error) {
      console.error(error);
      await pool.end();
      process.exit(1);
    }
  })();
}

module.exports = { checkAdmin, createAdmin };
