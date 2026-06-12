const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all stock items
    router.get('/', (req, res) => {
        const query = `
            SELECT
                ingredient_id as id,
                ingredient_name as name,
                ingredient_image as image,
                unit,
                stock_quantity as cur,
                min_thereshold as min
            FROM ingredients
        `;
        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD stock item
    router.post('/', (req, res) => {
        const { name, image, unit, cur, min } = req.body;
        const query = 'INSERT INTO ingredients (ingredient_name, ingredient_image, unit, stock_quantity, min_thereshold, cost_per_unit) VALUES (?, ?, ?, ?, ?, ?)';

        pool.query(query, [name, image ?? null, unit, cur, min, 0], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: 'Stock item added successfully!',
                id: result.insertId,
                image: image ?? null
            });
        });
    });

    // UPDATE stock item
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { name, image, unit, cur, min } = req.body;
        const query = 'UPDATE ingredients SET ingredient_name = ?, ingredient_image = ?, unit = ?, stock_quantity = ?, min_thereshold = ? WHERE ingredient_id = ?';

        pool.query(query, [name, image ?? null, unit, cur, min, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Stock item not found' });
            }
            res.json({ message: 'Stock item updated successfully!' });
        });
    });

    // DELETE stock item
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        const query = 'DELETE FROM ingredients WHERE ingredient_id = ?';

        pool.query(query, [id], (err, result) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({
                        message: 'This ingredient is used in recipes and cannot be deleted.'
                    });
                }
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Stock item not found' });
            }
            res.json({ message: 'Stock item deleted successfully!' });
        });
    });

    return router;
};
