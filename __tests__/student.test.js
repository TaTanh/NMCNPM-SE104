// ========== UNIT TESTS CHO STUDENT CONTROLLER ==========

const request = require('supertest');
const express = require('express');
const studentRoutes = require('../src/routes/studentRoutes');

// Tạo express app cho testing
const app = express();
app.use(express.json());
app.use('/api/students', studentRoutes);

describe('Student Controller Tests', () => {
    
    // ========== GET STUDENTS TESTS ==========
    describe('GET /api/students', () => {
        
        test('Nên lấy danh sách học sinh thành công', async () => {
            const response = await request(app)
                .get('/api/students');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
        
        test('Nên lọc học sinh theo lớp', async () => {
            const response = await request(app)
                .get('/api/students?lop=10A1');
            
            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });
    });
    
    // ========== GET STUDENT BY ID TESTS ==========
    describe('GET /api/students/:id', () => {
        
        test('Nên lấy thông tin học sinh theo ID', async () => {
            const response = await request(app)
                .get('/api/students/HS010000');
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('mahocsinh', 'HS010000');
        });
        
        test('Nên trả lỗi 404 khi không tìm thấy học sinh', async () => {
            const response = await request(app)
                .get('/api/students/HS999999');
            
            expect(response.status).toBe(404);
            expect(response.body).toHaveProperty('error');
        });
    });
    
    // ========== CREATE STUDENT TESTS ==========
    describe('POST /api/students', () => {
        
        test('Nên trả lỗi khi thiếu họ tên', async () => {
            const response = await request(app)
                .post('/api/students')
                .send({
                    MaHocSinh: 'HS099999',
                    GioiTinh: 'Nam',
                    NgaySinh: '2010-01-01'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('họ tên');
        });
        
        test('Nên trả lỗi khi họ tên chứa số', async () => {
            const response = await request(app)
                .post('/api/students')
                .send({
                    MaHocSinh: 'HS099999',
                    HoTen: 'Nguyen Van 123',
                    GioiTinh: 'Nam',
                    NgaySinh: '2010-01-01'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('chữ cái');
        });
        
        test('Nên trả lỗi khi giới tính không hợp lệ', async () => {
            const response = await request(app)
                .post('/api/students')
                .send({
                    MaHocSinh: 'HS099999',
                    HoTen: 'Nguyen Van A',
                    GioiTinh: 'Male',
                    NgaySinh: '2010-01-01'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Nam hoặc Nữ');
        });
        
        test('Nên trả lỗi khi tuổi quá nhỏ', async () => {
            const currentYear = new Date().getFullYear();
            const birthYear = currentYear - 5; // 5 tuổi
            
            const response = await request(app)
                .post('/api/students')
                .send({
                    MaHocSinh: 'HS099999',
                    HoTen: 'Nguyen Van A',
                    GioiTinh: 'Nam',
                    NgaySinh: `${birthYear}-01-01`
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('10-25');
        });
        
        test('Nên trả lỗi khi tuổi quá lớn', async () => {
            const currentYear = new Date().getFullYear();
            const birthYear = currentYear - 30; // 30 tuổi
            
            const response = await request(app)
                .post('/api/students')
                .send({
                    MaHocSinh: 'HS099999',
                    HoTen: 'Nguyen Van A',
                    GioiTinh: 'Nam',
                    NgaySinh: `${birthYear}-01-01`
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('10-25');
        });
        
        test('Nên trả lỗi khi email không hợp lệ', async () => {
            const response = await request(app)
                .post('/api/students')
                .send({
                    MaHocSinh: 'HS099999',
                    HoTen: 'Nguyen Van A',
                    GioiTinh: 'Nam',
                    NgaySinh: '2010-01-01',
                    Email: 'invalid-email'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Email không hợp lệ');
        });
        
        test('Nên trả lỗi khi số điện thoại không hợp lệ', async () => {
            const response = await request(app)
                .post('/api/students')
                .send({
                    MaHocSinh: 'HS099999',
                    HoTen: 'Nguyen Van A',
                    GioiTinh: 'Nam',
                    NgaySinh: '2010-01-01',
                    SdtPhuHuynh: '123'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Số điện thoại không hợp lệ');
        });
    });
    
    // ========== UPDATE STUDENT TESTS ==========
    describe('PUT /api/students/:id', () => {
        
        test('Nên trả lỗi khi họ tên quá ngắn', async () => {
            const response = await request(app)
                .put('/api/students/HS010000')
                .send({
                    HoTen: 'A',
                    GioiTinh: 'Nam',
                    NgaySinh: '2010-01-01'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('2-100 ký tự');
        });
    });
});
