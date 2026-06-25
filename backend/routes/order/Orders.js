const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

module.exports = (pool) => {
    const jwtSecret = process.env.JWT_SECRET || 'restaurant-local-dev-secret';
    const db = pool.promise();
    const requireLogin = (req, res, next) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) return res.status(401).json({ error: 'Login required' });

        jwt.verify(token, jwtSecret, (err, user) => {
            if (err) return res.status(401).json({ error: 'Invalid login' });
            req.user = user;
            next();
        });
    };

    // GET all orders
    router.get(['/', '/order'], (req, res) => {
        const query = `
            SELECT
                orders.order_id AS orderId,
                orders.order_id AS order_id,
                orders.session_id AS sessionId,
                orders.session_id AS session_id,
                service_sessions.session_type AS sessionType,
                service_sessions.table_number AS tableNumber,
                orders.staff_id AS staffId,
                orders.staff_id AS staff_id,
                staff.first_name AS firstName,
                staff.last_name AS lastName,
                orders.ordered_at AS orderedAt,
                orders.ordered_at AS ordered_at,
                orders.status,
                orders.cancellation_status AS cancellationStatus,
                orders.cancellation_status AS cancellation_status,
                orders.cancellation_reason AS cancellationReason,
                orders.cancellation_reason AS cancellation_reason,
                orders.cancellation_requested_at AS cancellationRequestedAt,
                orders.cancellation_requested_at AS cancellation_requested_at,
                orders.cancellation_decided_at AS cancellationDecidedAt,
                orders.cancellation_decided_at AS cancellation_decided_at,
                orders.cancellation_decided_by AS cancellationDecidedBy,
                orders.cancellation_decided_by AS cancellation_decided_by
            FROM orders
            LEFT JOIN service_sessions ON orders.session_id = service_sessions.session_id
            LEFT JOIN staff ON orders.staff_id = staff.staff_id
            ORDER BY orders.order_id DESC
        `;

        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD order
    router.post(['/', '/order'], (req, res) => {
        const { session_id, sessionId, staff_id, staffId, status } = req.body;
        const finalSessionId = session_id ?? sessionId ?? null;
        const finalStaffId = staff_id ?? staffId ?? null;
        const finalStatus = status ?? 'Pending';
        const query = 'INSERT INTO orders (session_id, staff_id, status) VALUES (?, ?, ?)';

        pool.query(query, [finalSessionId, finalStaffId, finalStatus], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: 'Order added successfully!',
                orderId: result.insertId,
                order_id: result.insertId,
                sessionId: finalSessionId,
                staffId: finalStaffId,
                status: finalStatus
            });
        });
    });

    router.post('/session/:sessionId/cancellation-request', async (req, res) => {
        const sessionId = Number(req.params.sessionId);
        const reason = String(req.body.reason ?? '').trim();

        if (!Number.isInteger(sessionId)) {
            return res.status(400).json({ message: 'Invalid service session id' });
        }
        if (!reason) {
            return res.status(400).json({ message: 'Cancellation reason is required' });
        }
        if (reason.length > 500) {
            return res.status(400).json({ message: 'Cancellation reason is too long' });
        }

        try {
            const [orders] = await db.query(
                `
                    SELECT
                        orders.order_id,
                        orders.cancellation_status,
                        service_sessions.status AS session_status,
                        COUNT(order_items.order_item_id) AS item_count
                    FROM orders
                    JOIN service_sessions ON orders.session_id = service_sessions.session_id
                    LEFT JOIN order_items ON orders.order_id = order_items.order_id
                    WHERE orders.session_id = ?
                    GROUP BY orders.order_id, orders.cancellation_status, service_sessions.status
                    ORDER BY orders.order_id DESC
                    LIMIT 1
                `,
                [sessionId],
            );
            const order = orders[0];

            if (!order || Number(order.item_count) === 0) {
                return res.status(404).json({ message: 'No submitted order found' });
            }
            if (order.session_status !== 'Active') {
                return res.status(409).json({ message: 'This order can no longer be cancelled' });
            }
            if (order.cancellation_status === 'pending') {
                return res.status(409).json({ message: 'Cancellation request is already waiting for staff' });
            }

            await db.query(
                `
                    UPDATE orders
                    SET cancellation_status = 'pending',
                        cancellation_reason = ?,
                        cancellation_requested_at = NOW(),
                        cancellation_decided_at = NULL,
                        cancellation_decided_by = NULL
                    WHERE order_id = ?
                `,
                [reason, order.order_id],
            );

            res.json({
                message: 'Cancellation request sent to staff',
                orderId: order.order_id,
                cancellationStatus: 'pending',
                cancellationReason: reason,
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    router.post('/:id/cancellation-decision', requireLogin, async (req, res) => {
        const orderId = Number(req.params.id);
        const decision = String(req.body.decision ?? '').trim().toLowerCase();

        if (!Number.isInteger(orderId)) {
            return res.status(400).json({ message: 'Invalid order id' });
        }
        if (decision !== 'approved' && decision !== 'rejected') {
            return res.status(400).json({ message: 'Decision must be approved or rejected' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [orders] = await connection.query(
                `
                    SELECT order_id, session_id, cancellation_status
                    FROM orders
                    WHERE order_id = ?
                    FOR UPDATE
                `,
                [orderId],
            );
            const order = orders[0];

            if (!order) {
                await connection.rollback();
                return res.status(404).json({ message: 'Order not found' });
            }
            if (order.cancellation_status !== 'pending') {
                await connection.rollback();
                return res.status(409).json({ message: 'No pending cancellation request for this order' });
            }

            if (decision === 'approved') {
                await connection.query('DELETE FROM order_items WHERE order_id = ?', [orderId]);
            }

            await connection.query(
                `
                    UPDATE orders
                    SET cancellation_status = ?,
                        cancellation_decided_at = NOW(),
                        cancellation_decided_by = ?
                    WHERE order_id = ?
                `,
                [decision, req.user.staff_id ?? req.user.id ?? null, orderId],
            );
            await connection.commit();

            res.json({
                message: decision === 'approved'
                    ? 'Order cancellation approved'
                    : 'Order cancellation rejected',
                orderId,
                sessionId: order.session_id,
                cancellationStatus: decision,
            });
        } catch (err) {
            await connection.rollback();
            res.status(500).json({ error: err.message });
        } finally {
            connection.release();
        }
    });

    // UPDATE order
    router.put(['/:id', '/order/:id'], requireLogin, (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid order id' });
        }

        const { session_id, sessionId, staff_id, staffId, status } = req.body;
        const finalSessionId = session_id ?? sessionId ?? null;
        const finalStaffId = staff_id ?? staffId ?? null;
        const finalStatus = status ?? 'Pending';
        const query = 'UPDATE orders SET session_id = ?, staff_id = ?, status = ? WHERE order_id = ?';

        pool.query(query, [finalSessionId, finalStaffId, finalStatus, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.json({
                message: 'Order updated successfully!',
                orderId: Number(id),
                sessionId: finalSessionId,
                staffId: finalStaffId,
                status: finalStatus
            });
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
