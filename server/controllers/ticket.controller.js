const { getPool, mssql } = require('../config/db');

const createTicket = async (req, res) => {
    try {
        const pool = await getPool();
        const { username, subject, description } = req.body;
        
        const request = pool.request();
        request.input('username', mssql.NVarChar(200), username);
        request.input('subject', mssql.NVarChar(500), subject);
        request.input('description', mssql.NVarChar(mssql.MAX), description);

        const sql = `INSERT INTO tbl_tickets (username, subject, description) VALUES (@username, @subject, @description)`;
        await request.query(sql);
        res.json({ success: true, message: 'Ticket submitted successfully' });
    } catch (err) {
        console.error('Create Ticket Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getTickets = async (req, res) => {
    try {
        const pool = await getPool();
        const { username, isAdmin } = req.body;
        
        const request = pool.request();
        request.input('username', mssql.NVarChar(200), username);

        let sql;
        if (isAdmin) {
            sql = `SELECT * FROM tbl_tickets ORDER BY created_at DESC`;
        } else {
            sql = `SELECT * FROM tbl_tickets WHERE username = @username ORDER BY created_at DESC`;
        }
        
        const result = await request.query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Tickets Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const updateTicketStatus = async (req, res) => {
    try {
        const pool = await getPool();
        const { id, status } = req.body;
        
        const request = pool.request();
        request.input('id', mssql.Int, id);
        request.input('status', mssql.NVarChar(50), status);

        const sql = `UPDATE tbl_tickets SET status = @status WHERE id = @id`;
        await request.query(sql);
        res.json({ success: true, message: 'Ticket status updated' });
    } catch (err) {
        console.error('Update Ticket Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getUnresolvedTickets = async (req, res) => {
    try {
        const pool = await getPool();
        const request = pool.request();
        const sql = `SELECT * FROM tbl_tickets WHERE status = 'Pending' ORDER BY created_at DESC`;
        const result = await request.query(sql);
        res.json({
            count: result.recordset.length,
            tickets: result.recordset
        });
    } catch (err) {
        console.error('Get Unresolved Tickets Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

module.exports = {
    createTicket,
    getTickets,
    updateTicketStatus,
    getUnresolvedTickets
};
