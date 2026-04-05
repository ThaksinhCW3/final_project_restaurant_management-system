const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to the MySQL database.');
    connection.release();
});

// Route to get all menu items
app.get('/api/menus', (req, res) => {
    pool.query('SELECT * FROM menus', (err, results) =>{
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));