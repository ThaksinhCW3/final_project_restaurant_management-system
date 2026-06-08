const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all tables
    router.get('/', (req, res) => {
        const query = `
            SELECT
                table_number as id,
                'Table' as name,
                4 as seats,
                COALESCE(status, 'free') as status,
                '[]' as items,
                started_at as since,
                session_id
            FROM service_sessions
            WHERE status = 'Active' OR status IS NULL
            UNION
            SELECT
                @row := @row + 1 as id,
                CONCAT('Table ', @row) as name,
                4 as seats,
                'free' as status,
                '[]' as items,
                NULL as since,
                NULL as session_id
            FROM (SELECT @row := 0) t
            LIMIT 10
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
                table_number as id,
                status,
                session_id
            FROM service_sessions
            WHERE table_number = ?
        `;
        pool.query(query, [id], (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            if (results.length === 0) {
                return res.status(404).json({ message: 'Table not found' });
            }
            res.json(results[0]);
        });
    });

    // UPDATE table status
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        const { status, session_id } = req.body;
        const query = 'UPDATE service_sessions SET status = ? WHERE table_number = ?';

        pool.query(query, [status, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Table not found' });
            }
            res.json({ message: 'Table updated successfully!' });
        });
    });

    return router;
};
