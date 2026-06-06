const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all imports
    router.get('/', (req, res) => {
        const query = `
        SELECT 
        imports.import_id,
        imports.supplier_order_id ,
        imports.import_date,
        imports.remark
        FROM imports
        JOIN suppliers_orders ON imports.supplier_order_id = suppliers_orders.supplier_order_id`
        pool.query(query, (err, results) => {
            if (err) {
                console.error('Error fetching imports:', err);
                res.status(500).json({ error: 'Failed to fetch imports' });
                return;
            }
            res.json(results);
        });
    })
    // ADD import
    router.post('/', (req, res) => {
        const { supplier_order_id, import_date, remark } = req.body;
        const query = `
        INSERT INTO imports (supplier_order_id, import_date, remark) VALUES (?, ?, ?)`
        pool.query(query, [supplier_order_id, import_date, remark], (err, result) => {
            if (err) {
                console.error('Error adding import:', err);
                res.status(500).json({ error: 'Failed to add import' });
                return;
            }
            res.status(201).json({ message: 'Import added successfully', importId: result.insertId });
        });
    });

    // UPDATE import
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { supplier_order_id, import_date, remark } = req.body;
        const query = `
        UPDATE imports SET supplier_order_id = ?, import_date = ?, remark = > ? WHERE import_id = ?`
        pool.query(query, [supplier_order_id, import_date, remark, id], (err, result) => {
            if (err) {
                console.error('Error updating import:', err);
                res.status(500).json({ error: 'Failed to update import'});
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Import not found' });
                return;
            }
            res.json({ message: 'Import updated successfully' });
        });
    });

    // DELETE import
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        const query = `DELETE FROM imports WHERE import_id = ?`
        pool.query(query, [id], (err, result) => {
            if (err) {
                console.error('Error deleting import', err);
                res.status(500).json({ error: 'Failed to delete import'});
                return;
            }
            if (result.affectedRows === 0) {
                res.status(404).json({ error: 'Import not found'});
                return;
            }
            res.json({ message: 'Import deleted successfully' });
        });
    });

    return router;
};