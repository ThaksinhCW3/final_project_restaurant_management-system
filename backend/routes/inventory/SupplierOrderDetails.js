const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all supplier order details
    router.get('/', (req, res) => {
        const query = `
            SELECT
                supplier_order_details.supplier_order_detail_id,
                supplier_order_details.supplier_order_id,
                supplier_order_details.ingredient_id,
                ingredients.ingredient_name,
                supplier_order_details.quantity,
                supplier_order_details.unit_price
            FROM supplier_order_details
            LEFT JOIN suppliers_orders ON supplier_order_details.supplier_order_id = suppliers_orders.supplier_order_id
            LEFT JOIN ingredients ON supplier_order_details.ingredient_id = ingredients.ingredient_id
        `;

        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD supplier order detail
    router.post('/', (req, res) => {
        const { supplier_order_id, ingredient_id, quantity, unit_price } = req.body;
        const query = `
            INSERT INTO supplier_order_details
                (supplier_order_id, ingredient_id, quantity, unit_price)
            VALUES (?, ?, ?, ?)
        `;

        pool.query(query, [supplier_order_id, ingredient_id, quantity, unit_price], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: 'Supplier order detail added successfully!',
                supplier_order_detail_id: result.insertId
            });
        });
    });

    // UPDATE supplier order detail
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid supplier order detail id' });
        }

        const { supplier_order_id, ingredient_id, quantity, unit_price } = req.body;
        const query = `
            UPDATE supplier_order_details
            SET supplier_order_id = ?, ingredient_id = ?, quantity = ?, unit_price = ?
            WHERE supplier_order_detail_id = ?
        `;

        pool.query(query, [supplier_order_id, ingredient_id, quantity, unit_price, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Supplier order detail not found' });
            }
            res.json({ message: 'Supplier order detail updated successfully!' });
        });
    });

    // DELETE supplier order detail
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid supplier order detail id' });
        }

        const query = 'DELETE FROM supplier_order_details WHERE supplier_order_detail_id = ?';

        pool.query(query, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Supplier order detail not found' });
            }
            res.json({ message: 'Supplier order detail deleted successfully!' });
        });
    });

    return router;
};
