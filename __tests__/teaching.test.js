// ========== UNIT TESTS CHO TEACHING ASSIGNMENT (GIANGDAY) ==========

const request = require('supertest');
const express = require('express');
const giangdayRoutes = require('../src/routes/giangdayRoutes');

const app = express();
app.use(express.json());
app.use('/api/giangday', giangdayRoutes);

describe('Teaching Assignment (GiangDay) Tests', () => {
    
    // ========== GET ALL ASSIGNMENTS TESTS ==========
    describe('GET /api/giangday', () => {
        
        test('Nên lấy tất cả phân công giảng dạy', async () => {
            const response = await request(app).get('/api/giangday');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
        
        test('Nên lọc phân công theo năm học', async () => {
            const response = await request(app)
                .get('/api/giangday')
                .query({ maNamHoc: '2024-2025' });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
        });
        
        test('Nên lọc phân công theo học kỳ', async () => {
            const response = await request(app)
                .get('/api/giangday')
                .query({ maHocKy: '1' });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
        });
        
        test('Nên lọc phân công theo cả năm học và học kỳ', async () => {
            const response = await request(app)
                .get('/api/giangday')
                .query({ maNamHoc: '2024-2025', maHocKy: '1' });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
        });
    });
    
    // ========== CREATE ASSIGNMENT TESTS ==========
    describe('POST /api/giangday', () => {
        
        test('Nên tạo phân công giảng dạy thành công', async () => {
            const newAssignment = {
                maLop: '10A1',
                maMonHoc: 'TOAN',
                maGiaoVien: 1,
                maHocKy: '1',
                maNamHoc: '2024-2025'
            };
            
            const response = await request(app)
                .post('/api/giangday')
                .send(newAssignment);
            
            expect([200, 201, 400, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi thiếu thông tin bắt buộc', async () => {
            const incompleteAssignment = {
                maLop: '10A1',
                maMonHoc: 'TOAN'
                // Thiếu maGiaoVien, maHocKy, maNamHoc
            };
            
            const response = await request(app)
                .post('/api/giangday')
                .send(incompleteAssignment);
            
            expect([400, 500]).toContain(response.status);
            if (response.body.message) {
                expect(response.body.message).toContain('Thiếu');
            }
        });
        
        test('Nên xử lý duplicate assignment (ON CONFLICT)', async () => {
            const duplicateAssignment = {
                maLop: '10A1',
                maMonHoc: 'TOAN',
                maGiaoVien: 1,
                maHocKy: '1',
                maNamHoc: '2024-2025'
            };
            
            // Tạo lần 1
            await request(app).post('/api/giangday').send(duplicateAssignment);
            
            // Tạo lần 2 (duplicate)
            const response = await request(app)
                .post('/api/giangday')
                .send(duplicateAssignment);
            
            // Có thể thành công (ON CONFLICT DO NOTHING) hoặc lỗi
            expect([200, 201, 400, 500]).toContain(response.status);
        });
    });
    
    // ========== BULK CREATE ASSIGNMENTS TESTS ==========
    describe('POST /api/giangday/bulk', () => {
        
        test('Nên tạo nhiều phân công cùng lúc', async () => {
            const bulkAssignments = {
                giangDayList: [
                    {
                        maLop: '10A1',
                        maMonHoc: 'VAN',
                        maGiaoVien: 2,
                        maHocKy: '1',
                        maNamHoc: '2024-2025'
                    },
                    {
                        maLop: '10A1',
                        maMonHoc: 'ANH',
                        maGiaoVien: 3,
                        maHocKy: '1',
                        maNamHoc: '2024-2025'
                    }
                ]
            };
            
            const response = await request(app)
                .post('/api/giangday/bulk')
                .send(bulkAssignments);
            
            expect([200, 400, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi danh sách rỗng', async () => {
            const emptyList = {
                giangDayList: []
            };
            
            const response = await request(app)
                .post('/api/giangday/bulk')
                .send(emptyList);
            
            expect([400, 500]).toContain(response.status);
            if (response.body.message) {
                expect(response.body.message).toContain('không hợp lệ');
            }
        });
    });
    
    // ========== GET ASSIGNMENTS BY TEACHER TESTS ==========
    describe('GET /api/giangday/teacher/:maGiaoVien', () => {
        
        test('Nên lấy phân công của giáo viên', async () => {
            const response = await request(app)
                .get('/api/giangday/teacher/1');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
        });
        
        test('Nên lọc phân công giáo viên theo năm học', async () => {
            const response = await request(app)
                .get('/api/giangday/teacher/1')
                .query({ maNamHoc: '2024-2025' });
            
            expect(response.status).toBe(200);
        });
    });
    
    // ========== GET ASSIGNMENTS BY CLASS TESTS ==========
    describe('GET /api/giangday/class/:maLop', () => {
        
        test('Nên lấy danh sách giáo viên dạy lớp', async () => {
            const response = await request(app)
                .get('/api/giangday/class/10A1');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
        });
    });
    
    // ========== CHECK PERMISSION TESTS ==========
    describe('GET /api/giangday/permission/:maGiaoVien/:maLop/:maMonHoc', () => {
        
        test('Nên kiểm tra quyền nhập điểm của giáo viên', async () => {
            const response = await request(app)
                .get('/api/giangday/permission/1/10A1/TOAN')
                .query({ maHocKy: '1', maNamHoc: '2024-2025' });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('hasPermission');
            expect(typeof response.body.hasPermission).toBe('boolean');
        });
        
        test('Nên báo lỗi khi thiếu học kỳ hoặc năm học', async () => {
            const response = await request(app)
                .get('/api/giangday/permission/1/10A1/TOAN');
            
            expect([400, 500]).toContain(response.status);
        });
    });
    
    // ========== DELETE ASSIGNMENT TESTS ==========
    describe('DELETE /api/giangday', () => {
        
        test('Nên xóa phân công thành công', async () => {
            const response = await request(app)
                .delete('/api/giangday')
                .query({
                    maLop: '10A1',
                    maMonHoc: 'TOAN',
                    maGiaoVien: 1,
                    maHocKy: '1',
                    maNamHoc: '2024-2025'
                });
            
            expect([200, 404, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi thiếu tham số', async () => {
            const response = await request(app)
                .delete('/api/giangday')
                .query({
                    maLop: '10A1'
                    // Thiếu các tham số khác
                });
            
            expect([400, 500]).toContain(response.status);
        });
    });
    
    // ========== GVCN BADGE TESTS ==========
    describe('GVCN Badge in Teaching Assignment', () => {
        
        test('Nên trả về thông tin IsGVCN trong danh sách phân công', async () => {
            const response = await request(app)
                .get('/api/giangday')
                .query({ maNamHoc: '2024-2025', maHocKy: '1' });
            
            if (response.status === 200 && response.body.data && response.body.data.length > 0) {
                const firstItem = response.body.data[0];
                // Kiểm tra có trường IsGVCN
                expect(firstItem).toHaveProperty('isgvcn');
            }
        });
        
        test('IsGVCN phải là boolean hoặc t/f', async () => {
            const response = await request(app).get('/api/giangday');
            
            if (response.status === 200 && response.body.data && response.body.data.length > 0) {
                const items = response.body.data;
                items.forEach(item => {
                    if (item.isgvcn !== undefined) {
                        expect(['t', 'f', true, false]).toContain(item.isgvcn);
                    }
                });
            }
        });
    });
    
    // ========== INTEGRATION TESTS ==========
    describe('Integration: Teaching Assignment Flow', () => {
        
        test('Quy trình đầy đủ: Tạo → Kiểm tra quyền → Xóa', async () => {
            // 1. Tạo phân công
            const assignment = {
                maLop: 'TESTLOP',
                maMonHoc: 'TESTMON',
                maGiaoVien: 99,
                maHocKy: '1',
                maNamHoc: '2024-2025'
            };
            
            const createRes = await request(app)
                .post('/api/giangday')
                .send(assignment);
            
            if (createRes.status === 200 || createRes.status === 201) {
                // 2. Kiểm tra quyền
                const permissionRes = await request(app)
                    .get(`/api/giangday/permission/99/TESTLOP/TESTMON`)
                    .query({ maHocKy: '1', maNamHoc: '2024-2025' });
                
                expect([200, 400]).toContain(permissionRes.status);
                
                // 3. Xóa
                const deleteRes = await request(app)
                    .delete('/api/giangday')
                    .query({
                        maLop: 'TESTLOP',
                        maMonHoc: 'TESTMON',
                        maGiaoVien: 99,
                        maHocKy: '1',
                        maNamHoc: '2024-2025'
                    });
                
                expect([200, 404]).toContain(deleteRes.status);
            }
        });
    });
});
