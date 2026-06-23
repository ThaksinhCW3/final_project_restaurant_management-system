const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all import
    router.get(['/', "/order"], (req, res) => {
        const query = `
            SELECT
            order_items.order_item_id AS orderItemId,
            order_items.order_item_id AS order_item_id,
            order_items.order_id AS orderId,
            order_items.order_id AS order_id,
            order_items.menu_id AS menuId,
            order_items.menu_id AS menu_id,
            menus.menu_name AS menuName,
            menus.menu_name AS menu_name,
            order_items.quantity,
            order_items.note
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
    router.post(['/', "/order"], (req, res) => {
        const { order_id, orderId, menu_id, menuId, quantity, note } = req.body;
        const finalOrderId = order_id ?? orderId ?? null;
        const finalMenuId = menu_id ?? menuId ?? null;
        const finalNote = String(note ?? '').trim();
        const query = `
            INSERT INTO order_items (order_id, menu_id, quantity, note) VALUES (?, ?, ?, ?)`;
        pool.query(query, [finalOrderId, finalMenuId, quantity, finalNote], (err, result) => {
            if (err) {
                console.error('Error adding order item:', err);
                res.status(500).json({ error: 'Failed to add order item' });
            } else {
                res.json({
                    message: 'Order item added successfully',
                    orderItemId: result.insertId,
                    order_item_id: result.insertId,
                    orderId: finalOrderId,
                    menuId: finalMenuId,
                    quantity,
                    note: finalNote
                });
            }
        });
    });

    //UPDATE order item
    router.put(['/:id', '/:id/order'], (req, res) => {
        const { id } = req.params;
        const { order_id, orderId, menu_id, menuId, quantity, note } = req.body;
        const finalOrderId = order_id ?? orderId ?? null;
        const finalMenuId = menu_id ?? menuId ?? null;
        const finalNote = String(note ?? '').trim();
        const query = `
            UPDATE order_items SET order_id = ?, menu_id = ?, quantity = ?, note = ? WHERE order_item_id = ?`;
        pool.query(query, [finalOrderId, finalMenuId, quantity, finalNote, id], (err, result) => {
            if (err) {
                console.error('Error updating order item:', err);
                res.status(500).json({ error: 'Failed to update order item' });
            } else {
                res.json({
                    message: 'Order item updated successfully',
                    orderItemId: Number(id),
                    orderId: finalOrderId,
                    menuId: finalMenuId,
                    quantity,
                    note: finalNote
                });
            }
        });
    });

    // DELETE order item
    router.delete(['/:id', '/:id/order'], (req, res) => {
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
