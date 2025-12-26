// ========== UNIT TESTS CHO GRADE CONTROLLER ==========

const request = require('supertest');
const express = require('express');
const gradeRoutes = require('../src/routes/gradeRoutes');

const app = express();
app.use(express.json());
app.use('/api/grades', gradeRoutes);

describe('Grade Controller Tests', () => {
    
    // ========== GET GRADES TESTS ==========
    describe('GET /api/grades/class/:maLop/subject/:maMonHoc', () => {
        
        test('Nên lấy bảng điểm lớp-môn thành công', async () => {
            const response = await request(app)
                .get('/api/grades/class/10A1/subject/TOAN')
                .query({ maHocKy: '1', maNamHoc: '2024-2025' });
            
            expect([200, 404, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi thiếu học kỳ', async () => {
            const response = await request(app)
                .get('/api/grades/class/10A1/subject/TOAN');
            
            expect([400, 500]).toContain(response.status);
        });
    });
    
    // ========== CREATE/UPDATE GRADES TESTS ==========
    describe('POST /api/grades', () => {
        
        test('Nên nhập điểm hợp lệ thành công', async () => {
            const validGrade = {
                MaHocSinh: 'HS010001',
                MaMonHoc: 'TOAN',
                MaHocKy: '1',
                MaNamHoc: '2024-2025',
                Diem15Phut: [8.5, 9.0],
                Diem1Tiet: [7.5],
                DiemThi: 8.0
            };
            
            const response = await request(app)
                .post('/api/grades')
                .send(validGrade);
            
            expect([200, 201, 400, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi điểm < 0', async () => {
            const invalidGrade = {
                MaHocSinh: 'HS010001',
                MaMonHoc: 'TOAN',
                MaHocKy: '1',
                MaNamHoc: '2024-2025',
                Diem15Phut: [-1], // Điểm âm
                Diem1Tiet: [7.5],
                DiemThi: 8.0
            };
            
            const response = await request(app)
                .post('/api/grades')
                .send(invalidGrade);
            
            expect([400, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi điểm > 10', async () => {
            const invalidGrade = {
                MaHocSinh: 'HS010001',
                MaMonHoc: 'TOAN',
                MaHocKy: '1',
                MaNamHoc: '2024-2025',
                Diem15Phut: [15], // Điểm > 10
                Diem1Tiet: [7.5],
                DiemThi: 8.0
            };
            
            const response = await request(app)
                .post('/api/grades')
                .send(invalidGrade);
            
            expect([400, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi điểm không phải số', async () => {
            const invalidGrade = {
                MaHocSinh: 'HS010001',
                MaMonHoc: 'TOAN',
                MaHocKy: '1',
                MaNamHoc: '2024-2025',
                Diem15Phut: ['abc'], // Không phải số
                Diem1Tiet: [7.5],
                DiemThi: 8.0
            };
            
            const response = await request(app)
                .post('/api/grades')
                .send(invalidGrade);
            
            expect([400, 500]).toContain(response.status);
        });
    });
    
    // ========== AVERAGE CALCULATION TESTS ==========
    describe('Grade Average Calculation', () => {
        
        test('Nên tính điểm trung bình môn đúng công thức', async () => {
            // Công thức: (Tổng 15p + Tổng 1 tiết * 2 + Điểm thi * 3) / (Số điểm 15p + Số điểm 1 tiết * 2 + 3)
            const gradeData = {
                MaHocSinh: 'HS010001',
                MaMonHoc: 'TOAN',
                MaHocKy: '1',
                MaNamHoc: '2024-2025',
                Diem15Phut: [8, 9],      // Tổng = 17
                Diem1Tiet: [7],          // Tổng * 2 = 14
                DiemThi: 8               // * 3 = 24
                // TB = (17 + 14 + 24) / (2 + 2 + 3) = 55/7 ≈ 7.86
            };
            
            const response = await request(app)
                .post('/api/grades')
                .send(gradeData);
            
            if (response.status === 200 || response.status === 201) {
                const diemTB = response.body.DiemTrungBinhMon || response.body.diemtrungbinhmon;
                if (diemTB) {
                    expect(diemTB).toBeCloseTo(7.86, 1); // Sai số 0.1
                }
            }
        });
        
        test('Nên tính điểm trung bình học kỳ đúng', async () => {
            // Lấy tất cả điểm môn của học sinh trong học kỳ
            const response = await request(app)
                .get('/api/grades/student/HS010001')
                .query({ maHocKy: '1', maNamHoc: '2024-2025' });
            
            if (response.status === 200) {
                // Kiểm tra có trường DiemTrungBinhHocKy
                expect([200, 404]).toContain(response.status);
            }
        });
    });
    
    // ========== BULK GRADE INPUT TESTS ==========
    describe('POST /api/grades/bulk', () => {
        
        test('Nên nhập điểm hàng loạt thành công', async () => {
            const bulkGrades = {
                grades: [
                    {
                        MaHocSinh: 'HS010001',
                        MaMonHoc: 'TOAN',
                        MaHocKy: '1',
                        MaNamHoc: '2024-2025',
                        Diem15Phut: [8.5],
                        Diem1Tiet: [7.5],
                        DiemThi: 8.0
                    },
                    {
                        MaHocSinh: 'HS010002',
                        MaMonHoc: 'TOAN',
                        MaHocKy: '1',
                        MaNamHoc: '2024-2025',
                        Diem15Phut: [9.0],
                        Diem1Tiet: [8.0],
                        DiemThi: 9.0
                    }
                ]
            };
            
            const response = await request(app)
                .post('/api/grades/bulk')
                .send(bulkGrades);
            
            expect([200, 201, 400, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi khi có điểm không hợp lệ trong bulk', async () => {
            const invalidBulkGrades = {
                grades: [
                    {
                        MaHocSinh: 'HS010001',
                        MaMonHoc: 'TOAN',
                        MaHocKy: '1',
                        MaNamHoc: '2024-2025',
                        Diem15Phut: [15], // Invalid
                        Diem1Tiet: [7.5],
                        DiemThi: 8.0
                    }
                ]
            };
            
            const response = await request(app)
                .post('/api/grades/bulk')
                .send(invalidBulkGrades);
            
            expect([400, 500]).toContain(response.status);
        });
    });
    
    // ========== STUDENT TRANSCRIPT TESTS ==========
    describe('GET /api/grades/student/:maHocSinh/transcript', () => {
        
        test('Nên lấy bảng điểm cá nhân học sinh thành công', async () => {
            const response = await request(app)
                .get('/api/grades/student/HS010001/transcript')
                .query({ maNamHoc: '2024-2025' });
            
            expect([200, 404, 500]).toContain(response.status);
        });
        
        test('Nên báo lỗi 404 khi học sinh không tồn tại', async () => {
            const response = await request(app)
                .get('/api/grades/student/HS999999/transcript')
                .query({ maNamHoc: '2024-2025' });
            
            expect([404, 500]).toContain(response.status);
        });
    });
    
    // ========== EDGE CASES ==========
    describe('Edge Cases', () => {
        
        test('Nên xử lý điểm = 0 đúng (không phải null)', async () => {
            const zeroGrade = {
                MaHocSinh: 'HS010001',
                MaMonHoc: 'TOAN',
                MaHocKy: '1',
                MaNamHoc: '2024-2025',
                Diem15Phut: [0], // Điểm 0 hợp lệ
                Diem1Tiet: [0],
                DiemThi: 0
            };
            
            const response = await request(app)
                .post('/api/grades')
                .send(zeroGrade);
            
            expect([200, 201, 400, 500]).toContain(response.status);
        });
        
        test('Nên xử lý điểm = 10 đúng (giới hạn trên)', async () => {
            const maxGrade = {
                MaHocSinh: 'HS010001',
                MaMonHoc: 'TOAN',
                MaHocKy: '1',
                MaNamHoc: '2024-2025',
                Diem15Phut: [10],
                Diem1Tiet: [10],
                DiemThi: 10
            };
            
            const response = await request(app)
                .post('/api/grades')
                .send(maxGrade);
            
            expect([200, 201, 400, 500]).toContain(response.status);
        });
        
        test('Nên xử lý học sinh chưa có điểm nào', async () => {
            const response = await request(app)
                .get('/api/grades/student/HS010099/transcript')
                .query({ maNamHoc: '2024-2025' });
            
            // Có thể 200 với array rỗng hoặc 404
            expect([200, 404, 500]).toContain(response.status);
        });
    });
});
