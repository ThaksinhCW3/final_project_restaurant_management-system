const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all tables
    router.get('/', (req, res) => {
        const query = `
            SELECT
                base.table_number AS id,
                CONCAT('Table ', base.table_number) AS name,
                4 AS seats,
                CASE WHEN service_sessions.session_id IS NULL THEN 'free' ELSE 'occupied' END AS status,
                '[]' AS items,
                service_sessions.started_at AS since,
                service_sessions.session_id
            FROM (
                SELECT 1 AS table_number UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5
                UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
            ) AS base
            LEFT JOIN service_sessions
                ON service_sessions.table_number = base.table_number
                AND (service_sessions.status = 'Active' OR service_sessions.status IS NULL)
            ORDER BY base.table_number
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
