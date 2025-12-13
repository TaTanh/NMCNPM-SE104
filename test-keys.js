const db = require('./src/config/db');

(async () => {
    try {
        const res = await db.query('SELECT * FROM HANHKIEM WHERE MaHocSinh = $1 AND MaNamHoc = $2 AND MaHocKy = $3', 
            ['HS010000', '2024-2025', 'HK1']);
        
        if (res.rows.length > 0) {
            console.log('Keys returned by pg:', Object.keys(res.rows[0]));
            console.log('First row:', res.rows[0]);
        } else {
            console.log('No data found for HS010000, 2024-2025, HK1');
            // Try to find any record
            const allRes = await db.query('SELECT * FROM HANHKIEM LIMIT 1');
            if (allRes.rows.length > 0) {
                console.log('\nFirst record in HANHKIEM:');
                console.log('Keys:', Object.keys(allRes.rows[0]));
                console.log('Data:', allRes.rows[0]);
            }
        }
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
})();
