const pool = require('../config/db');

const HanhKiemModel = {
    // Lấy hạnh kiểm của học sinh theo học kỳ
    getByHocSinh: async (maHocSinh, maNamHoc = null, maHocKy = null) => {
        try {
            let query = `
                SELECT hk.*, hs.HoTen, nh.TenNamHoc, hky.TenHocKy
                FROM HANHKIEM hk
                JOIN HOCSINH hs ON hk.MaHocSinh = hs.MaHocSinh
                JOIN NAMHOC nh ON hk.MaNamHoc = nh.MaNamHoc
                JOIN HOCKY hky ON hk.MaHocKy = hky.MaHocKy
                WHERE hk.MaHocSinh = $1
            `;
            const params = [maHocSinh];

            if (maNamHoc) {
                query += ` AND hk.MaNamHoc = $${params.length + 1}`;
                params.push(maNamHoc);
            }

            if (maHocKy) {
                query += ` AND hk.MaHocKy = $${params.length + 1}`;
                params.push(maHocKy);
            }

            query += ` ORDER BY hk.MaNamHoc DESC, hk.MaHocKy`;

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Lấy hạnh kiểm của cả lớp
    getByLop: async (maLop, maNamHoc, maHocKy) => {
        try {
            const query = `
                SELECT hk.*, hs.HoTen, hs.MaHocSinh
                FROM HANHKIEM hk
                JOIN HOCSINH hs ON hk.MaHocSinh = hs.MaHocSinh
                JOIN QUATRINHHOC qth ON hs.MaHocSinh = qth.MaHocSinh
                WHERE qth.MaLop = $1 
                    AND hk.MaNamHoc = $2 
                    AND hk.MaHocKy = $3
                ORDER BY hs.HoTen
            `;
            const result = await pool.query(query, [maLop, maNamHoc, maHocKy]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Thêm hoặc cập nhật hạnh kiểm
    upsert: async (maHocSinh, maNamHoc, maHocKy, xepLoai, ghiChu = null) => {
        try {
            // Validate xếp loại
            const validXepLoai = ['Tốt', 'Khá', 'Trung bình', 'Yếu'];
            if (!validXepLoai.includes(xepLoai)) {
                throw new Error('Xếp loại không hợp lệ. Chỉ chấp nhận: Tốt, Khá, Trung bình, Yếu');
            }

            const query = `
                INSERT INTO HANHKIEM (MaHocSinh, MaNamHoc, MaHocKy, XepLoai, GhiChu)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (MaHocSinh, MaNamHoc, MaHocKy) 
                DO UPDATE SET 
                    XepLoai = EXCLUDED.XepLoai,
                    GhiChu = EXCLUDED.GhiChu
                RETURNING *
            `;
            const result = await pool.query(query, [maHocSinh, maNamHoc, maHocKy, xepLoai, ghiChu]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Nhập hạnh kiểm cho nhiều học sinh cùng lúc (bulk insert)
    bulkUpsert: async (hanhKiemList) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const results = [];
            for (const hk of hanhKiemList) {
                const { maHocSinh, maNamHoc, maHocKy, xepLoai, ghiChu } = hk;
                
                const query = `
                    INSERT INTO HANHKIEM (MaHocSinh, MaNamHoc, MaHocKy, XepLoai, GhiChu)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (MaHocSinh, MaNamHoc, MaHocKy) 
                    DO UPDATE SET 
                        XepLoai = EXCLUDED.XepLoai,
                        GhiChu = EXCLUDED.GhiChu
                    RETURNING *
                `;
                const result = await client.query(query, [maHocSinh, maNamHoc, maHocKy, xepLoai, ghiChu]);
                results.push(result.rows[0]);
            }

            await client.query('COMMIT');
            return results;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Xóa hạnh kiểm
    delete: async (maHocSinh, maNamHoc, maHocKy) => {
        try {
            const query = `
                DELETE FROM HANHKIEM 
                WHERE MaHocSinh = $1 AND MaNamHoc = $2 AND MaHocKy = $3
                RETURNING *
            `;
            const result = await pool.query(query, [maHocSinh, maNamHoc, maHocKy]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Lấy thống kê hạnh kiểm của lớp
    getThongKeLop: async (maLop, maNamHoc, maHocKy) => {
        try {
            const query = `
                SELECT 
                    hk.XepLoai,
                    COUNT(*) as SoLuong,
                    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as TiLe
                FROM HANHKIEM hk
                JOIN QUATRINHHOC qth ON hk.MaHocSinh = qth.MaHocSinh
                WHERE qth.MaLop = $1 
                    AND hk.MaNamHoc = $2 
                    AND hk.MaHocKy = $3
                GROUP BY hk.XepLoai
                ORDER BY 
                    CASE hk.XepLoai 
                        WHEN 'Tốt' THEN 1
                        WHEN 'Khá' THEN 2
                        WHEN 'Trung bình' THEN 3
                        WHEN 'Yếu' THEN 4
                    END
            `;
            const result = await pool.query(query, [maLop, maNamHoc, maHocKy]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Tính hạnh kiểm cả năm (logic có thể tùy chỉnh)
    getHanhKiemNam: async (maHocSinh, maNamHoc) => {
        try {
            const query = `
                SELECT MaHocKy, XepLoai
                FROM HANHKIEM
                WHERE MaHocSinh = $1 AND MaNamHoc = $2
                ORDER BY MaHocKy
            `;
            const result = await pool.query(query, [maHocSinh, maNamHoc]);
            
            if (result.rows.length < 2) {
                return null; // Chưa đủ cả 2 học kỳ
            }

            const hk1 = result.rows.find(r => r.mahocky === 'HK1');
            const hk2 = result.rows.find(r => r.mahocky === 'HK2');

            // Logic tính hạnh kiểm cả năm (có thể tùy chỉnh)
            // VD: Nếu có 1 học kỳ Yếu => Cả năm Yếu
            // Nếu cả 2 Tốt => Cả năm Tốt
            // Còn lại lấy thấp hơn
            const xepLoaiMap = { 'Tốt': 4, 'Khá': 3, 'Trung bình': 2, 'Yếu': 1 };
            const xepLoaiReverseMap = { 4: 'Tốt', 3: 'Khá', 2: 'Trung bình', 1: 'Yếu' };

            if (!hk1 || !hk2) return null;

            const diem1 = xepLoaiMap[hk1.xeploai] || 0;
            const diem2 = xepLoaiMap[hk2.xeploai] || 0;

            // Lấy xếp loại thấp hơn (ưu tiên HK2)
            const diemNam = Math.min(diem1, diem2);

            return {
                hk1: hk1.xeploai,
                hk2: hk2.xeploai,
                caNam: xepLoaiReverseMap[diemNam]
            };
        } catch (error) {
            throw error;
        }
    }
};

module.exports = HanhKiemModel;
