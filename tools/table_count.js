const pool = require('../src/config/db');

(async () => {
  try {
    const tables = [
      { name: 'HOCSINH', label: 'Học sinh' },
      { name: 'LOP', label: 'Lớp' },
      { name: 'NAMHOC', label: 'Năm học' },
      { name: 'MONHOC', label: 'Môn học' },
      { name: 'HOCKY', label: 'Học kỳ' },
      { name: 'KHOILOP', label: 'Khối lớp' }
    ];
    
    console.log('\n=== THỐNG KÊ BẢNG DỮ LIỆU ===\n');
    
    for (const table of tables) {
      try {
        const res = await pool.query(`SELECT COUNT(*) as count FROM ${table.name}`);
        console.log(`${table.label} (${table.name}): ${res.rows[0].count} bản ghi`);
      } catch (e) {
        console.log(`${table.label} (${table.name}): [LỖI] ${e.message.substring(0, 50)}`);
      }
    }
    
    // Chi tiết năm học
    try {
      console.log('\n--- Chi tiết năm học ---');
      const namRes = await pool.query('SELECT MaNamHoc, TenNamHoc FROM NAMHOC ORDER BY MaNamHoc');
      namRes.rows.forEach(row => console.log(`  ${row.manamhoc}: ${row.tennamhoc}`));
    } catch (e) {}
    
    // Chi tiết lớp theo năm
    try {
      console.log('\n--- Lớp theo năm học ---');
      const lopRes = await pool.query(
        'SELECT MaNamHoc, COUNT(*) as c, COALESCE(SUM(SiSo), 0) as ss FROM LOP GROUP BY MaNamHoc ORDER BY MaNamHoc'
      );
      lopRes.rows.forEach(row => console.log(`  ${row.manamhoc}: ${row.c} lớp, sĩ số: ${row.ss}`));
    } catch (e) {}
    
    console.log('\n');
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('Lỗi:', e);
    process.exit(1);
  }
})();
