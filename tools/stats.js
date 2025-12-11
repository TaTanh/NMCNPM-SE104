const pool = require('../src/config/db');

(async ()=>{
  try{
    // Tổng số học sinh
    const hsRes = await pool.query('SELECT COUNT(*) as total FROM HOCSINH');
    
    // Tổng số lớp
    const lopRes = await pool.query('SELECT COUNT(*) as total FROM LOP');
    
    // Tổng số năm học
    const namRes = await pool.query('SELECT COUNT(*) as total FROM NAMHOC');
    
    // Chi tiết năm học
    const namDetailRes = await pool.query('SELECT MaNamHoc, TenNamHoc FROM NAMHOC ORDER BY MaNamHoc');
    
    // Chi tiết lớp theo năm học
    const lopDetailRes = await pool.query(`
      SELECT MaNamHoc, COUNT(*) as SoLop, SUM(SiSo) as TongSiSo 
      FROM LOP 
      GROUP BY MaNamHoc 
      ORDER BY MaNamHoc
    `);
    
    // Tổng học sinh đã phân lớp vs chưa phân lớp
    const phanlopRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM HOCSINH WHERE MaHocSinh IN (SELECT DISTINCT MaHocSinh FROM QUATRINHHOC)) as DaPhanLop,
        (SELECT COUNT(*) FROM HOCSINH WHERE MaHocSinh NOT IN (SELECT DISTINCT MaHocSinh FROM QUATRINHHOC)) as ChuaPhanLop
    `);
    
    console.log('=== THỐNG KÊ TỔNG HỢP ===\n');
    console.log('📚 Tổng số học sinh:', hsRes.rows[0].total);
    console.log('🏫 Tổng số lớp:', lopRes.rows[0].total);
    console.log('📅 Tổng số năm học:', namRes.rows[0].total);
    
    console.log('\n📋 Chi tiết năm học:');
    namDetailRes.rows.forEach(row => {
      console.log(`  - ${row.manamhoc}: ${row.tennamhoc}`);
    });
    
    console.log('\n📊 Chi tiết lớp theo năm học:');
    lopDetailRes.rows.forEach(row => {
      console.log(`  - Năm ${row.manamhoc}: ${row.solop} lớp, tổng sĩ số: ${row.tongsiso || 0} HS`);
    });
    
    console.log('\n👥 Phân bố học sinh:');
    console.log(`  - Đã phân lớp: ${phanlopRes.rows[0].daphanlopp} HS`);
    console.log(`  - Chưa phân lớp: ${phanlopRes.rows[0].chuaphanlopp} HS`);
    
    process.exit(0);
  }catch(e){
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  } 
})();
