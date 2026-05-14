const { getPool, mssql } = require('../config/db');

const sendMessage = async (req, res) => {
    try {
        const pool = await getPool();
        const { sender_username, receiver_username, message_text, is_broadcast } = req.body;
        
        const request = pool.request();
        request.input('sender', mssql.NVarChar(200), sender_username);
        request.input('receiver', mssql.NVarChar(200), receiver_username || null);
        request.input('message', mssql.NVarChar(mssql.MAX), message_text);
        request.input('broadcast', mssql.Bit, is_broadcast ? 1 : 0);

        const sql = `INSERT INTO tbl_messages (sender_username, receiver_username, message_text, is_broadcast) 
                     VALUES (@sender, @receiver, @message, @broadcast)`;
        
        await request.query(sql);
        res.json({ success: true, message: 'Message sent successfully' });
    } catch (err) {
        console.error('Send Message Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getMessages = async (req, res) => {
    try {
        const pool = await getPool();
        const { username, other_username, is_broadcast, is_recent } = req.body;
        
        const request = pool.request();
        request.input('user', mssql.NVarChar(200), username);
        request.input('other', mssql.NVarChar(200), other_username);

        let sql;
        if (is_recent) {
            // Fetch latest 5 unread messages for this user from anyone
            sql = `SELECT TOP 5 id, sender_username, receiver_username, message_text, is_broadcast, created_at, is_read
                   FROM tbl_messages 
                   WHERE receiver_username = @user AND is_read = 0
                   ORDER BY created_at DESC`;
        } else if (is_broadcast) {
            // For broadcast, fetch all broadcast messages
            sql = `SELECT id, sender_username, receiver_username, message_text, is_broadcast, created_at, is_read
                   FROM tbl_messages 
                   WHERE is_broadcast = 1 
                   ORDER BY created_at ASC`;
        } else {
            // For private chat, fetch ONLY private messages between these two users
            sql = `
                SELECT id, sender_username, receiver_username, message_text, is_broadcast, created_at, is_read
                FROM tbl_messages 
                WHERE is_broadcast = 0 AND (
                    (sender_username = @user AND receiver_username = @other) OR 
                    (sender_username = @other AND receiver_username = @user)
                )
                ORDER BY created_at ASC
            `;
        }
        
        const result = await request.query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Messages Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getUnreadCount = async (req, res) => {
    try {
        const pool = await getPool();
        const { username } = req.body;
        
        const request = pool.request();
        request.input('user', mssql.NVarChar(200), username);

        const sql = `SELECT COUNT(*) as unread_count FROM tbl_messages 
                     WHERE receiver_username = @user AND is_read = 0`;
        
        const result = await request.query(sql);
        res.json({ count: result.recordset[0].unread_count });
    } catch (err) {
        console.error('Get Unread Count Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const pool = await getPool();
        const { username, sender_username } = req.body;
        
        const request = pool.request();
        request.input('user', mssql.NVarChar(200), username);
        request.input('sender', mssql.NVarChar(200), sender_username);

        const sql = `UPDATE tbl_messages SET is_read = 1 
                     WHERE receiver_username = @user AND sender_username = @sender AND is_read = 0`;
        
        await request.query(sql);
        res.json({ success: true });
    } catch (err) {
        console.error('Mark As Read Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    getUnreadCount,
    markAsRead
};
