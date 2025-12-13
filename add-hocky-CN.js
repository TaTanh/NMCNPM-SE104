// Script để thêm học kỳ "Cả năm" vào database
const pool = require('./src/config/db');
const fs = require('fs');
const path = require('path');

async function addHocKyCN() {
    try {
        console.log('Đang kết nối database...');
        
        // Đọc file SQL
        const sqlFile = path.join(__dirname, 'database', 'add-hocky-CN.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');
        
        // Thực thi SQL
        await pool.query(sql);
        
        console.log('✓ Đã thêm học kỳ "Cả năm" (CN) vào database!');
        
        // Kiểm tra lại
        const result = await pool.query('SELECT * FROM HOCKY ORDER BY MaHocKy');
        console.log('\nDanh sách học kỳ hiện tại:');
        console.table(result.rows);
        
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error);
        process.exit(1);
    }
}

addHocKyCN();
