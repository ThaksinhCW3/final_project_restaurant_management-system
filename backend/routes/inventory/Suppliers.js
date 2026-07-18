const express = require('express');
const router = express.Router();

//GET supplier
module.exports = (pool) => {
    router.get('/', (req, res) => {
        const query = 'SELECT * FROM suppliers';
        pool.query (query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
    
//ADD supplier
    router.post('/', (req, res) => {
        const { supplier_name, phone } = req.body;
        const query = 'INSERT INTO suppliers (supplier_name, phone) VALUES (?, ?)';
        pool.query(query, [supplier_name, phone], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Supplier added successfully!", supplier_id: result.insertId });
        });
    });

    //UPDATE supplier
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid supplier id' });
        }
        const query = 'UPDATE suppliers SET supplier_name = ?, phone = ? WHERE supplier_id = ?';
        const { supplier_name, phone } = req.body;
        pool.query(query, [supplier_name, phone, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0){
                return res.status(404).json({ message: "Supplier not found" });
            }
            res.json({ message: "Supplier updated successfully!" });
        });
    });

    //DELETE supplier
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid supplier id' });
        }
        const query = 'DELETE FROM suppliers WHERE supplier_id = ?';
        pool.query(query, [id], (err, result) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({
                        message: 'This supplier is used by existing ingredients or orders and cannot be deleted.'
                    });
                }
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0){
                return res.status(404).json({ message: "Supplier not found" });
            }
            res.json({ message: "Supplier deleted successfully!" });
        });
    });

    return router;
};
