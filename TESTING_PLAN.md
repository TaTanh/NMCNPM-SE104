# KẾ HOẠCH KIỂM THỬ (TESTING PLAN)
## Hệ thống Quản lý Học sinh

**Phiên bản:** 1.0  
**Ngày tạo:** 26/12/2025  
**Người tạo:** Development Team

---

## I. TỔNG QUAN

### 1.1 Mục đích
Tài liệu này mô tả kế hoạch kiểm thử toàn diện cho hệ thống Quản lý Học sinh, bao gồm:
- Phạm vi kiểm thử
- Chiến lược kiểm thử
- Test cases chi tiết
- Tiêu chí đánh giá

### 1.2 Phạm vi kiểm thử
- ✅ Backend API (Node.js + Express)
- ✅ Database operations (PostgreSQL)
- ✅ Authentication & Authorization (JWT)
- ✅ Business logic validation
- ⚠️ Frontend UI (Chưa có automated tests)
- ⚠️ Integration tests (Chưa đầy đủ)

### 1.3 Công nghệ kiểm thử
- **Framework:** Jest
- **HTTP Testing:** Supertest
- **Coverage Tool:** Jest Coverage
- **Target Coverage:** ≥ 70%

---

## II. CÁC MODULE CẦN KIỂM THỬ

### 2.1 Authentication Module (auth)
**File test:** `__tests__/auth.test.js` ✅ Đã có

**Chức năng kiểm thử:**
- ✅ Đăng ký người dùng mới
- ✅ Đăng nhập với username/password
- ✅ JWT token generation
- ✅ Token validation
- ✅ Password hashing (bcrypt)

**Test cases:** 15+ cases

---

### 2.2 Student Module (student)
**File test:** `__tests__/student.test.js` ✅ Đã có

**Chức năng kiểm thử:**
- ✅ Lấy danh sách học sinh
- ✅ Lấy thông tin học sinh theo ID
- ✅ Tạo học sinh mới
- ✅ Cập nhật thông tin học sinh
- ✅ Xóa học sinh
- ✅ Lọc học sinh theo lớp

**Test cases:** 20+ cases

---

### 2.3 Class Module (class)
**File test:** `__tests__/class.test.js` ✅ Mới tạo

**Chức năng kiểm thử:**
- ✅ Lấy danh sách lớp (có filter năm học, khối)
- ✅ Tạo lớp mới (có/không GVCN)
- ✅ Cập nhật thông tin lớp
- ✅ Xóa lớp (kiểm tra có học sinh hay không)
- ✅ Lấy danh sách học sinh trong lớp
- ✅ Thêm học sinh vào lớp (kiểm tra sĩ số tối đa)
- ✅ Xóa học sinh khỏi lớp

**Test cases:** 15+ cases

**Test Cases Chi Tiết:**

| ID | Tên Test Case | Input | Expected Output | Priority |
|----|---------------|-------|-----------------|----------|
| TC-CLS-01 | Lấy danh sách lớp | GET /api/classes | Status 200, Array | High |
| TC-CLS-02 | Lọc lớp theo năm học | namhoc=2024-2025 | Filtered list | High |
| TC-CLS-03 | Lọc lớp theo khối | khoi=10 | Filtered list | High |
| TC-CLS-04 | Tạo lớp không có GVCN | Valid class data | Status 201 | High |
| TC-CLS-05 | Tạo lớp thiếu thông tin | Incomplete data | Status 400 | High |
| TC-CLS-06 | Tạo lớp mã trùng | Duplicate MaLop | Status 400 | High |
| TC-CLS-07 | Thêm HS vượt sĩ số | 50 students | Status 400 | Critical |
| TC-CLS-08 | Xóa lớp có học sinh | DELETE with students | Status 400 | High |

---

### 2.4 GVCN Assignment Module
**File test:** `__tests__/gvcn.test.js` ✅ Mới tạo

**Chức năng kiểm thử:**
- ✅ Gán GVCN cho lớp (hợp lệ)
- ✅ Kiểm tra conflict (1 GVCN chỉ 1 lớp/năm học)
- ✅ Hủy GVCN
- ✅ Gán GVCN khi tạo lớp mới
- ✅ Validation MaGVCN (null, invalid, non-existent)

**Test cases:** 12+ cases

