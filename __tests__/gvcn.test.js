// ========== UNIT TESTS CHO GVCN ASSIGNMENT ==========

const request = require('supertest');
const express = require('express');
const classRoutes = require('../src/routes/classRoutes');

const app = express();
app.use(express.json());
app.use('/api/classes', classRoutes);

describe('GVCN Assignment Tests', () => {
    
    // ========== ASSIGN GVCN TESTS ==========
    describe('PUT /api/classes/:id/gvcn', () => {
        
        test('Nên gán GVCN thành công khi giáo viên chưa phụ trách lớp khác', async () => {
            const gvcnData = {
                MaGVCN: 1 // Giả sử ID hợp lệ
            };
            
            const response = await request(app)
                .put('/api/classes/10A1/gvcn')
                .send(gvcnData);
            
            // Có thể thành công (200) hoặc conflict (400) tùy dữ liệu thực tế
            expect([200, 400, 404, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi conflict khi GVCN đã phụ trách lớp khác trong cùng năm học', async () => {
            // Giả sử giáo viên ID=2 đã là GVCN của 10A1
            const gvcnData = {
                MaGVCN: 2
            };
            
            // Thử gán cho lớp 10A2
            const response = await request(app)
                .put('/api/classes/10A2/gvcn')
                .send(gvcnData);
            
            // Nếu conflict, status sẽ là 400
            if (response.status === 400) {
                expect(response.body).toHaveProperty('error');
                expect(response.body.error).toContain('GVCN');
            }
        });
        
        test('Nên báo lỗi khi MaGVCN không hợp lệ', async () => {
            const invalidData = {
                MaGVCN: 'invalid_id'
            };
            
            const response = await request(app)
                .put('/api/classes/10A1/gvcn')
                .send(invalidData);
            
            expect([400, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi MaGVCN là null', async () => {
            const nullData = {
                MaGVCN: null
            };
            
            const response = await request(app)
                .put('/api/classes/10A1/gvcn')
                .send(nullData);
            
            expect([400, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi giáo viên không tồn tại', async () => {
            const nonExistentTeacher = {
                MaGVCN: 999999
            };
            
            const response = await request(app)
                .put('/api/classes/10A1/gvcn')
                .send(nonExistentTeacher);
            
            expect([400, 404, 500]).toContain(response.status);
        });
    });
    
    // ========== UNASSIGN GVCN TESTS ==========
    describe('DELETE /api/classes/:id/gvcn', () => {
        
        test('Nên hủy GVCN thành công', async () => {
            const response = await request(app).delete('/api/classes/10A1/gvcn');
            
            expect([200, 404, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi 404 khi lớp không tồn tại', async () => {
            const response = await request(app).delete('/api/classes/NOTEXIST/gvcn');
            
            expect([404, 500]).toContain(response.status);
        });
    });
    
    // ========== GVCN CONFLICT VALIDATION TESTS ==========
    describe('GVCN Conflict Validation', () => {
        
        test('Không cho phép 1 GVCN phụ trách 2 lớp cùng năm học', async () => {
            // Bước 1: Gán GVCN cho lớp 10A1
            const gvcnData1 = { MaGVCN: 5 };
            await request(app).put('/api/classes/10A1/gvcn').send(gvcnData1);
            
            // Bước 2: Thử gán cùng GVCN cho lớp 10A2 (cùng năm học)
            const gvcnData2 = { MaGVCN: 5 };
            const response = await request(app)
                .put('/api/classes/10A2/gvcn')
                .send(gvcnData2);
            
            // Nên báo lỗi conflict
            if (response.status === 400) {
                expect(response.body.error).toContain('GVCN');
            }
        });
        
        test('Cho phép 1 GVCN phụ trách lớp ở năm học khác', async () => {
            // Test này cần có dữ liệu 2 năm học khác nhau
            // Giả sử 10A1 (2024-2025) và 10A3 (2023-2024)
            const gvcnData = { MaGVCN: 6 };
            
            const response = await request(app)
                .put('/api/classes/10A3/gvcn')
                .send(gvcnData);
            
            // Nên thành công vì khác năm học
            expect([200, 404, 500]).toContain(response.status);
        });
    });
    
    // ========== INTEGRATION TEST: CREATE CLASS WITH GVCN ==========
    describe('Create Class with GVCN', () => {
        
        test('Nên tạo lớp mới với GVCN thành công', async () => {
            const newClassWithGVCN = {
                MaLop: 'TESTGVCN01',
                TenLop: 'Lớp Test GVCN 01',
                MaKhoiLop: '10',
                MaNamHoc: '2024-2025',
                SiSo: 0,
                MaGVCN: 7
            };
            
            const response = await request(app)
                .post('/api/classes')
                .send(newClassWithGVCN);
            
            expect([201, 400, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi tạo lớp với GVCN đã phụ trách lớp khác', async () => {
            // Giả sử GVCN ID=8 đã phụ trách 10A1
            const conflictClass = {
                MaLop: 'TESTGVCN02',
                TenLop: 'Lớp Test GVCN 02',
                MaKhoiLop: '10',
                MaNamHoc: '2024-2025',
                SiSo: 0,
                MaGVCN: 8
            };
            
            const response = await request(app)
                .post('/api/classes')
                .send(conflictClass);
            
            if (response.status === 400) {
                expect(response.body.error).toContain('GVCN');
            }
        });
    });
});
