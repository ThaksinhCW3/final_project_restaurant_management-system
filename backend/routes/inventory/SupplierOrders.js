const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

module.exports = (pool) => {
    const jwtSecret = process.env.JWT_SECRET || 'restaurant-local-dev-secret';
    const db = pool.promise();

    const httpError = (status, message) => {
        const error = new Error(message);
        error.status = status;
        return error;
    };

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

    const requireAdmin = (req, res, next) => {
        requireLogin(req, res, () => {
            if (req.user.role !== 'manager') {
                return res.status(403).json({ error: 'Admin only' });
            }
            next();
        });
    };

    // GET all supplier orders
    router.get('/', async (_req, res) => {
        const query = `
            SELECT
                supply_orders.supply_order_id,
                supply_orders.supplier_id,
                suppliers.supplier_name,
                supply_orders.staff_id,
                staff.first_name,
                staff.last_name,
                supply_orders.order_date,
                supply_orders.total_amount,
                supply_orders.status
            FROM supply_orders
            LEFT JOIN suppliers ON supply_orders.supplier_id = suppliers.supplier_id
            LEFT JOIN staff ON supply_orders.staff_id = staff.staff_id
            ORDER BY supply_orders.supply_order_id DESC
        `;

        try {
            const [results] = await db.query(query);
            res.json(results);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // Create one or more waiting-for-stock orders from an item list.
    router.post('/list', requireAdmin, async (req, res) => {
        const staffId = req.body.staff_id ?? req.user.staff_id;
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        const cleanedItems = items.map((item) => ({
            supplierId: Number(item.supplier_id ?? item.supplierId),
            ingredientId: Number(item.ingredient_id ?? item.ingredientId),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unit_price ?? item.unitPrice),
        }));

        if (!staffId || cleanedItems.length === 0) {
            return res.status(400).json({ message: 'Order list and staff are required' });
        }

        if (cleanedItems.some((item) =>
            !Number.isInteger(item.supplierId) ||
            !Number.isInteger(item.ingredientId) ||
            !Number.isFinite(item.quantity) ||
            item.quantity <= 0 ||
            !Number.isFinite(item.unitPrice) ||
            item.unitPrice < 0
        )) {
            return res.status(400).json({ message: 'Invalid order item' });
        }

        const groupedItems = new Map();
        cleanedItems.forEach((item) => {
            const current = groupedItems.get(item.supplierId) || [];
            current.push(item);
            groupedItems.set(item.supplierId, current);
        });

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const createdOrders = [];

            for (const [supplierId, supplierItems] of groupedItems.entries()) {
                const totalAmount = supplierItems.reduce(
                    (sum, item) => sum + item.quantity * item.unitPrice,
                    0,
                );
                const [orderResult] = await connection.query(
                    `
                        INSERT INTO supply_orders
                            (supplier_id, staff_id, total_amount, status)
                        VALUES (?, ?, ?, ?)
                    `,
                    [supplierId, staffId, totalAmount, 'pending'],
                );
                const orderId = orderResult.insertId;

                for (const item of supplierItems) {
                    await connection.query(
                        `
                            INSERT INTO supply_order_details
                                (supply_order_id, ingredient_id, quantity, unit_price)
                            VALUES (?, ?, ?, ?)
                        `,
                        [orderId, item.ingredientId, item.quantity, item.unitPrice],
                    );
                }

                createdOrders.push({
                    supply_order_id: orderId,
                    supplier_id: supplierId,
                    total_amount: totalAmount,
                    status: 'pending',
                });
            }

            await connection.commit();
            res.status(201).json({
                message: 'Supply order list confirmed',
                orders: createdOrders,
            });
        } catch (err) {
            await connection.rollback();
            res.status(500).json({ error: err.message });
        } finally {
            connection.release();
        }
    });

    // Receive/check a waiting order, then add checked quantities to inventory.
    router.post('/:id/receive', requireLogin, async (req, res) => {
        const orderId = Number(req.params.id);
        const staffId = req.body.staff_id ?? req.user.staff_id;
        const items = Array.isArray(req.body.items) ? req.body.items : [];

        if (!Number.isInteger(orderId) || !staffId || items.length === 0) {
            return res.status(400).json({ message: 'Order, staff, and checked items are required' });
        }

        const checkedItems = items.map((item) => ({
            detailId: Number(item.detail_id ?? item.detailId),
            ingredientId: Number(item.ingredient_id ?? item.ingredientId),
            receivedQuantity: Number(item.received_quantity ?? item.receivedQuantity),
            actualUnitPrice: Number(item.actual_unit_price ?? item.actualUnitPrice),
        }));

        if (checkedItems.some((item) =>
            !Number.isInteger(item.detailId) ||
            !Number.isInteger(item.ingredientId) ||
            !Number.isFinite(item.receivedQuantity) ||
            item.receivedQuantity < 0 ||
            !Number.isFinite(item.actualUnitPrice) ||
            item.actualUnitPrice < 0
        )) {
            return res.status(400).json({ message: 'Invalid checked item' });
        }

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [orderRows] = await connection.query(
                'SELECT * FROM supply_orders WHERE supply_order_id = ? LIMIT 1',
                [orderId],
            );
            if (orderRows.length === 0) throw httpError(404, 'Supply order not found');
            const order = orderRows[0];
            if (order.status === 'completed') {
                throw httpError(409, 'This supply order is already completed');
            }

            const [detailRows] = await connection.query(
                `
                    SELECT
                        supply_order_detail_id,
                        ingredient_id,
                        quantity,
                        unit_price
                    FROM supply_order_details
                    WHERE supply_order_id = ?
                `,
                [orderId],
            );
            const detailsById = new Map(detailRows.map((row) => [Number(row.supply_order_detail_id), row]));
            let actualTotal = 0;
            let importId = null;

            const receivedItems = checkedItems.filter((item) => item.receivedQuantity > 0);
            if (receivedItems.length > 0) {
                const [importResult] = await connection.query(
                    'INSERT INTO imports (supplier_order_id, received_by, remark) VALUES (?, ?, ?)',
                    [orderId, staffId, req.body.remark || `Received supply order #${orderId}`],
                );
                importId = importResult.insertId;
            }

            for (const item of checkedItems) {
                const detail = detailsById.get(item.detailId);
                if (!detail || Number(detail.ingredient_id) !== item.ingredientId) {
                    throw httpError(400, 'Checked item does not match the order');
                }

                actualTotal += item.receivedQuantity * item.actualUnitPrice;

                await connection.query(
                    `
                        UPDATE supply_order_details
                        SET received_quantity = ?, actual_unit_price = ?
                        WHERE supply_order_detail_id = ?
                    `,
                    [item.receivedQuantity, item.actualUnitPrice, item.detailId],
                );

                if (item.receivedQuantity > 0) {
                    await connection.query(
                        `
                            INSERT INTO import_details
                                (import_id, ingredient_id, received_quantity, cost_price)
                            VALUES (?, ?, ?, ?)
                        `,
                        [importId, item.ingredientId, item.receivedQuantity, item.actualUnitPrice],
                    );

                    await connection.query(
                        `
                            UPDATE ingredients
                            SET stock_quantity = stock_quantity + ?,
                                cost_per_unit = ?,
                                supplier_id = ?
                            WHERE ingredient_id = ?
                        `,
                        [item.receivedQuantity, item.actualUnitPrice, order.supplier_id, item.ingredientId],
                    );
                }
            }

            await connection.query(
                `
                    UPDATE supply_orders
                    SET total_amount = ?, status = ?
                    WHERE supply_order_id = ?
                `,
                [actualTotal, 'completed', orderId],
            );

            await connection.commit();
            res.json({
                message: 'Supply order received successfully',
                supply_order_id: orderId,
                import_id: importId,
                total_amount: actualTotal,
                status: 'completed',
            });
        } catch (err) {
            await connection.rollback();
            res.status(err.status || 500).json({ error: err.message });
        } finally {
            connection.release();
        }
    });

    // ADD supplier order
    router.post('/', async (req, res) => {
        const { supplier_id, staff_id, order_date, total_amount, status } = req.body;
        const query = `
            INSERT INTO supply_orders
                (supplier_id, staff_id, order_date, total_amount, status)
            VALUES (?, ?, ?, ?, ?)
        `;

        try {
            const [result] = await db.query(query, [supplier_id, staff_id, order_date, total_amount, status]);
            res.status(201).json({
                message: 'Supplier order added successfully!',
                supply_order_id: result.insertId
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // UPDATE supplier order
    router.put('/:id', async (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid supplier order id' });
        }

        const { supplier_id, staff_id, order_date, total_amount, status } = req.body;
        const query = `
            UPDATE supply_orders
            SET supplier_id = ?, staff_id = ?, order_date = ?, total_amount = ?, status = ?
            WHERE supply_order_id = ?
        `;

        try {
            const [result] = await db.query(query, [supplier_id, staff_id, order_date, total_amount, status, id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Supplier order not found' });
            }
            res.json({ message: 'Supplier order updated successfully!' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE supplier order
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid supplier order id' });
        }

        const query = 'DELETE FROM supply_orders WHERE supply_order_id = ?';

        try {
            const [result] = await db.query(query, [id]);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Supplier order not found' });
            }
            res.json({ message: 'Supplier order deleted successfully!' });
        } catch (err) {
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(409).json({
                    message: 'This supplier order is used by imports and cannot be deleted.'
                });
            }
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
