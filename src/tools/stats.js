// ==========================================
// STATISTICS TOOLS
// Thống kê tổng hợp dữ liệu hệ thống
// ==========================================

const pool = require('../config/db');

// ========== THỐNG KÊ TỔNG HỢP ==========
async function getGeneralStats() {
  try {
    console.log('=== THỐNG KÊ TỔNG HỢP ===\n');

    // Tổng số học sinh
    const hsResult = await pool.query('SELECT COUNT(*) as total FROM HOCSINH');
    const totalStudents = parseInt(hsResult.rows[0].total);
    console.log('📚 Tổng số học sinh:', totalStudents);

    // Tổng số lớp
    const lopResult = await pool.query('SELECT COUNT(*) as total FROM LOP');
    const totalClasses = parseInt(lopResult.rows[0].total);
    console.log('🏫 Tổng số lớp:', totalClasses);

    // Tổng số năm học
    const namResult = await pool.query('SELECT COUNT(*) as total FROM NAMHOC');
    const totalYears = parseInt(namResult.rows[0].total);
    console.log('📅 Tổng số năm học:', totalYears);

    // Tổng số môn học
    const monResult = await pool.query('SELECT COUNT(*) as total FROM MONHOC');
    const totalSubjects = parseInt(monResult.rows[0].total);
    console.log('📖 Tổng số môn học:', totalSubjects);

    // Tổng số người dùng
    const userResult = await pool.query('SELECT COUNT(*) as total FROM NGUOIDUNG');
    const totalUsers = parseInt(userResult.rows[0].total);
    console.log('👤 Tổng số người dùng:', totalUsers);

    console.log('\n📋 Chi tiết năm học:');
    const namDetailResult = await pool.query('SELECT MaNamHoc, TenNamHoc FROM NAMHOC ORDER BY MaNamHoc');
    namDetailResult.rows.forEach(row => {
      console.log(`  - ${row.manamhoc}: ${row.tennamhoc}`);
    });

    console.log('\n📊 Chi tiết lớp theo năm học:');
    const lopDetailResult = await pool.query(`
      SELECT MaNamHoc, COUNT(*) as SoLop, COALESCE(SUM(SiSo), 0) as TongSiSo 
      FROM LOP 
      GROUP BY MaNamHoc 
      ORDER BY MaNamHoc
    `);
    lopDetailResult.rows.forEach(row => {
      console.log(`  - Năm ${row.manamhoc}: ${row.solop} lớp, tổng sĩ số: ${row.tongsiso} HS`);
    });

    console.log('\n👥 Phân bố học sinh:');
    const phanlopResult = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM HOCSINH WHERE MaHocSinh IN (SELECT DISTINCT MaHocSinh FROM QUATRINHHOC)) as DaPhanLop,
        (SELECT COUNT(*) FROM HOCSINH WHERE MaHocSinh NOT IN (SELECT DISTINCT MaHocSinh FROM QUATRINHHOC)) as ChuaPhanLop
    `);
    const assigned = parseInt(phanlopResult.rows[0].daphanlopp || 0);
    const unassigned = parseInt(phanlopResult.rows[0].chuaphanlopp || 0);
    console.log(`  - Đã phân lớp: ${assigned} HS (${((assigned / totalStudents) * 100).toFixed(1)}%)`);
    console.log(`  - Chưa phân lớp: ${unassigned} HS (${((unassigned / totalStudents) * 100).toFixed(1)}%)`);

    console.log('\n');

    return {
      students: { total: totalStudents, assigned, unassigned },
      classes: totalClasses,
      years: totalYears,
      subjects: totalSubjects,
      users: totalUsers
    };
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    throw error;
  }
}

// ========== THỐNG KÊ ĐIỂM ==========
async function getGradeStats() {
  try {
    console.log('=== THỐNG KÊ ĐIỂM ===\n');

    // Tổng số bảng điểm
    const bangdiemResult = await pool.query('SELECT COUNT(*) as total FROM BANGDIEMMON');
    console.log('📊 Tổng số bảng điểm môn:', bangdiemResult.rows[0].total);

    // Tổng số điểm đã nhập
    const diemResult = await pool.query('SELECT COUNT(*) as total FROM CT_BANGDIEMMON_HOCSINH');
    console.log('✏️  Tổng số điểm đã nhập:', diemResult.rows[0].total);

    // Thống kê theo loại hình kiểm tra
    console.log('\n📝 Thống kê theo loại hình kiểm tra:');
    const lhktResult = await pool.query(`
      SELECT lhkt.TenLHKT, lhkt.HeSo, COUNT(*) as SoDiem
      FROM CT_BANGDIEMMON_HOCSINH ct
      JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
      GROUP BY lhkt.MaLHKT, lhkt.TenLHKT, lhkt.HeSo
      ORDER BY lhkt.TenLHKT
    `);
    lhktResult.rows.forEach(row => {
      console.log(`  - ${row.tenlhkt} (hệ số ${row.heso}): ${row.sodiem} điểm`);
    });

    // Phân bố điểm
    console.log('\n📈 Phân bố điểm (0-10):');
    const phanboResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN Diem >= 8.5 THEN 1 END) as Gioi,
        COUNT(CASE WHEN Diem >= 7.0 AND Diem < 8.5 THEN 1 END) as Kha,
        COUNT(CASE WHEN Diem >= 5.0 AND Diem < 7.0 THEN 1 END) as TrungBinh,
        COUNT(CASE WHEN Diem < 5.0 THEN 1 END) as Yeu,
        COUNT(*) as Total
      FROM CT_BANGDIEMMON_HOCSINH
      WHERE Diem IS NOT NULL
    `);
    const pb = phanboResult.rows[0];
    const total = parseInt(pb.total);
    if (total > 0) {
      console.log(`  - Giỏi (≥8.5): ${pb.gioi} (${((pb.gioi / total) * 100).toFixed(1)}%)`);
      console.log(`  - Khá (7.0-8.5): ${pb.kha} (${((pb.kha / total) * 100).toFixed(1)}%)`);
      console.log(`  - Trung bình (5.0-7.0): ${pb.trungbinh} (${((pb.trungbinh / total) * 100).toFixed(1)}%)`);
      console.log(`  - Yếu (<5.0): ${pb.yeu} (${((pb.yeu / total) * 100).toFixed(1)}%)`);
    }

    console.log('\n');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    throw error;
  }
}

