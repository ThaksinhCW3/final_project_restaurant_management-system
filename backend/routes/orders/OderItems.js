const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all import
    router.get('/', (req, res) => {
        const query = `
            SELECT
            order_items.order_item_id,
            order_items.order_id,
            order_items.menu_id,
            menus.menu_name,
            order_items.quantity
            FROM order_items
            JOIN menus ON order_items.menu_id = menus.menu_id`
        pool.query(query, (err, result) => {
            if (err) {
                console.error('Error fetching order items:', err);
                res.status(500).json({ error: 'Failed to fetch order items' });
            } else {
                res.json(result);
            }
        });
    });

    //ADD order item
    router.post('/', (req, res) => {
        const { order_id, menu_id, quantity } = req.body;
        const query = `
            INSERT INTO order_items (order_id, menu_id, quantity) VALUES (?, ?, ?)`;
        pool.query(query, [order_id, menu_id, quantity], (err, result) => {
            if (err) {
                console.error('Error adding order item:', err);
                res.status(500).json({ error: 'Failed to add order item' });
            } else {
                res.json({ message: 'Order item added successfully' });
            }
        });
    });

    //UPDATE order item
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { order_id, menu_id, quantity } = req.body;
        const query = `
            UPDATE order_items SET order_id = ?, menu_id = ?, quantity = ? WHERE order_item_id = ?`;
        pool.query(query, [order_id, menu_id, quantity, id], (err, result) => {
            if (err) {
                console.error('Error updating order item:', err);
                res.status(500).json({ error: 'Failed to update order item' });
            } else {
                res.json({ message: 'Order item updated successfully' });
            }
        });
    });

    // DELETE order item
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        const query = `
            DELETE FROM order_items WHERE order_item_id = ?`;
        pool.query(query, [id], (err, result) => {
            if (err) {
                console.error('Error deleting order item:', err);
                res.status(500).json({ error: 'Failed to delete order item' });
            } else {
                res.json({ message: 'Order item deleted successfully' });
            }
        });
    });

    return router;
};
