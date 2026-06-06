const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all recipes
    router.get('/', (req, res) => {
        const query = `
            SELECT 
                recipes.recipe_id,
                recipes.menu_id,
                menus.menu_name,
                recipes.ingredient_id,
                ingredients.ingredient_name,
                recipes.quantity_used
            FROM recipes
            LEFT JOIN menus ON recipes.menu_id = menus.menu_id
            LEFT JOIN ingredients ON recipes.ingredient_id = ingredients.ingredient_id
        `;
        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD recipe
    router.post('/', (req, res) => {
        const { menu_id, ingredient_id, quantity_used } = req.body;
        const query = 'INSERT INTO recipes (menu_id, ingredient_id, quantity_used) VALUES (?, ?, ?)';
        pool.query(query, [menu_id, ingredient_id, quantity_used], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Recipe added successfully!", recipe_id: result.insertId });
        });
    });

    // UPDATE recipe
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { menu_id, ingredient_id, quantity_used } = req.body;
        const query = 'UPDATE recipes SET menu_id = ?, ingredient_id = ?, quantity_used = ? WHERE recipe_id = ?';

        pool.query(query, [menu_id, ingredient_id, quantity_used, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Recipe not found" });
            }
            res.json({ message: "Recipe updated successfully!" });
        });
    });

    // DELETE recipe
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        const query = 'DELETE FROM recipes WHERE recipe_id = ?';

        pool.query(query, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Recipe not found" });
            }
            res.json({ message: "Recipe deleted successfully!" });
        });
    });

    return router;
};
