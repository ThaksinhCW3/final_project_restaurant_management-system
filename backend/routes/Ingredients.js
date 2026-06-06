const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all ingredients
    router.get('/', (req, res) => 
    {
        const query = 'SELECT * FROM ingredients';
        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    })

    // ADD ingredient
    router.post('/', (req, res) => {
        const { ingredient_name, stock_quantity, unit, cost_per_unit, min_thereshold, supplier_id } = req.body;
        const query = `
            INSERT INTO ingredients 
                (ingredient_name, stock_quantity, unit, cost_per_unit, min_thereshold, supplier_id) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        pool.query(query, [ingredient_name, stock_quantity, unit, cost_per_unit, min_thereshold, supplier_id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Ingredient added successfully!", ingredient_id: result.insertId });
        });
    });

    //UPDATE ingredient
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { ingredient_name, stock_quantity, unit, cost_per_unit, min_thereshold, supplier_id } = req.body;
        const query = `
            UPDATE ingredients 
            SET ingredient_name = ?, stock_quantity = ?, unit = ?, cost_per_unit = ?, min_thereshold = ?, supplier_id = ? 
            WHERE ingredient_id = ?
        `;
        pool.query(query, [ingredient_name, stock_quantity, unit, cost_per_unit, min_thereshold, supplier_id, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Ingredient not found" });
            }
            res.status(200).json({ message: "Ingredient updated successfully!" });
        });
    });

    //DELETE ingredient 
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        const query = 'DELETE FROM ingredients WHERE ingredient_id = ?';
        pool.query(query, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0 ){
                return res.status(404).json({ message: "Ingredient not found" });
            }
            res.json({ message: "Ingredient deleted successfully!" });
        });
    });
    return router;
};