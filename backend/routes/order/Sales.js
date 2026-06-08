const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all imports
    router.get('/', (req, res) => {
        const query = `
        SELECT 
        sales.sale_id,
        sales.session_id,
        sales.total_amount,
        sales.paid_at
        FROM sales
        JOIN service_sessions ON sales.session_id = service_sessions.service_session_id`
        pool.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching sales:', err);
                res.status(500).json({ error: 'Failed to fetch sales' });
                return;
            }
            res.json(results);
        });
    });

    // ADD sale
    router.post('/', (req, res) => {
        const { session_id, paid_at, total_amount } = req.body;
        const query = `
            INSERT INTO sales (session_id, paid_at, total_amount) VALUES (?, ?, ?)
        `;
        pool.query(query, [session_id, paid_at, total_amount], (err, result) => {
            if (err) {
                console.error('Error adding sale:', err);
                res.status(500).json({ error: 'Failed to add sale' });
                return;
            }
            res.status(201).json({ message: 'Sale added successfully', saleId: result.insertId });
        });
    });

    // UPDATE sale
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { session_id, paid_at, total_amount } = req.body;
        const query = `
            UPDATE sales SET session_id = ?, paid_at = ?, total_amount = ? WHERE sale_id = ?`;
        pool.query(query, [session_id, paid_at, total_amount, id], (err, result) => {
            if (err) {
                console.error('Error updating sale:', err);
                res.status(500).json({ error: 'Failed to update sale' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Sale not found' });
                return;
            }
            res.json({ message: 'Sale updated successfully' });
        });
    });

    // DELETE sale
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        const query = `DELETE FROM sales WHERE sale_id = ?`;
        pool.query(query, [id], (err, result) => {
            if (err) {
                console.error('Error deleting sale:', err);
                res.status(500).json({ error: 'Failed to delete sale' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Sale not found' });
                return;
            }
            res.json({ message: 'Sale deleted successfully' });
        });
    });

    return router;
}