const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('./config/db');

const app = express();

// ========== DATABASE INITIALIZATION ==========
async function initializeDatabase() {
    try {
        // Check if tables exist
        const result = await pool.query(
            "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'NAMHOC')"
        );
        
        if (!result.rows[0].exists) {
            console.log('Initializing database schema...');
            const initPath = path.join(__dirname, '../database/init.sql');
            const initSQL = fs.readFileSync(initPath, 'utf-8');
            await pool.query(initSQL);
            console.log('Database schema initialized');
        }
        
        // Check if NAMHOC has data
        const checkData = await pool.query('SELECT COUNT(*) as cnt FROM NAMHOC');
        if (parseInt(checkData.rows[0].cnt) === 0) {
            console.log('Seeding database with initial data...');
            const seedPath = path.join(__dirname, '../database/seed.sql');
            const seedSQL = fs.readFileSync(seedPath, 'utf-8');
            await pool.query(seedSQL);
            console.log('Database seeded with data');
        }
        
        // Verify key tables
        const stats = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM NAMHOC) as namhoc_count,
                (SELECT COUNT(*) FROM HOCKY) as hocky_count,
                (SELECT COUNT(*) FROM KHOILOP) as khoilop_count,
                (SELECT COUNT(*) FROM LOP) as lop_count,
                (SELECT COUNT(*) FROM HOCSINH) as hocsinh_count
        `);
        
        console.log('Database Statistics:');
        console.log(`   - NAMHOC: ${stats.rows[0].namhoc_count} records`);
        console.log(`   - HOCKY: ${stats.rows[0].hocky_count} records`);
        console.log(`   - KHOILOP: ${stats.rows[0].khoilop_count} records`);
        console.log(`   - LOP: ${stats.rows[0].lop_count} records`);
        console.log(`   - HOCSINH: ${stats.rows[0].hocsinh_count} records`);
        
    } catch (err) {
        console.error('Database initialization warning:', err.message);
        // Don't exit - server can still run
    }
}

// Initialize database on startup
initializeDatabase().then(() => {
    console.log('Database ready for use');
});

// Middleware parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cho phép truy cập thư mục public như web root
app.use(express.static(path.join(__dirname, '../public')));

// ========== API ROUTES ==========
const { normalizeHocKyMiddleware } = require('./middleware/semesterMiddleware');
const studentRoutes = require('./routes/studentRoutes');
const classRoutes = require('./routes/classRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const gradeRoutes = require('./routes/gradeRoutes');
const settingRoutes = require('./routes/settingRoutes');
const reportRoutes = require('./routes/reportRoutes');
const authRoutes = require('./routes/authRoutes');
const hanhkiemRoutes = require('./routes/hanhkiemRoutes');
const giangdayRoutes = require('./routes/giangdayRoutes');
const teachingAssignmentRoutes = require('./routes/teachingAssignmentRoutes');

app.use(normalizeHocKyMiddleware);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/hanhkiem', hanhkiemRoutes);
app.use('/api/giangday', giangdayRoutes);
app.use('/api/teaching-assignments', teachingAssignmentRoutes);

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
