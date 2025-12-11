#!/usr/bin/env node
const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'QLHS',
    password: '123456',
    port: 5432
});

(async () => {
  try {
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
      SELECT MaNamHoc, COUNT(*) as SoLop, COALESCE(SUM(SiSo), 0) as TongSiSo 
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
    
    console.log('\n=== THỐNG KÊ TỔNG HỢP HỆ THỐNG QUẢN LÝ HỌC SINH ===\n');
    console.log('📚 Tổng số học sinh:', hsRes.rows[0].total);
    console.log('🏫 Tổng số lớp:', lopRes.rows[0].total);
    console.log('📅 Tổng số năm học:', namRes.rows[0].total);
    
    console.log('\n📋 Chi tiết năm học:');
    if (namDetailRes.rows.length === 0) {
      console.log('  (Chưa có năm học nào)');
    } else {
      namDetailRes.rows.forEach(row => {
        console.log(`  - ${row.manamhoc}: ${row.tennamhoc}`);
      });
    }
    
    console.log('\n📊 Chi tiết lớp theo năm học:');
    if (lopDetailRes.rows.length === 0) {
      console.log('  (Chưa có lớp nào)');
    } else {
      lopDetailRes.rows.forEach(row => {
        console.log(`  - Năm ${row.manamhoc}: ${row.solop} lớp, tổng sĩ số: ${row.tongsiso} HS`);
      });
    }
    
    console.log('\n👥 Phân bố học sinh:');
    console.log(`  - Đã phân lớp: ${phanlopRes.rows[0].daphanlopp} HS`);
    console.log(`  - Chưa phân lớp: ${phanlopRes.rows[0].chuaphanlopp} HS`);
    console.log('\n');
    
    await pool.end();
    process.exit(0);
  } catch (e) {
    console.error('❌ Lỗi:', e.message);
    await pool.end();
    process.exit(1);
  }
})();
