const pool = require('../src/config/db');

(async ()=>{
  try{
    const r = await pool.query("SELECT MaNguoiDung, TenDangNhap, HoTen, Email, MaVaiTro FROM NGUOIDUNG WHERE TenDangNhap = 'admin'");
    console.log('rows:', r.rows);
    process.exit(0);
  }catch(e){console.error(e); process.exit(1);} 
})();
