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
                min_thereshold as min,
                cost_per_unit as costPerUnit,
                ingredients.supplier_id as supplierId,
                suppliers.supplier_name as supplierName
            FROM ingredients
            LEFT JOIN suppliers ON ingredients.supplier_id = suppliers.supplier_id
        `;
        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD stock item
    router.post('/', (req, res) => {
        const { name, image, unit, cur, min, cost_per_unit, costPerUnit, supplier_id, supplierId } = req.body;
        const cost = cost_per_unit ?? costPerUnit ?? 0;
        const supplier = supplier_id ?? supplierId ?? null;
        const validUnits = new Set(['kg', 'g', 'pcs']);

        if (!name || !validUnits.has(unit)) {
            return res.status(400).json({ message: 'Ingredient name and a valid unit are required' });
        }

        const query = 'INSERT INTO ingredients (ingredient_name, ingredient_image, unit, stock_quantity, min_thereshold, cost_per_unit, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)';

        pool.query(query, [name, image ?? null, unit, cur, min, cost, supplier], (err, result) => {
            if (err) {
                if (err.code === 'ER_DATA_TOO_LONG') {
                    return res.status(400).json({ message: 'Image is too large. Please choose a smaller image.' });
                }
                if (err.code === 'WARN_DATA_TRUNCATED') {
                    return res.status(400).json({ message: 'Invalid ingredient value. Check the unit and numbers.' });
                }
                if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                    return res.status(400).json({ message: 'Selected supplier was not found.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.status(201).json({
                message: 'Stock item added successfully!',
                id: result.insertId,
                image: image ?? null,
                costPerUnit: cost,
                supplierId: supplier
            });
        });
    });

    // UPDATE stock item
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { name, image, unit, cur, min, cost_per_unit, costPerUnit, supplier_id, supplierId } = req.body;
        const cost = cost_per_unit ?? costPerUnit ?? 0;
        const supplier = supplier_id ?? supplierId ?? null;
        const validUnits = new Set(['kg', 'g', 'pcs']);

        if (!name || !validUnits.has(unit)) {
            return res.status(400).json({ message: 'Ingredient name and a valid unit are required' });
        }

        const query = 'UPDATE ingredients SET ingredient_name = ?, ingredient_image = ?, unit = ?, stock_quantity = ?, min_thereshold = ?, cost_per_unit = ?, supplier_id = ? WHERE ingredient_id = ?';

        pool.query(query, [name, image ?? null, unit, cur, min, cost, supplier, id], (err, result) => {
            if (err) {
                if (err.code === 'ER_DATA_TOO_LONG') {
                    return res.status(400).json({ message: 'Image is too large. Please choose a smaller image.' });
                }
                if (err.code === 'WARN_DATA_TRUNCATED') {
                    return res.status(400).json({ message: 'Invalid ingredient value. Check the unit and numbers.' });
                }
                if (err.code === 'ER_NO_REFERENCED_ROW_2') {
                    return res.status(400).json({ message: 'Selected supplier was not found.' });
                }
                return res.status(500).json({ error: err.message });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Stock item not found' });
            }
            res.json({ message: 'Stock item updated successfully!' });
        });
    });

    // RECEIVE stock item and record the supplier/import history
    router.post('/:id/receive', (req, res) => {
        const { id } = req.params;
        const {
            qty,
            quantity,
            cost_price,
            costPrice,
            supplier_id,
            supplierId,
            staff_id,
            staffId,
            expiry_date,
            expiryDate,
            remark
        } = req.body;

        const receivedQty = Number(qty ?? quantity);
        if (!Number.isInteger(Number(id)) || !Number.isFinite(receivedQty) || receivedQty <= 0) {
            return res.status(400).json({ message: 'Invalid stock receive request' });
        }

        pool.getConnection((connErr, connection) => {
            if (connErr) return res.status(500).json({ error: connErr.message });

            connection.beginTransaction((txErr) => {
                if (txErr) {
                    connection.release();
                    return res.status(500).json({ error: txErr.message });
                }

                const rollback = (err) => {
                    console.error('Receive stock transaction failed:', err);
                    connection.rollback(() => {
                        connection.release();
                        res.status(500).json({ error: err.message });
                    });
                };

                connection.query(
                    'SELECT ingredient_id, ingredient_name, stock_quantity, cost_per_unit, supplier_id FROM ingredients WHERE ingredient_id = ? LIMIT 1',
                    [id],
                    (selectErr, rows) => {
                        if (selectErr) return rollback(selectErr);
                        if (rows.length === 0) {
                            connection.rollback(() => {
                                connection.release();
                                res.status(404).json({ message: 'Stock item not found' });
                            });
                            return;
                        }

                        const ingredient = rows[0];
                        const finalCost = Number(cost_price ?? costPrice ?? ingredient.cost_per_unit ?? 0);
                        const finalSupplier = supplier_id ?? supplierId ?? ingredient.supplier_id ?? null;
                        const finalStaff = staff_id ?? staffId ?? null;
                        const totalAmount = receivedQty * (Number.isFinite(finalCost) ? finalCost : 0);
                        const finalExpiry = expiry_date || expiryDate || null;
                        const finalRemark = [
                            remark || `Received ${receivedQty} ${ingredient.ingredient_name}`,
                            finalExpiry ? `Expiry: ${finalExpiry}` : null
                        ].filter(Boolean).join(' | ');

                        if (!finalSupplier || !finalStaff) {
                            connection.rollback(() => {
                                connection.release();
                                res.status(400).json({ message: 'Supplier and staff are required to receive stock' });
                            });
                            return;
                        }

                        const createReceiveRecords = () => connection.query(
                            'INSERT INTO supply_orders (supplier_id, staff_id, total_amount, status) VALUES (?, ?, ?, ?)',
                            [finalSupplier, finalStaff, totalAmount, 'completed'],
                            (orderErr, orderResult) => {
                                if (orderErr) return rollback(orderErr);
                                const supplierOrderId = orderResult.insertId;

                                connection.query(
                                    'INSERT INTO supply_order_details (supply_order_id, ingredient_id, quantity, unit_price) VALUES (?, ?, ?, ?)',
                                    [supplierOrderId, id, receivedQty, finalCost],
                                    (orderDetailErr) => {
                                        if (orderDetailErr) return rollback(orderDetailErr);

                                        connection.query(
                                            'INSERT INTO imports (supplier_order_id, received_by, remark) VALUES (?, ?, ?)',
                                            [supplierOrderId, finalStaff, finalRemark],
                                            (importErr, importResult) => {
                                                if (importErr) return rollback(importErr);
                                                const importId = importResult.insertId;

                                                connection.query(
                                                    'INSERT INTO import_details (import_id, ingredient_id, received_quantity, cost_price) VALUES (?, ?, ?, ?)',
                                                    [importId, id, receivedQty, finalCost],
                                                    (importDetailErr) => {
                                                        if (importDetailErr) return rollback(importDetailErr);

                                                        connection.query(
                                                            'UPDATE ingredients SET stock_quantity = stock_quantity + ?, cost_per_unit = ?, supplier_id = ? WHERE ingredient_id = ?',
                                                            [receivedQty, finalCost, finalSupplier, id],
                                                            (updateErr) => {
                                                                if (updateErr) return rollback(updateErr);

                                                                connection.commit((commitErr) => {
                                                                    connection.release();
                                                                    if (commitErr) return res.status(500).json({ error: commitErr.message });
                                                                    res.status(201).json({
                                                                        message: 'Stock received successfully!',
                                                                        supply_order_id: supplierOrderId,
                                                                        import_id: importId,
                                                                        qty: receivedQty,
                                                                        costPrice: finalCost,
                                                                        supplierId: finalSupplier,
                                                                        cur: Number(ingredient.stock_quantity) + receivedQty
                                                                    });
                                                                });
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );

                        connection.query('SELECT staff_id FROM staff WHERE staff_id = ? LIMIT 1', [finalStaff], (staffErr, staffRows) => {
                            if (staffErr) return rollback(staffErr);
                            if (staffRows.length === 0) {
                                connection.rollback(() => {
                                    connection.release();
                                    res.status(400).json({ message: 'Current staff was not found. Please log in again.' });
                                });
                                return;
                            }

                            connection.query('SELECT supplier_id FROM suppliers WHERE supplier_id = ? LIMIT 1', [finalSupplier], (supplierErr, supplierRows) => {
                                if (supplierErr) return rollback(supplierErr);
                                if (supplierRows.length === 0) {
                                    connection.rollback(() => {
                                        connection.release();
                                        res.status(400).json({ message: 'Supplier was not found.' });
                                    });
                                    return;
                                }

                                createReceiveRecords();
                            });
                        });
                    }
                );
            });
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
