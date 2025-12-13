// Test API để xem response trả về như thế nào
const pool = require('./src/config/db');

async function testHanhKiemAPI() {
    try {
        console.log('Testing HANHKIEM API response...\n');
        
        // Lấy 1 bản ghi hạnh kiểm
        const result = await pool.query(`
            SELECT * FROM HANHKIEM 
            LIMIT 1
        `);
        
        console.log('📊 Số bản ghi:', result.rows.length);
        
        if (result.rows.length > 0) {
            console.log('\n📝 Dữ liệu mẫu:');
            console.log(JSON.stringify(result.rows[0], null, 2));
            
            console.log('\n🔑 Tên các cột (keys):');
            console.log(Object.keys(result.rows[0]));
        } else {
            console.log('⚠️  Không có dữ liệu hạnh kiểm trong database');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error);
        process.exit(1);
    }
}

testHanhKiemAPI();
