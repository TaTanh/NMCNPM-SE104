const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'QLHS', password: '123456', port: 5432 });

(async () => {
  try {
    const hs = await pool.query('SELECT COUNT(*) as c FROM HOCSINH');
    const lop = await pool.query('SELECT COUNT(*) as c FROM LOP');
    const nam = await pool.query('SELECT MaNamHoc, TenNamHoc FROM NAMHOC ORDER BY MaNamHoc');
    const lopNam = await pool.query('SELECT MaNamHoc, COUNT(*) as c, SUM(SiSo) as ss FROM LOP GROUP BY MaNamHoc');
    
    console.log(JSON.stringify({
      totalHS: hs.rows[0].c,
      totalLop: lop.rows[0].c,
      namHoc: nam.rows,
      lopByNam: lopNam.rows
    }, null, 2));
    
    process.exit(0);
  } catch(e) { console.error(e.message); process.exit(1); }
})();
