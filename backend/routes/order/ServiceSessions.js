const express = require('express');
const router = express.Router();

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
        const finalStaffId = staff_id ?? staffId ?? null;
        const finalEndedAt = ended_at ?? endedAt ?? null;
        const finalStatus = status ?? 'Active';
        const query = `
            INSERT INTO service_sessions
                (session_type, note, table_number, staff_id, ended_at, status)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

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
        const finalStaffId = staff_id ?? staffId ?? null;
        const finalEndedAt = ended_at ?? endedAt ?? null;
        const finalStatus = status ?? 'Active';
        const query = `
            UPDATE service_sessions
            SET session_type = ?, note = ?, table_number = ?, staff_id = ?, ended_at = ?, status = ?
            WHERE session_id = ?
        `;

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

    // Replace all items for a QR bill/session.
    router.put('/:id/items', (req, res) => {
        const { id } = req.params;
        const items = Array.isArray(req.body.items) ? req.body.items : [];

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

                connection.query('SELECT order_id, status FROM orders WHERE session_id = ? ORDER BY order_id LIMIT 1', [id], (selectErr, orders) => {
                    if (selectErr) return rollback(selectErr);

                    const saveItems = (orderId) => {
                        connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId], (deleteErr) => {
                            if (deleteErr) return rollback(deleteErr);

                            const cleaned = items
                                .map((item) => [Number(item.menu_id ?? item.menuId ?? item.id), Number(item.quantity ?? item.qty)])
                                .filter(([menuId, quantity]) => Number.isInteger(menuId) && Number.isFinite(quantity) && quantity > 0);

                            if (cleaned.length === 0) {
                                return connection.commit((commitErr) => {
                                    connection.release();
                                    if (commitErr) return res.status(500).json({ error: commitErr.message });
                                    res.json({ message: 'Session items saved successfully!', order_id: orderId, items: [] });
                                });
                            }

                            const values = cleaned.map(([menuId, quantity]) => [orderId, menuId, quantity]);
                            connection.query('INSERT INTO order_items (order_id, menu_id, quantity) VALUES ?', [values], (insertErr) => {
                                if (insertErr) return rollback(insertErr);

                                connection.commit((commitErr) => {
                                    connection.release();
                                    if (commitErr) return res.status(500).json({ error: commitErr.message });
                                    res.json({
                                        message: 'Session items saved successfully!',
                                        order_id: orderId,
                                        items: cleaned.map(([menuId, quantity]) => ({ menu_id: menuId, quantity })),
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
