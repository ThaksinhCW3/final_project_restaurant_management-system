const express = require('express');
const router = express.Router();

module.exports = (pool) => {

    // GET all categories
    router.get('/', (req, res) => {
        const query = "SELECT * FROM categories";
        pool.query(query, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(result.map(row => ({
                categoryId: row.category_id,
                category_id: row.category_id,
                categoryName: row.category_name,
                category_name: row.category_name,
            })));
        });
    });

    // ADD category
    router.post('/', (req, res) => {
        const { category_name, categoryName } = req.body;
        const finalName = category_name ?? categoryName;
        const query = "INSERT INTO categories (category_name) VALUES (?)";

        pool.query(query, [finalName], (err, result) => {
            if (err) return res.status(500).json({ error: err.message});
            res.status(201).json({
                message: "Category added succesfully!",
                categoryId: result.insertId,
                category_id: result.insertId,
                categoryName: finalName,
                category_name: finalName,
            });
        });
    });

    // UPDATE category
    router.put('/:id', (req, res) => {
        const {id} = req.params;
        const { category_name, categoryName } = req.body;
        const finalName = category_name ?? categoryName;
        const query = "UPDATE categories SET category_name = ? WHERE category_id = ?";

        pool.query (query, [finalName, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message});
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: "Category not found" });
                }
                res.json({
                    message: "Category updated succesfully!",
                    categoryId: Number(id),
                    categoryName: finalName,
                    category_name: finalName,
                });
        });
    });

    // DELETE category
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        const query = "DELETE FROM categories WHERE category_id = ?"; 

        pool.query(query, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Category not found" });
            }
            res.json({ message: "Category deleted succesfully!" });
        });
    });
    return router;
}
