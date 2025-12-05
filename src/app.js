const express = require('express');
const path = require('path');

const app = express();

// Middleware parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cho phép truy cập thư mục public như web root
app.use(express.static(path.join(__dirname, '../public')));

// ========== API ROUTES ==========
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const settingRoutes = require('./routes/settingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const hanhkiemRoutes = require('./routes/hanhkiemRoutes');
const giangdayRoutes = require('./routes/giangdayRoutes');

app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/hanhkiem', hanhkiemRoutes);
app.use('/api/giangday', giangdayRoutes);

// ========== DASHBOARD STATS API ==========
const reportController = require('./controllers/reportController');
app.get('/api/dashboard/stats', reportController.getDashboardStats);

// Trang mặc định: tự mở login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/pages/login.html'));
});

// Chạy server ở port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}/pages/login.html`);
});

module.exports = app;
