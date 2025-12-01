const express = require('express');
const path = require('path');
const pool = require('./db');

const app = express();

// Middleware parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cho phép truy cập thư mục public như web root
app.use(express.static(path.join(__dirname, 'public')));

// ========== API ROUTES ==========
const studentsRoutes = require('./routes/students');
const classesRoutes = require('./routes/classes');
const subjectsRoutes = require('./routes/subjects');
const gradesRoutes = require('./routes/grades');
const settingsRoutes = require('./routes/settings');
const reportsRoutes = require('./routes/reports');
const authRoutes = require('./routes/auth');

app.use('/api/students', studentsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/auth', authRoutes);

// ========== DASHBOARD STATS API ==========
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const studentsResult = await pool.query('SELECT COUNT(*) as count FROM HOCSINH');
        const classesResult = await pool.query('SELECT COUNT(*) as count FROM LOP');
        const subjectsResult = await pool.query('SELECT COUNT(*) as count FROM MONHOC');
        
        res.json({
            students: parseInt(studentsResult.rows[0].count) || 0,
            classes: parseInt(classesResult.rows[0].count) || 0,
            subjects: parseInt(subjectsResult.rows[0].count) || 0,
            teachers: 0 // Chưa có bảng giáo viên
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ error: 'Lỗi lấy thống kê' });
    }
});

// Trang mặc định: tự mở login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/login.html'));
});

// Chạy server ở port 3000
app.listen(3000, () => {
  console.log('Server đang chạy tại http://localhost:3000/pages/login.html');
});