**Test Cases Chi Tiết:**

| ID | Tên Test Case | Input | Expected Output | Priority |
|----|---------------|-------|-----------------|----------|
| TC-GVCN-01 | Gán GVCN hợp lệ | Valid teacher ID | Status 200 | Critical |
| TC-GVCN-02 | Gán GVCN đã phụ trách lớp khác | Conflicted teacher | Status 400, error msg | Critical |
| TC-GVCN-03 | Gán GVCN cho năm học khác | Different year | Status 200 | High |
| TC-GVCN-04 | Gán GVCN với ID null | MaGVCN = null | Status 400 | High |
| TC-GVCN-05 | Gán GVCN với ID không tồn tại | MaGVCN = 999999 | Status 400/404 | High |
| TC-GVCN-06 | Hủy GVCN | DELETE /gvcn | Status 200 | Medium |
| TC-GVCN-07 | Tạo lớp với GVCN conflict | Create + conflict | Status 400 | Critical |

**Validation Logic:**
```sql
-- Kiểm tra GVCN conflict
SELECT * FROM LOP 
WHERE MaGVCN = $1 
  AND MaNamHoc = $2 
  AND MaLop != $3 
LIMIT 1
```

---

### 2.5 Grade Module (grade)
**File test:** `__tests__/grade.test.js` ✅ Mới tạo

**Chức năng kiểm thử:**
- ✅ Lấy bảng điểm lớp-môn
- ✅ Nhập điểm (15p, 1 tiết, thi)
- ✅ Validation điểm (0 ≤ điểm ≤ 10)
- ✅ Tính điểm trung bình môn (công thức)
- ✅ Tính điểm trung bình học kỳ
- ✅ Nhập điểm hàng loạt
- ✅ Lấy bảng điểm cá nhân học sinh

**Test cases:** 25+ cases

**Test Cases Chi Tiết:**

| ID | Tên Test Case | Input | Expected Output | Priority |
|----|---------------|-------|-----------------|----------|
| TC-GRD-01 | Nhập điểm hợp lệ | 0 ≤ điểm ≤ 10 | Status 200/201 | Critical |
| TC-GRD-02 | Nhập điểm âm | Diem = -1 | Status 400 | Critical |
| TC-GRD-03 | Nhập điểm > 10 | Diem = 15 | Status 400 | Critical |
| TC-GRD-04 | Nhập điểm không phải số | Diem = 'abc' | Status 400 | High |
| TC-GRD-05 | Tính điểm TB đúng công thức | Valid grades | Correct average | Critical |
| TC-GRD-06 | Điểm = 0 (edge case) | Diem = 0 | Status 200 | High |
| TC-GRD-07 | Điểm = 10 (edge case) | Diem = 10 | Status 200 | High |
| TC-GRD-08 | Học sinh chưa có điểm | HS with no grades | Empty array / 404 | Medium |
| TC-GRD-09 | Bulk insert điểm | Array of grades | Status 200 | High |
| TC-GRD-10 | Bulk insert có lỗi | Invalid in array | Status 400 | High |

**Công thức điểm trung bình:**
```
ĐTBM = (Tổng 15p + Tổng 1 tiết × 2 + Điểm thi × 3) 
       ÷ (Số điểm 15p + Số điểm 1 tiết × 2 + 3)
```

---

### 2.6 Teaching Assignment Module (giangday)
**File test:** `__tests__/teaching.test.js` ✅ Mới tạo

**Chức năng kiểm thử:**
- ✅ Lấy tất cả phân công (có filter)
- ✅ Tạo phân công mới
- ✅ Tạo nhiều phân công (bulk)
- ✅ Lấy phân công theo giáo viên
- ✅ Lấy phân công theo lớp
- ✅ Kiểm tra quyền nhập điểm
- ✅ Xóa phân công
- ✅ Hiển thị badge GVCN (IsGVCN field)

**Test cases:** 20+ cases

**Test Cases Chi Tiết:**

