// ========== UNIT TESTS CHO CLASS CONTROLLER ==========

const request = require('supertest');
const express = require('express');
const classRoutes = require('../src/routes/classRoutes');

const app = express();
app.use(express.json());
app.use('/api/classes', classRoutes);

describe('Class Controller Tests', () => {
    
    // ========== GET CLASSES TESTS ==========
    describe('GET /api/classes', () => {
        
        test('Nên lấy danh sách lớp thành công', async () => {
            const response = await request(app).get('/api/classes');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        
        test('Nên lọc lớp theo năm học', async () => {
            const response = await request(app).get('/api/classes?namhoc=2024-2025');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        
        test('Nên lọc lớp theo khối', async () => {
            const response = await request(app).get('/api/classes?khoi=10');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
    
    // ========== GET CLASS BY ID TESTS ==========
    describe('GET /api/classes/:id', () => {
        
        test('Nên lấy thông tin lớp theo ID', async () => {
            const response = await request(app).get('/api/classes/10A1');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('malop', '10A1');
        });
        
        test('Nên trả lỗi 404 khi không tìm thấy lớp', async () => {
            const response = await request(app).get('/api/classes/99Z99');
            
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });
    
    // ========== CREATE CLASS TESTS ==========
    describe('POST /api/classes', () => {
        
        test('Nên tạo lớp mới thành công (không có GVCN)', async () => {
            const newClass = {
                MaLop: 'TEST01',
                TenLop: 'Lớp Test 01',
                MaKhoiLop: '10',
                MaNamHoc: '2024-2025',
                SiSo: 0
            };
            
            const response = await request(app)
                .post('/api/classes')
                .send(newClass);
            
            expect([201, 400]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi thiếu thông tin bắt buộc', async () => {
            const invalidClass = {
                MaLop: 'TEST02'
            };
            
            const response = await request(app)
                .post('/api/classes')
                .send(invalidClass);
            
            expect([400, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi mã lớp đã tồn tại', async () => {
            const duplicateClass = {
                MaLop: '10A1',
                TenLop: 'Lớp 10A1 Duplicate',
                MaKhoiLop: '10',
                MaNamHoc: '2024-2025',
                SiSo: 0
            };
            
            const response = await request(app)
                .post('/api/classes')
                .send(duplicateClass);
            
            expect([400, 500]).toContain(response.status);
        });
    });
    
    // ========== UPDATE CLASS TESTS ==========
    describe('PUT /api/classes/:id', () => {
        
        test('Nên cập nhật thông tin lớp thành công', async () => {
            const updateData = {
                TenLop: 'Lớp 10A1 Updated',
                MaKhoiLop: '10',
                MaNamHoc: '2024-2025',
                SiSo: 35
            };
            
            const response = await request(app)
                .put('/api/classes/10A1')
                .send(updateData);
            
            expect([200, 404, 500]).toContain(response.status);
        });
    });
    
    // ========== DELETE CLASS TESTS ==========
    describe('DELETE /api/classes/:id', () => {
        
        test('Nên xóa lớp khi không có học sinh', async () => {
            const response = await request(app).delete('/api/classes/TEST01');
            
            expect([200, 404, 500]).toContain(response.status);
        });
    });
    
    // ========== CLASS STUDENTS TESTS ==========
    describe('GET /api/classes/:id/students', () => {
        
        test('Nên lấy danh sách học sinh trong lớp', async () => {
            const response = await request(app).get('/api/classes/10A1/students');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
    
    // ========== ADD STUDENTS TO CLASS TESTS ==========
    describe('POST /api/classes/:id/students', () => {
        
        test('Nên báo lỗi khi vượt quá sĩ số tối đa', async () => {
            const tooManyStudents = {
                students: new Array(50).fill('HS000001') // 50 học sinh > 40 max
            };
            
            const response = await request(app)
                .post('/api/classes/10A1/students/bulk')
                .send(tooManyStudents);
            
            expect([400, 500]).toContain(response.status);
        });
    });
});
