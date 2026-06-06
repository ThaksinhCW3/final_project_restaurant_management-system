const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all import details
    router.get('/', (req, res) => {
        const query = `
            SELECT
                import_details.import_detail_id,
                import_details.import_id,
                import_details.ingredient_id,
                ingredients.ingredient_name,
                import_details.received_quantity,
                import_details.cost_price,
                import_details.expiry_date
            FROM import_details
            LEFT JOIN imports ON import_details.import_id = imports.import_id
            LEFT JOIN ingredients ON import_details.ingredient_id = ingredients.ingredient_id
        `;

        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD import detail
    router.post('/', (req, res) => {
        const { import_id, ingredient_id, received_quantity, cost_price, expiry_date } = req.body;
        const query = `
            INSERT INTO import_details
                (import_id, ingredient_id, received_quantity, cost_price, expiry_date)
            VALUES (?, ?, ?, ?, ?)
        `;

        pool.query(query, [import_id, ingredient_id, received_quantity, cost_price, expiry_date], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: 'Import detail added successfully!',
                import_detail_id: result.insertId
            });
        });
    });

    // UPDATE import detail
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid import detail id' });
        }

        const { import_id, ingredient_id, received_quantity, cost_price, expiry_date } = req.body;
        const query = `
            UPDATE import_details
            SET import_id = ?, ingredient_id = ?, received_quantity = ?, cost_price = ?, expiry_date = ?
            WHERE import_detail_id = ?
        `;

        pool.query(query, [import_id, ingredient_id, received_quantity, cost_price, expiry_date, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Import detail not found' });
            }
            res.json({ message: 'Import detail updated successfully!' });
        });
    });

    // DELETE import detail
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid import detail id' });
        }

        const query = 'DELETE FROM import_details WHERE import_detail_id = ?';

        pool.query(query, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Import detail not found' });
            }
            res.json({ message: 'Import detail deleted successfully!' });
        });
    });

    return router;
};