// ========== THỐNG KÊ HẠNH KIỂM ==========
async function getBehaviorStats() {
  try {
    console.log('=== THỐNG KÊ HẠNH KIỂM ===\n');

    // Tổng số bản ghi hạnh kiểm
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM HANHKIEM WHERE DiemHanhKiem IS NOT NULL');
    const total = parseInt(totalResult.rows[0].total);
    console.log('📋 Tổng số bản ghi hạnh kiểm:', total);

    if (total > 0) {
      // Phân bố hạnh kiểm
      console.log('\n📊 Phân bố xếp loại:');
      const phanboResult = await pool.query(`
        SELECT 
          XepLoai,
          COUNT(*) as SoLuong,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM HANHKIEM WHERE DiemHanhKiem IS NOT NULL), 2) as TiLe
        FROM HANHKIEM 
        WHERE DiemHanhKiem IS NOT NULL
        GROUP BY XepLoai
        ORDER BY 
          CASE XepLoai
            WHEN 'Tốt' THEN 1
            WHEN 'Khá' THEN 2
            WHEN 'Trung bình' THEN 3
            WHEN 'Yếu' THEN 4
          END
      `);
      phanboResult.rows.forEach(row => {
        console.log(`  - ${row.xeploai}: ${row.soluong} (${row.tile}%)`);
      });

      // Điểm trung bình
      const avgResult = await pool.query('SELECT AVG(DiemHanhKiem) as avg FROM HANHKIEM WHERE DiemHanhKiem IS NOT NULL');
      console.log(`\n📈 Điểm hạnh kiểm trung bình: ${parseFloat(avgResult.rows[0].avg).toFixed(2)}/100`);
    }

    console.log('\n');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    throw error;
  }
}

// ========== THỐNG KÊ THEO LỚP ==========
async function getClassStats(classId) {
  try {
    console.log(`=== THỐNG KÊ LỚP ${classId} ===\n`);

    // Thông tin lớp
    const classResult = await pool.query(`
      SELECT l.*, k.TenKhoiLop, n.TenNamHoc
      FROM LOP l
      JOIN KHOILOP k ON l.MaKhoiLop = k.MaKhoiLop
      JOIN NAMHOC n ON l.MaNamHoc = n.MaNamHoc
      WHERE l.MaLop = $1
    `, [classId]);

    if (classResult.rows.length === 0) {
      console.log('❌ Không tìm thấy lớp');
      return;
    }

    const classInfo = classResult.rows[0];
    console.log('📋 Thông tin lớp:');
    console.log(`  - Tên lớp: ${classInfo.tenlop}`);
    console.log(`  - Khối: ${classInfo.tenkhoilop}`);
    console.log(`  - Năm học: ${classInfo.tennamhoc}`);
    console.log(`  - Sĩ số: ${classInfo.siso}`);

    // Số học sinh thực tế
    const actualResult = await pool.query(`
      SELECT COUNT(*) as count FROM QUATRINHHOC WHERE MaLop = $1
    `, [classId]);
    console.log(`  - Số HS thực tế: ${actualResult.rows[0].count}`);

    console.log('\n');
  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    throw error;
  }
}

// ========== CLI ==========
if (require.main === module) {
  const command = process.argv[2];

  (async () => {
    try {
      if (command === 'general' || !command) {
        await getGeneralStats();
      } else if (command === 'grade') {
        await getGradeStats();
      } else if (command === 'behavior') {
        await getBehaviorStats();
      } else if (command === 'class') {
        const classId = process.argv[3];
        if (!classId) {
          console.log('❌ Vui lòng cung cấp mã lớp. Ví dụ: node src/tools/stats.js class 10A1');
        } else {
          await getClassStats(classId);
        }
      } else if (command === 'all') {
        await getGeneralStats();
        await getGradeStats();
        await getBehaviorStats();
      } else {
        console.log(`
📋 STATISTICS TOOLS

Sử dụng:
  node src/tools/stats.js [command]

Commands:
  general          - Thống kê tổng hợp (mặc định)
  grade           - Thống kê điểm
  behavior        - Thống kê hạnh kiểm
  class <id>      - Thống kê theo lớp
  all             - Thống kê tất cả

Ví dụ:
  node src/tools/stats.js
  node src/tools/stats.js grade
  node src/tools/stats.js class 10A1
  node src/tools/stats.js all
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

module.exports = { getGeneralStats, getGradeStats, getBehaviorStats, getClassStats };
