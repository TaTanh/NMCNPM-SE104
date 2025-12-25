/**
 * Teaching Assignment Management Controller
 * UI LAYER - Aggregated data for frontend management interface
 * 
 * Purpose: Provide consolidated data (classes + subjects + teachers) for batch assignment UI
 * Uses: giangdayModel for actual database operations
 * 
 * Note: For simple CRUD operations, use giangdayController directly
 * This controller is specifically for the management UI that needs aggregated data
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

            // Update/insert subject teacher assignments using giangdayModel
            // This avoids duplicating INSERT/UPDATE logic
            for (const assign of assignments) {
                const { maMonHoc, maGiaoVien } = assign;

                if (!maMonHoc || !maGiaoVien) continue;

                try {
                    // Use giangdayModel.create() which handles ON CONFLICT (upsert)
                    await giangdayModel.create(
                        maLop,
                        maMonHoc,
                        parseInt(maGiaoVien),
                        normalizedHK,
                        maNamHoc
                    );

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
                } catch (assignErr) {
                    console.error('Error assigning teacher:', assignErr);
                    // Continue with other assignments even if one fails
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
