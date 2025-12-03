const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',        // tên user mặc định PostgreSQL
    host: 'localhost',
    database: 'QLHS', 
    password: '123456', 
    port: 5432               // cổng mặc định PostgreSQL
});

module.exports = pool;