| ID | Tên Test Case | Input | Expected Output | Priority |
|----|---------------|-------|-----------------|----------|
| TC-TCH-01 | Lấy tất cả phân công | GET /api/giangday | Status 200, array | High |
| TC-TCH-02 | Tạo phân công hợp lệ | Valid assignment | Status 200/201 | Critical |
| TC-TCH-03 | Tạo phân công thiếu thông tin | Incomplete data | Status 400 | High |
| TC-TCH-04 | Duplicate assignment | Same assignment | Status 200 (DO NOTHING) | Medium |
| TC-TCH-05 | Bulk create | Array of assignments | Status 200 | High |
| TC-TCH-06 | Bulk create với array rỗng | Empty array | Status 400 | Medium |
| TC-TCH-07 | Kiểm tra quyền giáo viên | Permission check | hasPermission bool | Critical |
| TC-TCH-08 | Xóa phân công | DELETE | Status 200/404 | High |
| TC-TCH-09 | Badge GVCN hiển thị đúng | GET with GVCN | IsGVCN = true/false | Medium |

---

## III. CHIẾN LƯỢC KIỂM THỬ

### 3.1 Kiểm thử đơn vị (Unit Testing)
**Mục tiêu:** Test từng function riêng lẻ

**Phạm vi:**
- ✅ Controllers (auth, student, class, grade, giangday)
- ✅ Models (database queries)
- ⚠️ Middleware (authMiddleware, validation) - Cần bổ sung
- ⚠️ Utils (semesterUtil, etc.) - Cần bổ sung

**Phương pháp:**
- Sử dụng Jest + Supertest
- Mock database khi cần
- Test cả happy path và error cases

### 3.2 Kiểm thử tích hợp (Integration Testing)
**Mục tiêu:** Test luồng nghiệp vụ từ đầu đến cuối

**Phạm vi:**
- ⚠️ Quy trình nhập điểm (phân công → nhập điểm → tính TB)
- ⚠️ Quy trình quản lý lớp (tạo lớp → gán GVCN → thêm HS)
- ⚠️ Quy trình authentication (đăng ký → đăng nhập → access protected route)

**Trạng thái:** Chưa có test integration đầy đủ

### 3.3 Kiểm thử hệ thống (System Testing)
**Mục tiêu:** Test toàn bộ hệ thống trong môi trường gần giống production

**Phạm vi:**
- ❌ Performance testing (load test)
- ❌ Stress testing (nhiều user đồng thời)
- ❌ Security testing (penetration test)

**Trạng thái:** Chưa thực hiện

### 3.4 Kiểm thử hộp đen (Black-box Testing)
**Mục tiêu:** Test từ góc nhìn người dùng, không quan tâm code bên trong

**Phạm vi:**
- ❌ Manual testing UI/UX
- ❌ User acceptance testing (UAT)
- ❌ Cross-browser testing

**Trạng thái:** Chưa thực hiện

### 3.5 Kiểm thử hộp trắng (White-box Testing)
**Mục tiêu:** Test dựa trên hiểu biết về code

**Phạm vi:**
- ✅ Code coverage analysis
- ✅ Path testing
- ✅ Branch testing

**Trạng thái:** Đang thực hiện với Jest Coverage

---

## IV. TIÊU CHÍ ĐÁNH GIÁ

### 4.1 Code Coverage
**Target:** ≥ 70%

| Module | Coverage Target | Current Status |
|--------|-----------------|----------------|
| auth | 80% | ✅ Đạt |
| student | 75% | ✅ Đạt |
| class | 70% | ⚠️ Cần test |
| grade | 70% | ⚠️ Cần test |
| giangday | 70% | ⚠️ Cần test |
| Overall | 70% | ⚠️ Cần cải thiện |

### 4.2 Test Pass Rate
**Target:** ≥ 95%

- Tất cả test phải pass trước khi merge code
- Không có flaky tests (tests không ổn định)

### 4.3 Performance
**Target:**
- API response time: < 500ms (95th percentile)
- Database query time: < 100ms
- Page load time: < 2s

**Trạng thái:** Chưa có benchmark

---

## V. MÔI TRƯỜNG KIỂM THỬ

### 5.1 Test Database
- **Database:** PostgreSQL (test database riêng)
- **Connection:** `postgres://user:pass@localhost:5432/test_db`
- **Setup:** Chạy migration và seed data trước mỗi test suite
- **Cleanup:** Rollback hoặc truncate tables sau mỗi test

