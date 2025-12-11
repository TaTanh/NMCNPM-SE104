const pool = require('../src/config/db');

async function run() {
  try {
    // Tạo vai trò ADMIN nếu chưa có
    await pool.query(`INSERT INTO VAITRO (MaVaiTro, TenVaiTro, Quyen, MoTa)
      VALUES ('ADMIN', 'Quản trị hệ thống', '{}'::jsonb, 'Quyền cao nhất')
      ON CONFLICT (MaVaiTro) DO NOTHING;
    `);

    // Kiểm tra user admin tồn tại chưa
    const username = 'admin';
    const password = 'admin123';
    const fullName = 'Administrator';
    const email = 'admin@local';

    const res = await pool.query('SELECT * FROM NGUOIDUNG WHERE TenDangNhap = $1', [username]);
    if (res.rows.length > 0) {
      console.log('Tài khoản admin đã tồn tại:', username);
      process.exit(0);
    }

    const insert = await pool.query(
      `INSERT INTO NGUOIDUNG (TenDangNhap, MatKhau, HoTen, Email, MaVaiTro, TrangThai)
       VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
      [username, password, fullName, email, 'ADMIN']
    );

    console.log('Tạo tài khoản admin thành công:', insert.rows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi tạo admin:', err);
    process.exit(1);
  }
}

run();
