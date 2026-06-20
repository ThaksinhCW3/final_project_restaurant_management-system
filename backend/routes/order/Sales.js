const express = require('express');
const router = express.Router();
const {
    deductStockForRequirements,
    findShortages,
    getSessionOrderItems,
    getStockRequirements,
    stockShortagePayload,
} = require('../../utils/recipeStock');

const toMysqlDateTime = (value) => {
    if (!value) return new Date().toISOString().slice(0, 19).replace('T', ' ');

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value).includes('T') ? String(value).slice(0, 19).replace('T', ' ') : value;
    }

    return parsed.toISOString().slice(0, 19).replace('T', ' ');
};

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
        const finalSessionId = Number(session_id ?? sessionId ?? null);
        const finalPaidAt = toMysqlDateTime(paid_at ?? paidAt ?? null);
        const finalTotalAmount = Number(total_amount ?? totalAmount ?? 0) || 0;

        if (!Number.isInteger(finalSessionId) || finalSessionId <= 0) {
            return res.status(400).json({ message: 'Invalid service session id' });
        }

        pool.getConnection((connErr, connection) => {
            if (connErr) return res.status(500).json({ error: connErr.message });

            connection.beginTransaction((txErr) => {
                if (txErr) {
                    connection.release();
                    return res.status(500).json({ error: txErr.message });
                }

                const rollback = (err) => {
                    connection.rollback(() => {
                        connection.release();
                        console.error('Error adding sale:', err);
                        res.status(500).json({ error: 'Failed to add sale' });
                    });
                };

                const rollbackWith = (statusCode, payload) => {
                    connection.rollback(() => {
                        connection.release();
                        res.status(statusCode).json(payload);
                    });
                };

                connection.query(
                    'SELECT sales_id, paid_at, total_amount FROM sales WHERE session_id = ? LIMIT 1',
                    [finalSessionId],
                    (existingErr, existingSales) => {
                        if (existingErr) return rollback(existingErr);

                        if (existingSales.length > 0) {
                            return connection.commit((commitErr) => {
                                connection.release();
                                if (commitErr) return res.status(500).json({ error: commitErr.message });

                                const existing = existingSales[0];
                                res.status(200).json({
                                    message: 'Sale already exists',
                                    salesId: existing.sales_id,
                                    sale_id: existing.sales_id,
                                    sessionId: finalSessionId,
                                    session_id: finalSessionId,
                                    totalAmount: existing.total_amount,
                                    total_amount: existing.total_amount,
                                    paidAt: existing.paid_at,
                                    paid_at: existing.paid_at,
                                });
                            });
                        }

                        getSessionOrderItems(connection, finalSessionId, (itemsErr, orderItems) => {
                            if (itemsErr) return rollback(itemsErr);

                            getStockRequirements(connection, orderItems, { lock: true }, (stockErr, requirements) => {
                                if (stockErr) return rollback(stockErr);

                                const shortages = findShortages(requirements);
                                if (shortages.length > 0) {
                                    return rollbackWith(409, stockShortagePayload(shortages));
                                }

                                deductStockForRequirements(connection, requirements, (deductErr) => {
                                    if (deductErr) return rollback(deductErr);

                                    const query = `
                                        INSERT INTO sales (session_id, paid_at, total_amount) VALUES (?, ?, ?)
                                    `;
                                    connection.query(query, [finalSessionId, finalPaidAt, finalTotalAmount], (insertErr, result) => {
                                        if (insertErr) return rollback(insertErr);

                                        connection.commit((commitErr) => {
                                            connection.release();
                                            if (commitErr) return res.status(500).json({ error: commitErr.message });

                                            res.status(201).json({
                                                message: 'Sale added successfully',
                                                salesId: result.insertId,
                                                sale_id: result.insertId,
                                                sessionId: finalSessionId,
                                                session_id: finalSessionId,
                                                totalAmount: finalTotalAmount,
                                                total_amount: finalTotalAmount,
                                                paidAt: finalPaidAt,
                                                paid_at: finalPaidAt
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    },
                );
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
