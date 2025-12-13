const db = require('./src/config/db');

async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/hanhkiem/hocsinh/HS010000?maNamHoc=2024-2025&maHocKy=HK1', {
      method: 'DELETE',
      headers: { 'X-User-Id': '1' }
    });
    console.log('status', res.status);
    const body = await res.text();
    console.log('body', body);

    const chk = await db.query("SELECT * FROM HANHKIEM WHERE MaHocSinh='HS010000' AND MaNamHoc='2024-2025' AND MaHocKy='HK1'");
    console.log('rows', chk.rows.length);
    if (chk.rows.length) console.log('row', chk.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

main();
