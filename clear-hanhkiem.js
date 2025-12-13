// Script xóa TOÀN BỘ dữ liệu hạnh kiểm
const pool = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function clearHanhKiem() {
    try {
        console.log('⚠️  CẢNH BÁO: Script này sẽ XÓA TOÀN BỘ dữ liệu hạnh kiểm!');
        console.log('Đang kết nối database...\n');
        
        // Đọc file SQL
        const sqlFile = path.join(__dirname, 'database', 'clear-hanhkiem.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Thực thi SQL
        await pool.query(sql);
        
        console.log('✓ Đã xóa TOÀN BỘ dữ liệu hạnh kiểm!');
        console.log('✓ Đã xóa cột DiemHanhKiem (do seed.sql tạo ra)');
        
        // Kiểm tra lại
        const result = await pool.query('SELECT COUNT(*) as total FROM HANHKIEM');
        console.log('\n📊 Số bản ghi hạnh kiểm còn lại:', result.rows[0].total);
        
        if (parseInt(result.rows[0].total) === 0) {
            console.log('✅ Database đã sạch! Bạn có thể nhập hạnh kiểm mới.');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

clearHanhKiem();
