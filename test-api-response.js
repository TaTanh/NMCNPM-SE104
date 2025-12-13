const db = require('./src/config/db');

(async () => {
    try {
        // Test 1: Get an existing hanhkiem record using the model query
        console.log('=== TEST 1: Checking what the API would return ===');
        const res = await db.query('SELECT * FROM HANHKIEM WHERE MaHocSinh = $1 AND MaNamHoc = $2 AND MaHocKy = $3', 
            ['HS010000', '2024-2025', 'HK1']);
        
        if (res.rows.length > 0) {
            console.log('Found record:');
            console.log(JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log('No record found for HS010000, 2024-2025, HK1');
            console.log('Let me check what records exist:');
            const allRes = await db.query('SELECT MaHocSinh, MaNamHoc, MaHocKy, XepLoai FROM HANHKIEM LIMIT 5');
            console.log(JSON.stringify(allRes.rows, null, 2));
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
