const express = require('express');
const router = express.Router();

module.exports = (pool) => {

    // GET all menus
    router.get('/', (req, res) => {
        const query = `
            SELECT menus.menu_id, menus.menu_name, menus.price, menus.availability, categories.category_name 
            FROM menus 
            LEFT JOIN categories ON menus.category_id = categories.category_id
        `;
        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD menu
    router.post('/', (req, res) => {
        const { menu_name, category_id, price, availability } = req.body;
        const query = 'INSERT INTO menus (menu_name, category_id, price, availability) VALUES (?, ?, ?, ?)';
        
        pool.query(query, [menu_name, category_id, price, availability], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ message: "Menu item added successfully!", menu_id: result.insertId });
        });
    });

    return router;
};