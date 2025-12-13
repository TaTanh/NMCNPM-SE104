// ==========================================
// DATABASE MANAGEMENT TOOLS
// Quản lý khởi tạo và kiểm tra database
// ==========================================

const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

// ========== KHỞI TẠO DATABASE ==========
async function initDatabase() {
  const client = await pool.connect();
  try {
    console.log('🔄 Đang khởi tạo database...\n');

    // Đọc và thực thi init.sql
    const initPath = path.join(__dirname, '../../database/init.sql');
    const initSQL = fs.readFileSync(initPath, 'utf-8');

    console.log('📝 Đang thực thi init.sql...');
    await client.query(initSQL);
    console.log('✅ init.sql thành công\n');

    // Đọc và thực thi seed.sql
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    const seedSQL = fs.readFileSync(seedPath, 'utf-8');

    console.log('📝 Đang thực thi seed.sql...');
    await client.query(seedSQL);
    console.log('✅ seed.sql thành công\n');

    // Xác minh dữ liệu
    console.log('📊 Xác minh dữ liệu:\n');
    const tables = [
      'NAMHOC',
      'HOCKY',
      'KHOILOP',
      'LOP',
      'HOCSINH',
      'MONHOC',
      'NGUOIDUNG',
      'BANGDIEMMON'
    ];

    for (const table of tables) {
      const result = await client.query(`SELECT COUNT(*) as cnt FROM ${table}`);
      console.log(`  ✓ ${table}: ${result.rows[0].cnt} records`);
    }

    console.log('\n✨ Database đã được khởi tạo thành công!\n');
    return true;
  } catch (error) {
    console.error('❌ Lỗi khởi tạo database:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

// ========== ĐẾM RECORDS TRONG CÁC BẢNG ==========
async function getTableCounts() {
  try {
    const tables = [
      { name: 'HOCSINH', label: 'Học sinh' },
      { name: 'LOP', label: 'Lớp' },
      { name: 'NAMHOC', label: 'Năm học' },
      { name: 'MONHOC', label: 'Môn học' },
      { name: 'HOCKY', label: 'Học kỳ' },
      { name: 'KHOILOP', label: 'Khối lớp' },
      { name: 'NGUOIDUNG', label: 'Người dùng' },
      { name: 'VAITRO', label: 'Vai trò' },
      { name: 'QUATRINHHOC', label: 'Quá trình học' },
      { name: 'BANGDIEMMON', label: 'Bảng điểm môn' },
      { name: 'CT_BANGDIEMMON_HOCSINH', label: 'Chi tiết điểm' },
      { name: 'HANHKIEM', label: 'Hạnh kiểm' }
    ];

    console.log('\n=== THỐNG KÊ BẢNG DỮ LIỆU ===\n');

    const counts = {};
    for (const table of tables) {
      try {
        const result = await pool.query(`SELECT COUNT(*) as count FROM ${table.name}`);
        const count = parseInt(result.rows[0].count);
        counts[table.name] = count;
        console.log(`${table.label.padEnd(25)} (${table.name}): ${count} bản ghi`);
      } catch (error) {
        console.log(`${table.label.padEnd(25)} (${table.name}): [LỖI] ${error.message.substring(0, 50)}`);
        counts[table.name] = 0;
      }
    }

    // Chi tiết năm học
    try {
      console.log('\n--- Chi tiết năm học ---');
      const result = await pool.query('SELECT MaNamHoc, TenNamHoc FROM NAMHOC ORDER BY MaNamHoc');
      result.rows.forEach(row => console.log(`  ${row.manamhoc}: ${row.tennamhoc}`));
    } catch (error) {
      console.log('  [Chưa có dữ liệu]');
    }

    // Chi tiết lớp theo năm học
    try {
      console.log('\n--- Lớp theo năm học ---');
      const result = await pool.query(`
        SELECT MaNamHoc, COUNT(*) as SoLop, COALESCE(SUM(SiSo), 0) as TongSiSo 
        FROM LOP 
        GROUP BY MaNamHoc 
        ORDER BY MaNamHoc
      `);
      result.rows.forEach(row => 
        console.log(`  ${row.manamhoc}: ${row.solop} lớp, sĩ số: ${row.tongsiso}`)
      );
    } catch (error) {
      console.log('  [Chưa có dữ liệu]');
    }

    console.log('\n');
    return counts;
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    throw error;
  }
}

// ========== KIỂM TRA KẾT NỐI ==========
async function checkConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Kết nối database thành công!');
    console.log('🕐 Server time:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Không thể kết nối database:', error.message);
    return false;
  }
}

// ========== CLI ==========
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    try {
      if (command === 'init') {
        await initDatabase();
      } else if (command === 'count' || command === 'stats') {
        await getTableCounts();
      } else if (command === 'check') {
        await checkConnection();
      } else {
        console.log(`
📋 DATABASE MANAGEMENT TOOLS

Sử dụng:
  node src/tools/database.js init     - Khởi tạo database (chạy init.sql + seed.sql)
  node src/tools/database.js count    - Đếm số records trong các bảng
  node src/tools/database.js check    - Kiểm tra kết nối database

Ví dụ:
  node src/tools/database.js init
  node src/tools/database.js count
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

module.exports = { initDatabase, getTableCounts, checkConnection };
