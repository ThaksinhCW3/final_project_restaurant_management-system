const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all imports
    router.get('/', (req, res) => {
        const query = `
        SELECT 
        sales.sales_id AS salesId,
        sales.sales_id AS sale_id,
        sales.session_id AS sessionId,
        sales.session_id AS session_id,
        sales.total_amount AS totalAmount,
        sales.total_amount AS total_amount,
        sales.paid_at AS paidAt,
        sales.paid_at AS paid_at
        FROM sales
        JOIN service_sessions ON sales.session_id = service_sessions.session_id`
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
        const { session_id, sessionId, paid_at, paidAt, total_amount, totalAmount } = req.body;
        const finalSessionId = session_id ?? sessionId ?? null;
        const finalPaidAt = paid_at ?? paidAt ?? new Date().toISOString().slice(0, 19).replace('T', ' ');
        const finalTotalAmount = total_amount ?? totalAmount ?? 0;
        const query = `
            INSERT INTO sales (session_id, paid_at, total_amount) VALUES (?, ?, ?)
        `;
        pool.query(query, [finalSessionId, finalPaidAt, finalTotalAmount], (err, result) => {
            if (err) {
                console.error('Error adding sale:', err);
                res.status(500).json({ error: 'Failed to add sale' });
                return;
            }
            res.status(201).json({
                message: 'Sale added successfully',
                salesId: result.insertId,
                sale_id: result.insertId,
                sessionId: finalSessionId,
                totalAmount: finalTotalAmount,
                paidAt: finalPaidAt
            });
        });
    });

    // UPDATE sale
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { session_id, sessionId, paid_at, paidAt, total_amount, totalAmount } = req.body;
        const finalSessionId = session_id ?? sessionId ?? null;
        const finalPaidAt = paid_at ?? paidAt ?? new Date().toISOString().slice(0, 19).replace('T', ' ');
        const finalTotalAmount = total_amount ?? totalAmount ?? 0;
        const query = `
            UPDATE sales SET session_id = ?, paid_at = ?, total_amount = ? WHERE sales_id = ?`;
        pool.query(query, [finalSessionId, finalPaidAt, finalTotalAmount, id], (err, result) => {
            if (err) {
                console.error('Error updating sale:', err);
                res.status(500).json({ error: 'Failed to update sale' });
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Sale not found' });
                return;
            }
            res.json({
                message: 'Sale updated successfully',
                salesId: Number(id),
                sessionId: finalSessionId,
                totalAmount: finalTotalAmount,
                paidAt: finalPaidAt
            });
        });
    });

    // DELETE sale
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        const query = `DELETE FROM sales WHERE sales_id = ?`;
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
