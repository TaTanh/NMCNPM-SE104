const express = require('express');
const path = require('path');

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

app.use('/api/students', studentsRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportsRoutes);

// Trang mặc định: tự mở login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/pages/login.html'));
});

// Chạy server ở port 3000
app.listen(3000, () => {
  console.log('Server đang chạy tại http://localhost:3000');
});
