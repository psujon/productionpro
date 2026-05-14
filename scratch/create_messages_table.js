const { getPool } = require('../server/config/db');

async function createTable() {
    try {
        const pool = await getPool();
        const sql = `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_messages')
            BEGIN
                CREATE TABLE tbl_messages (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    sender_username NVARCHAR(200) NOT NULL,
                    receiver_username NVARCHAR(200),
                    message_text NVARCHAR(MAX) NOT NULL,
                    is_broadcast BIT DEFAULT 0,
                    is_read BIT DEFAULT 0,
                    created_at DATETIME DEFAULT GETDATE()
                );
                PRINT 'Table tbl_messages created successfully';
            END
            ELSE
            BEGIN
                PRINT 'Table tbl_messages already exists';
            END
        `;
        await pool.request().query(sql);
        process.exit(0);
    } catch (err) {
        console.error('Error creating table:', err);
        process.exit(1);
    }
}

createTable();
