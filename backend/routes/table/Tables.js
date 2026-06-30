const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all tables
    router.get('/', (req, res) => {
        const query = `
            SELECT
                tables.table_number AS id,
                tables.table_name,
                COALESCE(NULLIF(TRIM(tables.table_name), ''), CONCAT('Table ', tables.table_number)) AS name,
                COALESCE(tables.capacity, 4) AS seats,
                CASE
                    WHEN service_sessions.session_id IS NOT NULL THEN 'occupied'
                    ELSE 'free'
                END AS status,
                '[]' AS items,
                service_sessions.started_at AS since,
                service_sessions.session_id
            FROM tables
            LEFT JOIN service_sessions
                ON service_sessions.table_number = tables.table_number
                AND service_sessions.status IN ('Active', 'PendingPayment')
            ORDER BY tables.table_number
        `;
        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // GET single table
    router.get('/:id', (req, res) => {
        const { id } = req.params;
        const query = `
            SELECT
                tables.table_number AS id,
                tables.table_name,
                COALESCE(NULLIF(TRIM(tables.table_name), ''), CONCAT('Table ', tables.table_number)) AS name,
                COALESCE(tables.capacity, 4) AS seats,
                CASE
                    WHEN service_sessions.session_id IS NOT NULL THEN 'occupied'
                    ELSE 'free'
                END AS status,
                service_sessions.started_at AS since,
                service_sessions.session_id
            FROM tables
            LEFT JOIN service_sessions
                ON service_sessions.table_number = tables.table_number
                AND service_sessions.status IN ('Active', 'PendingPayment')
            WHERE tables.table_number = ?
            LIMIT 1
        `;
        pool.query(query, [id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) {
                return res.status(404).json({ message: 'Table not found' });
            }
            res.json(results[0]);
        });
    });

    // CREATE table
    router.post('/', (req, res) => {
        const tableNumber = Number(req.body.table_number ?? req.body.tableNumber);
        const capacity = Number(req.body.capacity ?? req.body.seats ?? 4);
        const tableName = String(req.body.table_name ?? req.body.tableName ?? '').trim() || null;

        if (!Number.isInteger(tableNumber) || tableNumber <= 0) {
            return res.status(400).json({ message: 'Valid table number is required' });
        }

        if (!Number.isInteger(capacity) || capacity <= 0) {
            return res.status(400).json({ message: 'Valid capacity is required' });
        }

        const query = `
            INSERT INTO tables (table_number, table_name, capacity, status)
            VALUES (?, ?, ?, 'available')
        `;

        pool.query(query, [tableNumber, tableName, capacity], (err) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Table number already exists' });
                }
                return res.status(500).json({ error: err.message });
            }

            res.status(201).json({
                id: tableNumber,
                table_name: tableName,
                name: tableName || `Table ${tableNumber}`,
                seats: capacity,
                status: 'free',
                items: [],
                since: null,
                session_id: null,
            });
        });
    });

    // UPDATE table status
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { status, session_id, capacity, seats } = req.body;
        const tableNameInput = req.body.table_name ?? req.body.tableName;
        const nextStatus = status === 'free' || status === 'Completed' ? 'available' : status === 'Active' ? 'occupied' : status;
        const nextCapacity = capacity ?? seats;
        const updates = [];
        const params = [];

        if (nextStatus) {
            updates.push('status = ?');
            params.push(nextStatus);
        }
        if (nextCapacity !== undefined) {
            updates.push('capacity = ?');
            params.push(Number(nextCapacity));
        }
        if (tableNameInput !== undefined) {
            updates.push('table_name = ?');
            params.push(String(tableNameInput ?? '').trim() || null);
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No table fields provided' });
        }

        params.push(id);
        const query = `UPDATE tables SET ${updates.join(', ')} WHERE table_number = ?`;

        pool.query(query, params, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Table not found' });
            }

            if (session_id && nextStatus === 'occupied') {
                pool.query(
                    'UPDATE service_sessions SET table_number = ? WHERE session_id = ?',
                    [id, session_id],
                    (sessionErr) => {
                        if (sessionErr) return res.status(500).json({ error: sessionErr.message });
                        res.json({ message: 'Table updated successfully!' });
                    },
                );
                return;
            }

            res.json({ message: 'Table updated successfully!' });
        });
    });

    // DELETE table
    router.delete('/:id', (req, res) => {
        const { id } = req.params;

        pool.query(
            'SELECT session_id FROM service_sessions WHERE table_number = ? AND status IN ("Active", "PendingPayment") LIMIT 1',
            [id],
            (activeErr, activeRows) => {
                if (activeErr) return res.status(500).json({ error: activeErr.message });
                if (activeRows.length > 0) {
                    return res.status(409).json({ message: 'Cannot delete a table with an active bill' });
                }

                pool.query('DELETE FROM tables WHERE table_number = ?', [id], (err, result) => {
                    if (err) return res.status(500).json({ error: err.message });
                    if (result.affectedRows === 0) {
                        return res.status(404).json({ message: 'Table not found' });
                    }
                    res.json({ message: 'Table deleted successfully!' });
                });
            },
        );
    });

    // Clear old session link when a bill is closed elsewhere.
    router.put('/:id/free', (req, res) => {
        const { id } = req.params;
        pool.query('UPDATE tables SET status = "available" WHERE table_number = ?', [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Table not found' });
            }
            res.json({ message: 'Table marked available' });
        });
    });

    return router;
};
