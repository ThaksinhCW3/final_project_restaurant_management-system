const express = require('express');
const router = express.Router();
const {
    findShortages,
    getStockRequirements,
    normalizeItems,
    stockShortagePayload,
} = require('../../utils/recipeStock');

const toMysqlDateTime = (value) => {
    if (!value) return null;

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return String(value).includes('T') ? String(value).slice(0, 19).replace('T', ' ') : value;
    }

    return parsed.toISOString().slice(0, 19).replace('T', ' ');
};

const normalizeStatus = (value) => {
    if (value === 'PendingPayment' || value === 'pending_payment') return 'PendingPayment';
    if (value === 'Completed') return 'Completed';
    return 'Active';
};

const resolveStaffId = (pool, staffId, callback) => {
    if (staffId === null || staffId === undefined || staffId === '') {
        callback(null, null);
        return;
    }

    const numericStaffId = Number(staffId);
    if (!Number.isInteger(numericStaffId) || numericStaffId <= 0) {
        callback(null, null);
        return;
    }

    pool.query('SELECT staff_id FROM staff WHERE staff_id = ? LIMIT 1', [numericStaffId], (err, rows) => {
        if (err) return callback(err);
        callback(null, rows.length > 0 ? numericStaffId : null);
    });
};

module.exports = (pool) => {
    // GET all service sessions
    router.get('/', (req, res) => {
        const query = `
            SELECT
                service_sessions.session_id AS sessionId,
                service_sessions.session_id AS session_id,
                service_sessions.session_type AS sessionType,
                service_sessions.session_type AS session_type,
                service_sessions.note,
                service_sessions.table_number AS tableNumber,
                service_sessions.table_number AS table_number,
                service_sessions.staff_id AS staffId,
                service_sessions.staff_id AS staff_id,
                staff.first_name AS firstName,
                staff.last_name AS lastName,
                service_sessions.started_at AS startedAt,
                service_sessions.started_at AS started_at,
                service_sessions.ended_at AS endedAt,
                service_sessions.ended_at AS ended_at,
                service_sessions.status
            FROM service_sessions
            LEFT JOIN staff ON service_sessions.staff_id = staff.staff_id
        `;

        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD service session
    router.post('/', (req, res) => {
        const {
            session_type,
            sessionType,
            note,
            table_number,
            tableNumber,
            staff_id,
            staffId,
            ended_at,
            endedAt,
            status
        } = req.body;
        const finalSessionType = session_type ?? sessionType ?? 'dine-in';
        const finalNote = note ?? '';
        const finalTableNumber = table_number ?? tableNumber ?? null;
        const rawStaffId = staff_id ?? staffId ?? null;
        const finalEndedAt = toMysqlDateTime(ended_at ?? endedAt ?? null);
        const finalStatus = normalizeStatus(status);
        const query = `
            INSERT INTO service_sessions
                (session_type, note, table_number, staff_id, ended_at, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        resolveStaffId(pool, rawStaffId, (staffErr, finalStaffId) => {
            if (staffErr) return res.status(500).json({ error: staffErr.message });

            pool.query(query, [finalSessionType, finalNote, finalTableNumber, finalStaffId, finalEndedAt, finalStatus], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                res.status(201).json({
                    message: 'Service session added successfully!',
                    sessionId: result.insertId,
                    session_id: result.insertId,
                    sessionType: finalSessionType,
                    session_type: finalSessionType,
                    note: finalNote,
                    tableNumber: finalTableNumber,
                    table_number: finalTableNumber,
                    staffId: finalStaffId,
                    staff_id: finalStaffId,
                    endedAt: finalEndedAt,
                    ended_at: finalEndedAt,
                    status: finalStatus
                });
            });
        });
    });

    // UPDATE service session
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid service session id' });
        }

        const {
            session_type,
            sessionType,
            note,
            table_number,
            tableNumber,
            staff_id,
            staffId,
            ended_at,
            endedAt,
            status
        } = req.body;
        const finalSessionType = session_type ?? sessionType ?? 'dine-in';
        const finalNote = note ?? '';
        const finalTableNumber = table_number ?? tableNumber ?? null;
        const rawStaffId = staff_id ?? staffId ?? null;
        const finalEndedAt = toMysqlDateTime(ended_at ?? endedAt ?? null);
        const finalStatus = normalizeStatus(status);
        const query = `
            UPDATE service_sessions
            SET session_type = ?, note = ?, table_number = ?, staff_id = ?, ended_at = ?, status = ?
            WHERE session_id = ?
        `;

        resolveStaffId(pool, rawStaffId, (staffErr, finalStaffId) => {
            if (staffErr) return res.status(500).json({ error: staffErr.message });

            pool.query(query, [finalSessionType, finalNote, finalTableNumber, finalStaffId, finalEndedAt, finalStatus, id], (err, result) => {
                if (err) return res.status(500).json({ error: err.message });
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Service session not found' });
                }
                res.json({
                    message: 'Service session updated successfully!',
                    sessionId: Number(id),
                    sessionType: finalSessionType,
                    note: finalNote,
                    tableNumber: finalTableNumber,
                    staffId: finalStaffId,
                    endedAt: finalEndedAt,
                    status: finalStatus
                });
            });
        });
    });

    // Replace all items for a QR bill/session.
    router.put('/:id/items', (req, res) => {
        const { id } = req.params;
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        const cleaned = normalizeItems(items);

        if (!Number.isInteger(Number(id))) {
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
                        res.status(500).json({ error: err.message });
                    });
                };

                const rollbackWith = (statusCode, payload) => {
                    connection.rollback(() => {
                        connection.release();
                        res.status(statusCode).json(payload);
                    });
                };

                const saveValidatedItems = () => {
                    connection.query('SELECT order_id, status FROM orders WHERE session_id = ? ORDER BY order_id LIMIT 1', [id], (selectErr, orders) => {
                        if (selectErr) return rollback(selectErr);

                        const saveItems = (orderId) => {
                            connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId], (deleteErr) => {
                                if (deleteErr) return rollback(deleteErr);

                                if (cleaned.length === 0) {
                                    return connection.commit((commitErr) => {
                                        connection.release();
                                        if (commitErr) return res.status(500).json({ error: commitErr.message });
                                        res.json({ message: 'Session items saved successfully!', order_id: orderId, items: [] });
                                    });
                                }

                                const values = cleaned.map((item) => [orderId, item.menuId, item.quantity, item.note ?? '']);
                                connection.query('INSERT INTO order_items (order_id, menu_id, quantity, note) VALUES ?', [values], (insertErr) => {
                                    if (insertErr) return rollback(insertErr);

                                    connection.commit((commitErr) => {
                                        connection.release();
                                        if (commitErr) return res.status(500).json({ error: commitErr.message });
                                        res.json({
                                            message: 'Session items saved successfully!',
                                            order_id: orderId,
                                            items: cleaned.map((item) => ({ menu_id: item.menuId, quantity: item.quantity, note: item.note ?? '' })),
                                        });
                                    });
                                });
                            });
                        };

                        if (orders.length > 0) {
                            saveItems(orders[0].order_id);
                            return;
                        }

                        connection.query('INSERT INTO orders (session_id, staff_id, status) VALUES (?, ?, ?)', [id, null, 'Pending'], (insertOrderErr, result) => {
                            if (insertOrderErr) return rollback(insertOrderErr);
                            saveItems(result.insertId);
                        });
                    });
                };

                getStockRequirements(connection, cleaned, (stockErr, requirements) => {
                    if (stockErr) return rollback(stockErr);

                    const shortages = findShortages(requirements);
                    if (shortages.length > 0) {
                        return rollbackWith(409, stockShortagePayload(shortages));
                    }

                    saveValidatedItems();
                });
            });
        });
    });

    // DELETE service session
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid service session id' });
        }

        const query = 'DELETE FROM service_sessions WHERE session_id = ?';

        pool.query(query, [id], (err, result) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({
                        message: 'This service session is used by orders or sales and cannot be deleted.'
                    });
                }
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Service session not found' });
            }
            res.json({ message: 'Service session deleted successfully!' });
        });
    });

    return router;
};
