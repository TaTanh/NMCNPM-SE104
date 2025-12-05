const pool = require('../config/db');

const GiangDayModel = {
    // Lấy danh sách lớp-môn mà giáo viên được phân công
    getByGiaoVien: async (maGiaoVien, maNamHoc = null, maHocKy = null) => {
        try {
            let query = `
                SELECT 
                    gd.*,
                    l.TenLop,
                    mh.TenMonHoc,
                    nd.HoTen as TenGiaoVien,
                    nh.TenNamHoc,
                    hk.TenHocKy
                FROM GIANGDAY gd
                JOIN LOP l ON gd.MaLop = l.MaLop
                JOIN MONHOC mh ON gd.MaMonHoc = mh.MaMonHoc
                JOIN NGUOIDUNG nd ON gd.MaGiaoVien = nd.MaNguoiDung
                JOIN NAMHOC nh ON gd.MaNamHoc = nh.MaNamHoc
                JOIN HOCKY hk ON gd.MaHocKy = hk.MaHocKy
                WHERE gd.MaGiaoVien = $1
            `;
            const params = [maGiaoVien];

            if (maNamHoc) {
                query += ` AND gd.MaNamHoc = $${params.length + 1}`;
                params.push(maNamHoc);
            }

            if (maHocKy) {
                query += ` AND gd.MaHocKy = $${params.length + 1}`;
                params.push(maHocKy);
            }

            query += ` ORDER BY l.TenLop, mh.TenMonHoc`;

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Lấy danh sách giáo viên dạy một lớp
    getByLop: async (maLop, maNamHoc = null, maHocKy = null) => {
        try {
            let query = `
                SELECT 
                    gd.*,
                    nd.HoTen as TenGiaoVien,
                    nd.Email,
                    mh.TenMonHoc,
                    vt.TenVaiTro
                FROM GIANGDAY gd
                JOIN NGUOIDUNG nd ON gd.MaGiaoVien = nd.MaNguoiDung
                JOIN MONHOC mh ON gd.MaMonHoc = mh.MaMonHoc
                JOIN VAITRO vt ON nd.MaVaiTro = vt.MaVaiTro
                WHERE gd.MaLop = $1
            `;
            const params = [maLop];

            if (maNamHoc) {
                query += ` AND gd.MaNamHoc = $${params.length + 1}`;
                params.push(maNamHoc);
            }

            if (maHocKy) {
                query += ` AND gd.MaHocKy = $${params.length + 1}`;
                params.push(maHocKy);
            }

            query += ` ORDER BY mh.TenMonHoc`;

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Kiểm tra giáo viên có quyền nhập điểm lớp-môn không
    checkPermission: async (maGiaoVien, maLop, maMonHoc, maHocKy, maNamHoc) => {
        try {
            const query = `
                SELECT * FROM GIANGDAY
                WHERE MaGiaoVien = $1 
                    AND MaLop = $2 
                    AND MaMonHoc = $3 
                    AND MaHocKy = $4 
                    AND MaNamHoc = $5
            `;
            const result = await pool.query(query, [maGiaoVien, maLop, maMonHoc, maHocKy, maNamHoc]);
            return result.rows.length > 0;
        } catch (error) {
            throw error;
        }
    },

    // Thêm phân công giảng dạy
    create: async (maLop, maMonHoc, maGiaoVien, maHocKy, maNamHoc, tuNgay = null, denNgay = null) => {
        try {
            const query = `
                INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc, TuNgay, DenNgay)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc) DO NOTHING
                RETURNING *
            `;
            const result = await pool.query(query, [maLop, maMonHoc, maGiaoVien, maHocKy, maNamHoc, tuNgay, denNgay]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Thêm nhiều phân công cùng lúc
    bulkCreate: async (assignments) => {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const results = [];
            for (const assign of assignments) {
                const { maLop, maMonHoc, maGiaoVien, maHocKy, maNamHoc, tuNgay, denNgay } = assign;
                
                const query = `
                    INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc, TuNgay, DenNgay)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc) DO NOTHING
                    RETURNING *
                `;
                const result = await client.query(query, [maLop, maMonHoc, maGiaoVien, maHocKy, maNamHoc, tuNgay, denNgay]);
                if (result.rows[0]) {
                    results.push(result.rows[0]);
                }
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

    // Cập nhật thời gian giảng dạy
    update: async (maLop, maMonHoc, maGiaoVien, maHocKy, maNamHoc, tuNgay, denNgay) => {
        try {
            const query = `
                UPDATE GIANGDAY 
                SET TuNgay = $6, DenNgay = $7
                WHERE MaLop = $1 
                    AND MaMonHoc = $2 
                    AND MaGiaoVien = $3 
                    AND MaHocKy = $4 
                    AND MaNamHoc = $5
                RETURNING *
            `;
            const result = await pool.query(query, [maLop, maMonHoc, maGiaoVien, maHocKy, maNamHoc, tuNgay, denNgay]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Xóa phân công
    delete: async (maLop, maMonHoc, maGiaoVien, maHocKy, maNamHoc) => {
        try {
            const query = `
                DELETE FROM GIANGDAY
                WHERE MaLop = $1 
                    AND MaMonHoc = $2 
                    AND MaGiaoVien = $3 
                    AND MaHocKy = $4 
                    AND MaNamHoc = $5
                RETURNING *
            `;
            const result = await pool.query(query, [maLop, maMonHoc, maGiaoVien, maHocKy, maNamHoc]);
            return result.rows[0];
        } catch (error) {
            throw error;
        }
    },

    // Lấy danh sách môn học mà GV dạy (distinct)
    getMonHocByGiaoVien: async (maGiaoVien, maNamHoc, maHocKy) => {
        try {
            const query = `
                SELECT DISTINCT mh.MaMonHoc, mh.TenMonHoc
                FROM GIANGDAY gd
                JOIN MONHOC mh ON gd.MaMonHoc = mh.MaMonHoc
                WHERE gd.MaGiaoVien = $1 
                    AND gd.MaNamHoc = $2 
                    AND gd.MaHocKy = $3
                ORDER BY mh.TenMonHoc
            `;
            const result = await pool.query(query, [maGiaoVien, maNamHoc, maHocKy]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Lấy danh sách lớp mà GV dạy môn cụ thể
    getLopByGiaoVienAndMonHoc: async (maGiaoVien, maMonHoc, maNamHoc, maHocKy) => {
        try {
            const query = `
                SELECT DISTINCT l.MaLop, l.TenLop, l.SiSo, k.TenKhoiLop
                FROM GIANGDAY gd
                JOIN LOP l ON gd.MaLop = l.MaLop
                JOIN KHOILOP k ON l.MaKhoiLop = k.MaKhoiLop
                WHERE gd.MaGiaoVien = $1 
                    AND gd.MaMonHoc = $2 
                    AND gd.MaNamHoc = $3 
                    AND gd.MaHocKy = $4
                ORDER BY l.TenLop
            `;
            const result = await pool.query(query, [maGiaoVien, maMonHoc, maNamHoc, maHocKy]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    },

    // Lấy tất cả phân công giảng dạy
    getAll: async (maNamHoc = null, maHocKy = null) => {
        try {
            let query = `
                SELECT 
                    gd.*,
                    l.TenLop,
                    mh.TenMonHoc,
                    nd.HoTen as TenGiaoVien,
                    vt.TenVaiTro
                FROM GIANGDAY gd
                JOIN LOP l ON gd.MaLop = l.MaLop
                JOIN MONHOC mh ON gd.MaMonHoc = mh.MaMonHoc
                JOIN NGUOIDUNG nd ON gd.MaGiaoVien = nd.MaNguoiDung
                JOIN VAITRO vt ON nd.MaVaiTro = vt.MaVaiTro
                WHERE 1=1
            `;
            const params = [];

            if (maNamHoc) {
                query += ` AND gd.MaNamHoc = $${params.length + 1}`;
                params.push(maNamHoc);
            }

            if (maHocKy) {
                query += ` AND gd.MaHocKy = $${params.length + 1}`;
                params.push(maHocKy);
            }

            query += ` ORDER BY l.TenLop, mh.TenMonHoc, nd.HoTen`;

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
};

module.exports = GiangDayModel;
