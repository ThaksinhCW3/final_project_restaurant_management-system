const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all supplier orders
    router.get('/', (req, res) => {
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
        `;

        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD supplier order
    router.post('/', (req, res) => {
        const { supplier_id, staff_id, order_date, total_amount, status } = req.body;
        const query = `
            INSERT INTO supply_orders
                (supplier_id, staff_id, order_date, total_amount, status)
            VALUES (?, ?, ?, ?, ?)
        `;

        pool.query(query, [supplier_id, staff_id, order_date, total_amount, status], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: 'Supplier order added successfully!',
                supply_order_id: result.insertId
            });
        });
    });

    // UPDATE supplier order
    router.put('/:id', (req, res) => {
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

        pool.query(query, [supplier_id, staff_id, order_date, total_amount, status, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Supplier order not found' });
            }
            res.json({ message: 'Supplier order updated successfully!' });
        });
    });

    // DELETE supplier order
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid supplier order id' });
        }

        const query = 'DELETE FROM supply_orders WHERE supply_order_id = ?';

        pool.query(query, [id], (err, result) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({
                        message: 'This supplier order is used by imports and cannot be deleted.'
                    });
                }
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Supplier order not found' });
            }
            res.json({ message: 'Supplier order deleted successfully!' });
        });
    });

    return router;
};
