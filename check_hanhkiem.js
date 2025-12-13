// Script kiểm tra dữ liệu hạnh kiểm trong database
const pool = require('./src/config/db');

async function checkHanhKiem() {
    try {
        console.log('🔍 Kiểm tra dữ liệu hạnh kiểm trong database...\n');
        
        // Check tất cả hạnh kiểm
        const result = await pool.query(`
            SELECT 
                hk.MaHocSinh,
                hs.HoTen,
                hk.MaNamHoc,
                hk.MaHocKy,
                hk.XepLoai,
                hk.GhiChu
            FROM HANHKIEM hk
            JOIN HOCSINH hs ON hk.MaHocSinh = hs.MaHocSinh
            ORDER BY hk.MaNamHoc DESC, hk.MaHocKy, hs.HoTen
            LIMIT 20
        `);
        
        console.log(`📊 Tìm thấy ${result.rows.length} bản ghi hạnh kiểm:\n`);
        
        if (result.rows.length === 0) {
            console.log('❌ KHÔNG CÓ DỮ LIỆU HẠNH KIỂM NÀO TRONG DATABASE!');
            console.log('   → Dữ liệu không được lưu vào DB\n');
        } else {
            console.table(result.rows);
        }
        
        // Check cấu trúc bảng
        const structure = await pool.query(`
            SELECT column_name, data_type, character_maximum_length
            FROM information_schema.columns
            WHERE table_name = 'hanhkiem'
            ORDER BY ordinal_position
        `);
        
        console.log('\n📋 Cấu trúc bảng HANHKIEM:');
        console.table(structure.rows);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

checkHanhKiem();
