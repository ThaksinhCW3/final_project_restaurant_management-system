const express = require('express');
const router = express.Router();

module.exports = (pool) => {
    // GET all service sessions
    router.get('/', (req, res) => {
        const query = `
            SELECT
                service_sessions.session_id AS sessionId,
                service_sessions.session_id AS session_id,
                service_sessions.session_type AS sessionType,
                service_sessions.session_type AS session_type,
                service_sessions.table_number AS tableNumber,
                service_sessions.table_number AS table_number,
                service_sessions.staff_id AS staffId,
                service_sessions.staff_id AS staff_id,
                staff.first_name AS firstName,
                staff.last_name AS lastName,
                service_sessions.started_at AS startedAt,
                service_sessions.started_at AS started_at,
                service_sessions.ended_at AS endedAt,
                service_sessions.ended_at AS ended_at,
                service_sessions.status
            FROM service_sessions
            LEFT JOIN staff ON service_sessions.staff_id = staff.staff_id
        `;

        pool.query(query, (err, results) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });

    // ADD service session
    router.post('/', (req, res) => {
        const {
            session_type,
            sessionType,
            table_number,
            tableNumber,
            staff_id,
            staffId,
            ended_at,
            endedAt,
            status
        } = req.body;
        const finalSessionType = session_type ?? sessionType ?? 'dine-in';
        const finalTableNumber = table_number ?? tableNumber ?? null;
        const finalStaffId = staff_id ?? staffId ?? null;
        const finalEndedAt = ended_at ?? endedAt ?? null;
        const finalStatus = status ?? 'Active';
        const query = `
            INSERT INTO service_sessions
                (session_type, table_number, staff_id, ended_at, status)
            VALUES (?, ?, ?, ?, ?)
        `;

        pool.query(query, [finalSessionType, finalTableNumber, finalStaffId, finalEndedAt, finalStatus], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({
                message: 'Service session added successfully!',
                sessionId: result.insertId,
                session_id: result.insertId,
                sessionType: finalSessionType,
                session_type: finalSessionType,
                tableNumber: finalTableNumber,
                table_number: finalTableNumber,
                staffId: finalStaffId,
                staff_id: finalStaffId,
                endedAt: finalEndedAt,
                ended_at: finalEndedAt,
                status: finalStatus
            });
        });
    });

    // UPDATE service session
    router.put('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid service session id' });
        }

        const {
            session_type,
            sessionType,
            table_number,
            tableNumber,
            staff_id,
            staffId,
            ended_at,
            endedAt,
            status
        } = req.body;
        const finalSessionType = session_type ?? sessionType ?? 'dine-in';
        const finalTableNumber = table_number ?? tableNumber ?? null;
        const finalStaffId = staff_id ?? staffId ?? null;
        const finalEndedAt = ended_at ?? endedAt ?? null;
        const finalStatus = status ?? 'Active';
        const query = `
            UPDATE service_sessions
            SET session_type = ?, table_number = ?, staff_id = ?, ended_at = ?, status = ?
            WHERE session_id = ?
        `;

        pool.query(query, [finalSessionType, finalTableNumber, finalStaffId, finalEndedAt, finalStatus, id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Service session not found' });
            }
            res.json({
                message: 'Service session updated successfully!',
                sessionId: Number(id),
                sessionType: finalSessionType,
                tableNumber: finalTableNumber,
                staffId: finalStaffId,
                endedAt: finalEndedAt,
                status: finalStatus
            });
        });
    });

    // DELETE service session
    router.delete('/:id', (req, res) => {
        const { id } = req.params;
        if (!Number.isInteger(Number(id))) {
            return res.status(400).json({ message: 'Invalid service session id' });
        }

        const query = 'DELETE FROM service_sessions WHERE session_id = ?';

        pool.query(query, [id], (err, result) => {
            if (err) {
                if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                    return res.status(409).json({
                        message: 'This service session is used by orders or sales and cannot be deleted.'
                    });
                }
                return res.status(500).json({ error: err.message });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Service session not found' });
            }
            res.json({ message: 'Service session deleted successfully!' });
        });
    });

    return router;
};
