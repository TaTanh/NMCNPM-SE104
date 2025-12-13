/**
 * Teaching Assignment Management Controller
 * Handles fetching and updating teaching assignments across classes and subjects
 */

const giangdayModel = require('../models/giangdayModel');
const classModel = require('../models/classModel');
const subjectModel = require('../models/subjectModel');
const userModel = require('../models/userModel');
const { normalizeHocKy } = require('../utils/semesterUtil');
const auditModel = require('../models/auditModel');

const TeachingAssignmentController = {
    /**
     * GET /api/teaching-assignments?maNamHoc=&maHocKy=&maKhoiLop=
     * Returns aggregated data: classes, subjects, and teachers
     * Subjects are grouped by grade, years, and semester
     */
    getAssignments: async (req, res) => {
        try {
            const { maNamHoc, maHocKy, maKhoiLop } = req.query;

            if (!maNamHoc || !maHocKy || !maKhoiLop) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc: maNamHoc, maHocKy, maKhoiLop'
                });
            }

            const normalizedHK = normalizeHocKy(maHocKy);

            // Fetch classes for this grade first
            const classesQuery = `
                SELECT DISTINCT l.MaLop, l.TenLop, l.MaGVCN, l.SiSo
                FROM LOP l
                WHERE l.MaKhoiLop = $1
                ORDER BY l.TenLop
            `;
            const classesResult = await require('../config/db').query(classesQuery, [maKhoiLop]);
            const classes = classesResult.rows;

            // Fetch all subjects taught in this grade/semester
            const subjectsQuery = `
                SELECT DISTINCT m.MaMonHoc, m.TenMonHoc
                FROM MONHOC m
                JOIN GIANGDAY gd ON m.MaMonHoc = gd.MaMonHoc
                JOIN LOP l ON gd.MaLop = l.MaLop
                WHERE l.MaKhoiLop = $1
                  AND gd.MaHocKy = $2
                  AND gd.MaNamHoc = $3
                ORDER BY m.TenMonHoc
            `;
            const subjectsResult = await require('../config/db').query(subjectsQuery, [maKhoiLop, normalizedHK, maNamHoc]);
            const subjects = subjectsResult.rows;

            // Fetch all teachers (GVBM + GVCN)
            const teachersQuery = `
                SELECT DISTINCT nd.MaNguoiDung, nd.HoTen, nd.Email, vt.TenVaiTro
                FROM NGUOIDUNG nd
                JOIN VAITRO vt ON nd.MaVaiTro = vt.MaVaiTro
                WHERE vt.MaVaiTro IN ('GVBM', 'GVCN')
                ORDER BY nd.HoTen
            `;
            const teachersResult = await require('../config/db').query(teachersQuery);
            const teachers = teachersResult.rows;

            // For each class, fetch assigned subjects and their teachers
            for (const cls of classes) {
                const classAssignmentsQuery = `
                    SELECT gd.MaMonHoc, gd.MaGiaoVien
                    FROM GIANGDAY gd
                    WHERE gd.MaLop = $1
                        AND gd.MaNamHoc = $2
                        AND gd.MaHocKy = $3
                `;
                const assignResult = await require('../config/db').query(classAssignmentsQuery, [
                    cls.malop || cls.MaLop,
                    maNamHoc,
                    normalizedHK
                ]);

                cls.subjects = assignResult.rows.map(row => ({
                    mamonhoc: row.mamonhoc || row.MaMonHoc,
                    magiaoVien: row.magiaoVien || row.MaGiaoVien
                }));
            }

            res.json({
                success: true,
                data: {
                    classes,
                    subjects,
                    teachers
                }
            });
        } catch (error) {
            console.error('Error in getAssignments:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lấy dữ liệu phân công',
                error: error.message
            });
        }
    },

    /**
     * PATCH /api/teaching-assignments
     * Save all assignments for a single class
     * Payload: {
     *   maLop,
     *   maGVCN (optional),
     *   assignments: [{ maMonHoc, maGiaoVien }],
     *   maNamHoc,
     *   maHocKy
     * }
     */
    saveAssignments: async (req, res) => {
        const client = await require('../config/db').connect();
        try {
            const { maLop, maGVCN, assignments, maNamHoc, maHocKy } = req.body;
            const userId = req.headers['x-user-id'] || req.user?.id;

            if (!maLop || !Array.isArray(assignments) || !maNamHoc || !maHocKy) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin bắt buộc'
                });
            }

            const normalizedHK = normalizeHocKy(maHocKy);
            await client.query('BEGIN');

            // Update GVCN if provided
            if (maGVCN) {
                try {
                    await classModel.updateGvcn(maLop, parseInt(maGVCN));
                    if (userId) {
                        await auditModel.createLog({
                            MaNguoiDung: parseInt(userId),
                            HanhDong: 'CHANGE_GVCN',
                            BangMuc: 'GIANGDAY',
                            MaDoiTuong: maLop,
                            ChiTiet: { maGVCN: parseInt(maGVCN) }
                        });
                    }
                } catch (auditErr) {
                    console.error('Audit log error:', auditErr);
                }
            }

            // Update/insert subject teacher assignments
            for (const assign of assignments) {
                const { maMonHoc, maGiaoVien } = assign;

                if (!maMonHoc || !maGiaoVien) continue;

                // Check if assignment exists
                const existsQuery = `
                    SELECT * FROM GIANGDAY
                    WHERE MaLop = $1 AND MaMonHoc = $2 AND MaHocKy = $3 AND MaNamHoc = $4
                `;
                const existsResult = await client.query(existsQuery, [
                    maLop,
                    maMonHoc,
                    normalizedHK,
                    maNamHoc
                ]);

                if (existsResult.rows.length > 0) {
                    // Update existing
                    const updateQuery = `
                        UPDATE GIANGDAY
                        SET MaGiaoVien = $1
                        WHERE MaLop = $2 AND MaMonHoc = $3 AND MaHocKy = $4 AND MaNamHoc = $5
                    `;
                    await client.query(updateQuery, [
                        parseInt(maGiaoVien),
                        maLop,
                        maMonHoc,
                        normalizedHK,
                        maNamHoc
                    ]);
                } else {
                    // Insert new
                    const insertQuery = `
                        INSERT INTO GIANGDAY (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (MaLop, MaMonHoc, MaGiaoVien, MaHocKy, MaNamHoc) DO NOTHING
                    `;
                    await client.query(insertQuery, [
                        maLop,
                        maMonHoc,
                        parseInt(maGiaoVien),
                        normalizedHK,
                        maNamHoc
                    ]);
                }

                // Log assignment change
                if (userId) {
                    try {
                        await auditModel.createLog({
                            MaNguoiDung: parseInt(userId),
                            HanhDong: 'UPDATE_GIANGDAY',
                            BangMuc: 'GIANGDAY',
                            MaDoiTuong: `${maLop}|${maMonHoc}`,
                            ChiTiet: { maGiaoVien: parseInt(maGiaoVien), maMonHoc, maLop }
                        });
                    } catch (auditErr) {
                        console.error('Audit log error:', auditErr);
                    }
                }
            }

            await client.query('COMMIT');

            res.json({
                success: true,
                message: 'Cập nhật phân công thành công'
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error in saveAssignments:', error);
            res.status(500).json({
                success: false,
                message: 'Lỗi khi lưu phân công',
                error: error.message
            });
        } finally {
            client.release();
        }
    }
};

module.exports = TeachingAssignmentController;
