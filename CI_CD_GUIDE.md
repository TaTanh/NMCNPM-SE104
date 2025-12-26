# HƯỚNG DẪN SETUP CI/CD (GitHub Actions)

## ✅ ĐÃ SETUP XONG

Tôi đã setup GitHub Actions cho project. Bây giờ mỗi khi bạn push code lên GitHub, hệ thống sẽ tự động:
1. ✅ Chạy tất cả tests
2. ✅ Tạo coverage report
3. ✅ Hiển thị kết quả ngay trên GitHub

---

## 📋 CÁC FILE ĐÃ TẠO

1. **`.github/workflows/test.yml`** - GitHub Actions workflow
2. **README.md đã được cập nhật** - Thêm badges và hướng dẫn CI

---

## 🚀 CÁCH SỬ DỤNG

### **Bước 1: Push code lên GitHub**

```bash
# Thêm tất cả files mới
git add .

# Commit với message
git commit -m "Add CI/CD with GitHub Actions and test cases"

# Push lên GitHub
git push origin main
```

**Lưu ý:** Thay `main` bằng `master` hoặc `develop` nếu bạn dùng branch khác.

---

### **Bước 2: Xem kết quả CI**

1. Vào repository của bạn trên GitHub: `https://github.com/TaTanh/NMCNPM-SE104`
2. Click vào tab **"Actions"**
3. Bạn sẽ thấy workflow "Run Tests" đang chạy (màu vàng 🟡) hoặc đã hoàn thành:
   - ✅ **Green checkmark** = Tests PASS
   - ❌ **Red X** = Tests FAIL

4. Click vào workflow để xem chi tiết:
   - Logs của từng bước (Setup Node.js, Install dependencies, Run tests...)
   - Kết quả tests
   - Coverage report

---

### **Bước 3: Sửa badge URL trong README**

Hiện tại badge trong README có URL placeholder. Bạn cần sửa lại:

**Mở file README.md, dòng 3:**

```markdown
![Tests](https://github.com/YOURNAME/YOURREPO/workflows/Run%20Tests/badge.svg)
```

**Sửa thành:**

```markdown
![Tests](https://github.com/TaTanh/NMCNPM-SE104/workflows/Run%20Tests/badge.svg)
```

**Lưu và push:**

```bash
git add README.md
git commit -m "Update CI badge URL"
git push
```

---

## 🎯 WORKFLOW HOẠT ĐỘNG NHƯ THẾ NÀO?

### **Trigger (Kích hoạt)**
Workflow tự động chạy khi:
- ✅ Push code lên branch `main`, `master`, hoặc `develop`
- ✅ Tạo Pull Request vào các branch trên

### **Jobs (Công việc)**

1. **Setup PostgreSQL**
   - Tạo test database
   - User: `postgres`
   - Password: `postgres`
   - Database: `test_db`

2. **Setup Node.js 18**
   - Cài đặt Node.js version 18
   - Cache npm dependencies (tăng tốc độ)

3. **Install Dependencies**
   - Chạy `npm ci` (nhanh hơn `npm install`)

4. **Run Tests**
   - Chạy `npm test`
   - Sử dụng test database
   - Environment variables:
     - `NODE_ENV=test`
     - `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db`
     - `JWT_SECRET=test_secret_key_for_ci`

5. **Generate Coverage**
   - Chạy `npm run test:coverage`
   - Upload coverage artifacts lên GitHub

---

## 📊 XEM COVERAGE REPORT

### **Cách 1: Trong CI logs**
1. Vào tab "Actions"
2. Click vào workflow run
3. Click vào job "Test on Node.js"
4. Scroll xuống phần "Generate coverage report"

### **Cách 2: Download artifacts**
1. Vào workflow run
2. Scroll xuống phần "Artifacts"
3. Download "coverage-report.zip"
4. Extract và mở `index.html` trong browser

---

## 🔧 TROUBLESHOOTING

### **Vấn đề 1: Tests fail trên CI nhưng pass ở local**

**Nguyên nhân:** 
- Khác biệt môi trường (database, env vars...)
- Tests phụ thuộc vào data có sẵn ở local

**Giải pháp:**
1. Kiểm tra logs trong CI để xem lỗi cụ thể
2. Đảm bảo tests không phụ thuộc vào data cố định
3. Setup proper test database seeding

---

### **Vấn đề 2: Workflow không chạy**

**Nguyên nhân:** 
- Workflow file sai cú pháp
- Branch name không đúng

**Giải pháp:**
1. Kiểm tra file `.github/workflows/test.yml` có đúng format
2. Đảm bảo branch name trong workflow khớp với branch bạn đang push:
   ```yaml
   on:
     push:
       branches: [ main, master, develop ]  # Sửa lại nếu cần
   ```

---

### **Vấn đề 3: Database connection failed**

**Nguyên nhân:** 
- PostgreSQL service chưa ready
- Connection string sai

**Giải pháp:**
- Workflow đã có health check cho PostgreSQL
- Nếu vẫn lỗi, tăng `health-interval` trong file workflow

---

## 🎨 TÙY CHỈNH WORKFLOW

### **Chạy tests trên nhiều Node.js versions**

Sửa file `.github/workflows/test.yml`:

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [16, 18, 20]
    
    steps:
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
```

### **Thêm notification khi tests fail**

Thêm vào cuối file workflow:

```yaml
      - name: Notify on failure
        if: failure()
        run: echo "Tests failed! Please check the logs."
```

---

## 📈 NÂNG CAO: THÊM CODE QUALITY CHECKS

### **1. ESLint (Kiểm tra code style)**

Thêm vào workflow:

```yaml
      - name: Run ESLint
        run: npm run lint
```

### **2. Security Audit**

Thêm vào workflow:

```yaml
      - name: Security audit
        run: npm audit --audit-level=moderate
```

---

## 🔐 BẢO MẬT

### **Secrets trong CI**

Nếu cần thêm sensitive data (API keys, passwords...):

1. Vào GitHub → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Thêm secret (ví dụ: `DATABASE_PASSWORD`)
4. Sử dụng trong workflow:

```yaml
env:
  DB_PASSWORD: ${{ secrets.DATABASE_PASSWORD }}
```

**Lưu ý:** KHÔNG BAO GIỜ hard-code secrets trong code!

---

## ✨ KẾT QUẢ CUỐI CÙNG

Sau khi setup xong, bạn sẽ có:

1. ✅ **Badge đẹp trong README**
   - ![Tests](https://github.com/TaTanh/NMCNPM-SE104/workflows/Run%20Tests/badge.svg)
   - Hiển thị status: passing/failing

2. ✅ **Auto tests mỗi lần push**
   - Không cần nhớ chạy `npm test` thủ công
   - Phát hiện bugs sớm

3. ✅ **Coverage report**
   - Biết được % code đã được test
   - Tìm ra phần code chưa test

4. ✅ **Professional portfolio**
   - Chứng minh bạn biết CI/CD
   - Tăng điểm trong mắt recruiters

---

## 📚 TÀI LIỆU THAM KHẢO

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions for Node.js](https://docs.github.com/en/actions/automating-builds-and-tests/building-and-testing-nodejs)
- [Testing Best Practices](https://github.com/goldbergyoni/nodebestpractices#testing)

---

**Setup by:** Development Team  
**Date:** 26/12/2025  
**Version:** 1.0
