const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// We will pass the database pool from server.js to here
module.exports = (pool) => {

    const splitName = (value = "") => {
        const parts = String(value).trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) {
            return { firstName: "", lastName: "" };
        }

        if (parts.length === 1) {
            return { firstName: parts[0], lastName: "" };
        }

        return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
    };

    // GET all staff
    router.get('/', (req, res) => {
        const query = `
            SELECT
                staff_id as staffId,
                staff_id as id,
                first_name as firstName,
                last_name as lastName,
                CONCAT(first_name, ' ', last_name) as name,
                role,
                phone,
                username
            FROM staff
        `;
        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // Basic CRUD for the frontend staff page
    router.post('/', (req, res) => {
        const {
            name,
            firstName: bodyFirstName,
            lastName: bodyLastName,
            role = 'employee',
            phone = null,
            username,
            password = 'password'
        } = req.body;
        const split = splitName(name);
        const firstName = bodyFirstName ?? split.firstName;
        const lastName = bodyLastName ?? split.lastName;
        const finalUsername = username || `${firstName || 'staff'}_${Date.now()}`;
        const normalizedRole = role === 'ເຈົ້າຂອງ' ? 'manager' : role;

        const query = 'INSERT INTO staff (first_name, last_name, role, username, password, phone) VALUES (?, ?, ?, ?, ?, ?)';
        pool.query(query, [firstName, lastName, normalizedRole, finalUsername, password, phone], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: 'Staff created successfully!',
                id: result.insertId,
                staffId: result.insertId,
                staff_id: result.insertId,
                firstName,
                lastName,
                name: `${firstName} ${lastName}`.trim(),
                username: finalUsername
            });
        });
    });

    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const {
            name,
            firstName: bodyFirstName,
            lastName: bodyLastName,
            role = 'employee',
            phone = null,
            username,
            password
        } = req.body;
        const split = splitName(name);
        const firstName = bodyFirstName ?? split.firstName;
        const lastName = bodyLastName ?? split.lastName;
        const normalizedRole = role === 'ເຈົ້າຂອງ' ? 'manager' : role;

        const query = password
            ? 'UPDATE staff SET first_name = ?, last_name = ?, role = ?, username = COALESCE(?, username), phone = ?, password = ? WHERE staff_id = ?'
            : 'UPDATE staff SET first_name = ?, last_name = ?, role = ?, username = COALESCE(?, username), phone = ? WHERE staff_id = ?';
        const values = password
            ? [firstName, lastName, normalizedRole, username || null, phone, password, id]
            : [firstName, lastName, normalizedRole, username || null, phone, id];

        pool.query(query, values, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Staff not found' });
            }
            res.json({ message: 'Staff updated successfully!' });
        });
    });

    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        const query = 'DELETE FROM staff WHERE staff_id = ?';

        pool.query(query, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Staff not found' });
            }
            res.json({ message: 'Staff deleted successfully!' });
        });
    });

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
