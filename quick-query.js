const db = require('./src/config/db');
(async()=>{
  const res = await db.query("DELETE FROM HANHKIEM WHERE MaHocSinh='HS010000' AND MaNamHoc='2024-2025' AND MaHocKy='HK1' RETURNING *");
  console.log('rowCount', res.rowCount);
  console.log(res.rows);
  const chk = await db.query("SELECT * FROM HANHKIEM WHERE MaHocSinh='HS010000' AND MaNamHoc='2024-2025' AND MaHocKy='HK1'");
  console.log('after', chk.rows.length);
  process.exit(0);
})();
