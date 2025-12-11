const fs = require('fs');
const path = require('path');
const pool = require('../src/config/db');

async function initDatabase() {
    const client = await pool.connect();
    try {
        console.log('🔄 Initializing database...');
        
        // Read init.sql
        const initPath = path.join(__dirname, '../database/init.sql');
        const initSQL = fs.readFileSync(initPath, 'utf-8');
        
        // Execute init.sql
        console.log('📝 Executing init.sql...');
        await client.query(initSQL);
        console.log('✅ init.sql executed successfully');
        
        // Read seed.sql
        const seedPath = path.join(__dirname, '../database/seed.sql');
        const seedSQL = fs.readFileSync(seedPath, 'utf-8');
        
        // Execute seed.sql
        console.log('📝 Executing seed.sql...');
        await client.query(seedSQL);
        console.log('✅ seed.sql executed successfully');
        
        // Verify data
        console.log('\n📊 Verification:');
        const namhoc = await client.query('SELECT COUNT(*) as cnt FROM NAMHOC');
        const hocky = await client.query('SELECT COUNT(*) as cnt FROM HOCKY');
        const khoilop = await client.query('SELECT COUNT(*) as cnt FROM KHOILOP');
        const lop = await client.query('SELECT COUNT(*) as cnt FROM LOP');
        const hocsinh = await client.query('SELECT COUNT(*) as cnt FROM HOCSINH');
        
        console.log(`✅ NAMHOC: ${namhoc.rows[0].cnt} records`);
        console.log(`✅ HOCKY: ${hocky.rows[0].cnt} records`);
        console.log(`✅ KHOILOP: ${khoilop.rows[0].cnt} records`);
        console.log(`✅ LOP: ${lop.rows[0].cnt} records`);
        console.log(`✅ HOCSINH: ${hocsinh.rows[0].cnt} records`);
        
        console.log('\n✨ Database initialized successfully!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Database initialization error:', err.message);
        console.error(err);
        process.exit(1);
    } finally {
        client.release();
    }
}

initDatabase();
