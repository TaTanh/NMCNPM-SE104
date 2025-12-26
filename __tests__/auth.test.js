// ========== UNIT TESTS CHO AUTH CONTROLLER ==========

const request = require('supertest');
const express = require('express');
const authRoutes = require('../src/routes/authRoutes');

// Tạo express app cho testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller Tests', () => {
    
    // ========== LOGIN TESTS ==========
    describe('POST /api/auth/login', () => {
        
        test('Nên đăng nhập thành công với credentials hợp lệ', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: '123456'
                });
            
            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('maNguoiDung');
            expect(response.body.user).toHaveProperty('tenDangNhap', 'admin');
            expect(response.body.user).not.toHaveProperty('matkhau');
        });
        
        test('Nên trả lỗi khi username sai', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin_wrong',
                    password: '123456'
                });
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Tên đăng nhập hoặc mật khẩu không đúng');
        });
        
        test('Nên trả lỗi khi password sai', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: 'wrongpassword'
                });
            
            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });
        
        test('Nên trả lỗi khi thiếu username', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    password: '123456'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
        
        test('Nên trả lỗi khi thiếu password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
        
        test('Nên trả lỗi khi username quá ngắn', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'ab',
                    password: '123456'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('3-50 ký tự');
        });
        
        test('Nên trả lỗi khi username chứa ký tự đặc biệt', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin@123',
                    password: '123456'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('chữ, số và dấu gạch dưới');
        });
        
        test('Nên trả lỗi khi password quá ngắn', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'admin',
                    password: '12345'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('ít nhất 6 ký tự');
        });
    });
    
    // ========== CREATE USER TESTS ==========
    describe('POST /api/auth/users', () => {
        
        test('Nên trả lỗi khi thiếu tên đăng nhập', async () => {
            const response = await request(app)
                .post('/api/auth/users')
                .send({
                    MatKhau: '123456',
                    HoTen: 'Test User',
                    MaVaiTro: 'STUDENT'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });
        
        test('Nên trả lỗi khi email không hợp lệ', async () => {
            const response = await request(app)
                .post('/api/auth/users')
                .send({
                    TenDangNhap: 'testuser',
                    MatKhau: '123456',
                    HoTen: 'Test User',
                    Email: 'invalid-email',
                    MaVaiTro: 'STUDENT'
                });
            
            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('Email không hợp lệ');
        });
    });
});
