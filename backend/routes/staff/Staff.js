const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// We will pass the database pool from server.js to here
module.exports = (pool) => {
    const jwtSecret = process.env.JWT_SECRET || 'restaurant-local-dev-secret';

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

    const normalizeRole = (role) =>
        role === 'ເຈົ້າຂອງ' || role === 'admin' || role === 'manager'
            ? 'manager'
            : 'employee';

    const requireAdmin = (req, res, next) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ')
            ? authHeader.slice(7)
            : null;

        if (!token) {
            return res.status(401).json({ error: 'Login required' });
        }

        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) return res.status(401).json({ error: 'Invalid login' });
            if (user.role !== 'manager') {
                return res.status(403).json({ error: 'Admin only' });
            }
            req.user = user;
            next();
        });
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
    router.post('/', requireAdmin, async (req, res) => {
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
        const normalizedRole = normalizeRole(role);

        try {
            const hashedPassword = await bcrypt.hash(String(password || 'password'), 10);
            const query = 'INSERT INTO staff (first_name, last_name, role, username, password, phone) VALUES (?, ?, ?, ?, ?, ?)';
            pool.query(query, [firstName, lastName, normalizedRole, finalUsername, hashedPassword, phone], (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
                    return res.status(500).json({ error: err.message });
                }
                res.status(201).json({
                    message: 'Staff created successfully!',
                    id: result.insertId,
                    staffId: result.insertId,
                    staff_id: result.insertId,
                    firstName,
                    lastName,
                    name: `${firstName} ${lastName}`.trim(),
                    role: normalizedRole,
                    phone,
                    username: finalUsername
                });
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.put('/:id', requireAdmin, async (req, res) => {
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
        const normalizedRole = normalizeRole(role);

        try {
            const hashedPassword = password ? await bcrypt.hash(String(password), 10) : null;
            const query = hashedPassword
                ? 'UPDATE staff SET first_name = ?, last_name = ?, role = ?, username = COALESCE(?, username), phone = ?, password = ? WHERE staff_id = ?'
                : 'UPDATE staff SET first_name = ?, last_name = ?, role = ?, username = COALESCE(?, username), phone = ? WHERE staff_id = ?';
            const values = hashedPassword
                ? [firstName, lastName, normalizedRole, username || null, phone, hashedPassword, id]
                : [firstName, lastName, normalizedRole, username || null, phone, id];

            pool.query(query, values, (err, result) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Username already exists' });
                    return res.status(500).json({ error: err.message });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Staff not found' });
                }
                res.json({ message: 'Staff updated successfully!' });
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.delete('/:id', requireAdmin, (req, res) => {
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

    // Staff login route
    router.post('/login', (req, res) => {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({ error: "Username and password are required" });
        }

        const query = 'SELECT * FROM staff WHERE username = ?';
        
        pool.query(query, [username], async (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) return res.status(401).json({ error: "Invalid username or password"});

            const staff = results[0];
            const storedPassword = String(staff.password || '');
            const isHash = storedPassword.startsWith('$2');
            const isMatch = isHash
                ? await bcrypt.compare(password, storedPassword)
                : password === storedPassword;
            if (!isMatch) return res.status(401).json({ error: "Invalid username or password"});

            const token = jwt.sign(
                { staff_id: staff.staff_id, role: staff.role}, 
                jwtSecret, 
                {expiresIn: '1d'}
            );

            res.json({
                message: "Login Successful!",
                token,
                staff: {
                    id: staff.staff_id,
                    name: `${staff.first_name} ${staff.last_name || ''}`.trim(),
                    role: staff.role,
                    username: staff.username
                }
            });
        });
    });

    return router;
};
