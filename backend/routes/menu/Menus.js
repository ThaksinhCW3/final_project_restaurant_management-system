const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all menus
    router.get('/', (req, res) => {
        const query = `
            SELECT
                menus.menu_id AS menuId,
                menus.menu_id AS menu_id,
                menus.menu_name AS menuName,
                menus.menu_name AS menu_name,
                menus.menu_image AS menuImage,
                menus.menu_image AS menu_image,
                menus.category_id AS categoryId,
                menus.category_id AS category_id,
                menus.price,
                menus.availability,
                categories.category_id AS categoryRelationId,
                categories.category_name AS categoryName,
                categories.category_name AS category_name
            FROM menus 
            LEFT JOIN categories ON menus.category_id = categories.category_id
        `;
        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json(results);
        });
    });

    // ADD menu
    router.post('/', (req, res) => {
        const {
            menu_name,
            menuName,
            menu_image,
            menuImage,
            category_id,
            categoryId,
            price,
            availability,
        } = req.body;
        const finalName = menu_name ?? menuName;
        const finalImage = menu_image ?? menuImage ?? null;
        const finalCategory = category_id ?? categoryId ?? null;
        const query = 'INSERT INTO menus (menu_name, menu_image, category_id, price, availability) VALUES (?, ?, ?, ?, ?)';
        
        pool.query(query, [finalName, finalImage, finalCategory, price, availability ?? 1], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: "Menu item added successfully!",
                menu_id: result.insertId,
                menuId: result.insertId,
                menu_name: finalName,
                menuName: finalName,
                menu_image: finalImage,
                menuImage: finalImage,
                category_id: finalCategory,
                categoryId: finalCategory
            });
        });
    });

    // UPDATE menu
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const {
            menu_name,
            menuName,
            menu_image,
            menuImage,
            category_id,
            categoryId,
            price,
            availability
        } = req.body;
        const finalName = menu_name ?? menuName;
        const finalImage = menu_image ?? menuImage ?? null;
        const finalCategory = category_id ?? categoryId ?? null;
        const query = 'UPDATE menus SET menu_name = ?, menu_image = ?, category_id = ?, price = ?, availability = ? WHERE menu_id = ?';
        pool.query(query, [finalName, finalImage, finalCategory, price, availability, id], (err) => {
            if (err) return res.status(500).json({ error: err.message});
            res.status(200).json({
                message: "Menu item updated succesfully!",
                menuId: Number(id),
                menuName: finalName,
                menuImage: finalImage,
                categoryId: finalCategory
            });
        }) 
    })

    // DELETE menu
    router.delete('/:id', (req, res) => {
        const { id } = req.params;

        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid menu id' });
        }

        const query = 'DELETE FROM menus WHERE menu_id = ?';
        pool.query(query, [id], (err, result) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({
                        message: 'This menu item is used in existing orders and cannot be deleted. Set availability to 0 instead.'
                    });
                }

                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Menu item not found"});
            }

            res.json({ message: 'Menu has been deleted successfully!'});
        });
    });

    return router;
};