### 5.2 Test Data
**Seed data bao gồm:**
- 10 học sinh mẫu
- 5 lớp học (10A1, 10A2, 10A3, 11A1, 12A1)
- 3 giáo viên (GVBM, GVCN, ADMIN)
- 5 môn học (Toán, Văn, Anh, Lý, Hóa)
- Năm học: 2024-2025
- Học kỳ: 1, 2

---

## VI. LỊCH TRÌNH KIỂM THỬ

### Phase 1: Unit Testing (HOÀN THÀNH)
**Timeline:** Tuần 1-2  
**Status:** ✅ 80% Complete

- ✅ Auth tests
- ✅ Student tests
- ✅ Class tests (mới thêm)
- ✅ GVCN tests (mới thêm)
- ✅ Grade tests (mới thêm)
- ✅ Teaching tests (mới thêm)

### Phase 2: Integration Testing (ĐANG LÀM)
**Timeline:** Tuần 3  
**Status:** ⚠️ 20% Complete

- ⚠️ Auth flow tests
- ⚠️ Grade entry flow tests
- ⚠️ Class management flow tests

### Phase 3: System Testing (KẾ HOẠCH)
**Timeline:** Tuần 4  
**Status:** ❌ Not Started

- ❌ Performance testing
- ❌ Load testing
- ❌ Security testing

### Phase 4: UAT (KẾ HOẠCH)
**Timeline:** Tuần 5  
**Status:** ❌ Not Started

- ❌ Manual testing
- ❌ User feedback
- ❌ Bug fixes

---

## VII. CÔNG CỤ & LỆNH

### 7.1 Chạy Tests
```bash
# Chạy tất cả tests
npm test

# Chạy test cho một file cụ thể
npm test auth.test.js

# Chạy tests với coverage
npm run test:coverage

# Chạy tests ở watch mode (auto-rerun khi file thay đổi)
npm test -- --watch

# Chạy tests với verbose output
npm test -- --verbose
```

### 7.2 Coverage Report
```bash
# Tạo coverage report
npm run test:coverage

# Xem report trên browser
open coverage/lcov-report/index.html
```

### 7.3 Debugging Tests
```bash
# Debug với Node Inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug trong VS Code: thêm vào launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

---

## VIII. BÁO CÁO KẾT QUẢ

### 8.1 Định kỳ hàng tuần
- **Nội dung:**
  - Số test cases mới
  - Test pass rate
  - Code coverage
  - Bugs phát hiện
  - Bugs đã fix

### 8.2 Báo cáo cuối cùng
- **Nội dung:**
  - Tổng kết toàn bộ tests
  - Coverage report chi tiết
  - Danh sách bugs còn tồn đọng
  - Khuyến nghị cải thiện

---

## IX. RỦI RO & GIẢM THIỂU

### 9.1 Rủi ro
1. **Test coverage thấp** → Nhiều bugs bị bỏ sót
2. **Test data không realistic** → Test không phản ánh thực tế
3. **Thiếu integration tests** → Bugs ở tầng kết nối
4. **Không có performance tests** → Hệ thống chậm khi production

### 9.2 Giảm thiểu
1. ✅ Đặt target coverage 70%, theo dõi hàng ngày
2. ⚠️ Tạo seed data realistic hơn
3. ⚠️ Viết thêm integration tests
4. ❌ Setup performance testing tools (Artillery, k6)

---

## X. TÀI LIỆU THAM KHẢO

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Node.js Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#testing)
- [SECURITY_AND_TESTING.md](./SECURITY_AND_TESTING.md)

---

## XI. PHỤ LỤC

### A. Test Case Template
```javascript
describe('Module Name', () => {
    test('Should do something successfully', async () => {
        // Arrange
        const input = { /* test data */ };
        
        // Act
        const response = await request(app)
            .post('/api/endpoint')
            .send(input);
        
        // Assert
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('expectedField');
    });
});
```

### B. Glossary
- **Unit Test:** Test một function/component riêng lẻ
- **Integration Test:** Test tương tác giữa các components
- **E2E Test:** Test toàn bộ flow từ UI đến database
- **Coverage:** % code được test
- **Flaky Test:** Test có kết quả không ổn định

---

**Phê duyệt:**

| Vai trò | Tên | Ngày | Chữ ký |
|---------|-----|------|--------|
| Developer | | | |
| QA Lead | | | |
| Project Manager | | | |
