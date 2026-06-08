const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all orders
    router.get(['/', '/order'], (req, res) => {
        const query = `
            SELECT
                orders.order_id,
                orders.session_id,
                service_sessions.session_type,
                service_sessions.table_number,
                orders.staff_id,
                staff.first_name,
                staff.last_name,
                orders.ordered_at,
                orders.status
            FROM orders
            LEFT JOIN service_sessions ON orders.session_id = service_sessions.session_id
            LEFT JOIN staff ON orders.staff_id = staff.staff_id
        `;

        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD order
    router.post(['/', '/order'], (req, res) => {
        const { session_id, staff_id, status } = req.body;
        const query = 'INSERT INTO orders (session_id, staff_id, status) VALUES (?, ?, ?)';

        pool.query(query, [session_id, staff_id, status], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: 'Order added successfully!',
                order_id: result.insertId
            });
        });
    });

    // UPDATE order
    router.put(['/:id', '/order/:id'], (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid order id' });
        }

        const { session_id, staff_id, status } = req.body;
        const query = 'UPDATE orders SET session_id = ?, staff_id = ?, status = ? WHERE order_id = ?';

        pool.query(query, [session_id, staff_id, status, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json({ message: 'Order updated successfully!' });
        });
    });

    // DELETE order
    router.delete(['/:id', '/order/:id'], (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid order id' });
        }

        const query = 'DELETE FROM orders WHERE order_id = ?';

        pool.query(query, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json({ message: 'Order deleted successfully!' });
        });
    });

    return router;
};
