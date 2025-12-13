// Script xóa tất cả dữ liệu hạnh kiểm để test lại từ đầu
const pool = require('./src/config/db');

async function deleteAllHanhKiem() {
    try {
        console.log('🗑️  Đang xóa tất cả dữ liệu hạnh kiểm...\n');
        
        const result = await pool.query('DELETE FROM HANHKIEM');
        
        console.log(`✅ Đã xóa ${result.rowCount} bản ghi hạnh kiểm!`);
        
        // Verify
        const check = await pool.query('SELECT COUNT(*) as cnt FROM HANHKIEM');
        console.log(`\n📊 Số bản ghi hạnh kiểm còn lại: ${check.rows[0].cnt}`);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

deleteAllHanhKiem();
