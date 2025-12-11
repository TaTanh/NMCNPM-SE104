const pool = require('../src/config/db');

async function getStatistics() {
    try {
        console.log('\n📊 THỐNG KÊ DỮ LIỆU HỆ THỐNG\n');
        
        // 1. Total students
        const students = await pool.query('SELECT COUNT(*) as cnt FROM HOCSINH');
        const totalStudents = parseInt(students.rows[0].cnt);
        
        // 2. Teachers
        const teachers = await pool.query("SELECT COUNT(*) as cnt FROM NGUOIDUNG WHERE MaVaiTro = 'GV'");
        const totalTeachers = parseInt(teachers.rows[0].cnt);
        
        // 3. Classes
        const classes = await pool.query('SELECT COUNT(*) as cnt FROM LOP');
        const totalClasses = parseInt(classes.rows[0].cnt);
        
        // 4. Student grades distribution (Xếp loại)
        const gradeDistribution = await pool.query(`
            SELECT 
                'Giỏi (avg >= 8)' as xepLoai,
                COUNT(*) as soLuong
            FROM (
                SELECT hs.MaHocSinh,
                       AVG(COALESCE(
                           (SELECT SUM(ct.Diem * lhkt.HeSo) / SUM(lhkt.HeSo)
                            FROM CT_BANGDIEMMON_HOCSINH ct
                            JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                            WHERE ct.MaHocSinh = hs.MaHocSinh), 0)) as avgScore
                FROM HOCSINH hs
                GROUP BY hs.MaHocSinh
            ) student_scores
            WHERE avgScore >= 8
            
            UNION ALL
            
            SELECT 
                'Khá (6.5 <= avg < 8)' as xepLoai,
                COUNT(*) as soLuong
            FROM (
                SELECT hs.MaHocSinh,
                       AVG(COALESCE(
                           (SELECT SUM(ct.Diem * lhkt.HeSo) / SUM(lhkt.HeSo)
                            FROM CT_BANGDIEMMON_HOCSINH ct
                            JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                            WHERE ct.MaHocSinh = hs.MaHocSinh), 0)) as avgScore
                FROM HOCSINH hs
                GROUP BY hs.MaHocSinh
            ) student_scores
            WHERE avgScore >= 6.5 AND avgScore < 8
            
            UNION ALL
            
            SELECT 
                'Trung bình (5 <= avg < 6.5)' as xepLoai,
                COUNT(*) as soLuong
            FROM (
                SELECT hs.MaHocSinh,
                       AVG(COALESCE(
                           (SELECT SUM(ct.Diem * lhkt.HeSo) / SUM(lhkt.HeSo)
                            FROM CT_BANGDIEMMON_HOCSINH ct
                            JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                            WHERE ct.MaHocSinh = hs.MaHocSinh), 0)) as avgScore
                FROM HOCSINH hs
                GROUP BY hs.MaHocSinh
            ) student_scores
            WHERE avgScore >= 5 AND avgScore < 6.5
            
            UNION ALL
            
            SELECT 
                'Yếu (avg < 5)' as xepLoai,
                COUNT(*) as soLuong
            FROM (
                SELECT hs.MaHocSinh,
                       AVG(COALESCE(
                           (SELECT SUM(ct.Diem * lhkt.HeSo) / SUM(lhkt.HeSo)
                            FROM CT_BANGDIEMMON_HOCSINH ct
                            JOIN LOAIHINHKIEMTRA lhkt ON ct.MaLHKT = lhkt.MaLHKT
                            WHERE ct.MaHocSinh = hs.MaHocSinh), 0)) as avgScore
                FROM HOCSINH hs
                GROUP BY hs.MaHocSinh
            ) student_scores
            WHERE avgScore < 5
        `);
        
        // 5. Teachers assigned to classes
        const teacherAssignments = await pool.query(`
            SELECT COUNT(DISTINCT MaGiaoVien) as cnt FROM GIANGDAY
        `);
        const teachersAssigned = parseInt(teacherAssignments.rows[0].cnt);
        
        // 6. Class details with teachers
        const classDetails = await pool.query(`
            SELECT 
                l.MaLop,
                l.TenLop,
                kl.TenKhoiLop as Khoi,
                l.SiSo,
                COALESCE(nd.HoTen, 'Chưa phân công') as GVCN,
                (SELECT COUNT(DISTINCT MaGiaoVien) FROM GIANGDAY WHERE MaLop = l.MaLop) as SoGVPhanCong
            FROM LOP l
            JOIN KHOILOP kl ON l.MaKhoiLop = kl.MaKhoiLop
            LEFT JOIN NGUOIDUNG nd ON l.MaGVCN = nd.MaNguoiDung
            ORDER BY l.TenLop
        `);
        
        // 7. Teachers list
        const teachersList = await pool.query(`
            SELECT 
                nd.MaNguoiDung,
                nd.HoTen,
                COUNT(DISTINCT gd.MaLop) as SoLopPhanCong
            FROM NGUOIDUNG nd
            LEFT JOIN GIANGDAY gd ON nd.MaNguoiDung = gd.MaGiaoVien
            WHERE nd.MaVaiTro = 'GV'
            GROUP BY nd.MaNguoiDung, nd.HoTen
            ORDER BY nd.HoTen
        `);
        
        // Display results
        console.log('═══════════════════════════════════════════════════════');
        console.log('📈 TỔNG QUAN CHUNG');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`  Tổng học sinh: ${totalStudents} em`);
        console.log(`  Tổng giáo viên: ${totalTeachers} người`);
        console.log(`  Tổng lớp: ${totalClasses} lớp`);
        console.log(`  Giáo viên có phân công: ${teachersAssigned} người`);
        console.log('');
        
        console.log('═══════════════════════════════════════════════════════');
        console.log('📊 XẾP LOẠI HỌC SINH');
        console.log('═══════════════════════════════════════════════════════');
        gradeDistribution.rows.forEach(row => {
            const percentage = ((row.soluong / totalStudents) * 100).toFixed(1);
            console.log(`  ${row.xeploai.padEnd(35)} ${row.soluong.toString().padStart(4)} em (${percentage}%)`);
        });
        console.log('');
        
        console.log('═══════════════════════════════════════════════════════');
        console.log('📚 DANH SÁCH LỚP & GVCN');
        console.log('═══════════════════════════════════════════════════════');
        classDetails.rows.forEach(row => {
            const info = `${row.tenlop.padEnd(10)} | Khối: ${row.khoi.padEnd(8)} | Sĩ số: ${row.siso.toString().padStart(2)} | GV phân công: ${row.sogvphancong.toString().padStart(2)}`;
            console.log(`  ${info}`);
            console.log(`    GVCN: ${row.gvcn}`);
        });
        console.log('');
        
        console.log('═══════════════════════════════════════════════════════');
        console.log('👨‍🏫 DANH SÁCH GIÁO VIÊN & LỚP PHÂN CÔNG');
        console.log('═══════════════════════════════════════════════════════');
        teachersList.rows.forEach(row => {
            console.log(`  ${row.hoten.padEnd(30)} - ${row.solopphancong} lớp`);
        });
        console.log('');
        
        console.log('═══════════════════════════════════════════════════════\n');
        
        process.exit(0);
    } catch (err) {
        console.error('❌ Lỗi:', err.message);
        process.exit(1);
    }
}

getStatistics();
