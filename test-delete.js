// Debug DELETE endpoint
const pool = require('./src/config/db');

async function testDelete() {
    try {
        console.log('🔍 Test DELETE hạnh kiểm...\n');
        
        // Check dữ liệu trước xoá
        console.log('1️⃣ Kiểm tra dữ liệu trước DELETE:');
        const before = await pool.query(
            'SELECT * FROM HANHKIEM WHERE MaHocSinh = $1 AND MaNamHoc = $2 AND MaHocKy = $3',
            ['HS010000', '2024-2025', 'HK1']
        );
        console.log(`   Tìm thấy ${before.rows.length} record(s)`);
        if (before.rows.length > 0) {
            console.log('   Data:', before.rows[0]);
        }
        
        // Xoá dữ liệu
        console.log('\n2️⃣ Xóa dữ liệu từ database:');
        const deleteRes = await pool.query(
            'DELETE FROM HANHKIEM WHERE MaHocSinh = $1 AND MaNamHoc = $2 AND MaHocKy = $3 RETURNING *',
            ['HS010000', '2024-2025', 'HK1']
        );
        console.log(`   Đã xóa ${deleteRes.rowCount} record(s)`);
        
        // Check dữ liệu sau xoá
        console.log('\n3️⃣ Kiểm tra dữ liệu sau DELETE:');
        const after = await pool.query(
            'SELECT * FROM HANHKIEM WHERE MaHocSinh = $1 AND MaNamHoc = $2 AND MaHocKy = $3',
            ['HS010000', '2024-2025', 'HK1']
        );
        console.log(`   Còn ${after.rows.length} record(s) (nên là 0)`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

testDelete();
