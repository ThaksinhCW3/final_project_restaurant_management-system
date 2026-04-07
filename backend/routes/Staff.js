const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// We will pass the database pool from server.js to here
module.exports = (pool) => {
    
    // Staff register route
    router.post('/register', async (req, res) => {
        const {first_name, last_name, role, username, password, phone } = req.body;
        try {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const query = 'INSERT INTO staff (first_name, last_name, role, username, password, phone) VALUES (?, ?, ?, ?, ?, ?)';
            pool.query(query, [first_name, last_name, role, username, hashedPassword, phone ], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "Username already exists"});
                    return res.status(500).json({ error: err.message});
                }
                res.status(201).json({ message: "Staff registered successfully!"});
            });
        } catch (err) {
            res.status(500).json({ error: err.message});
        }
    });

    // Staff login route
    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        const query = 'SELECT * FROM staff WHERE username = ?';
        
        pool.query(query, [username], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(401).json({ error: "Invalid username or password"});

            const staff = results[0];
            const isMatch = await bcrypt.compare(password, staff.password);
            if (!isMatch) return res.status(401).json({ error: "Invalid username or password"});

            const token = jwt.sign(
                { staff_id: staff.staff_id, role: staff.role}, 
                process.env.JWT_SECRET, 
                {expiresIn: '1d'}
            );

            res.json({
                message: "Login Successful!",
                token,
                staff: { id: staff.staff_id, name: staff.first_name, role: staff.role }
            });
        });
    });

    return router;
};