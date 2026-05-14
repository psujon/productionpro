const { getPool } = require('../server/config/db');

async function createTable() {
    try {
        const pool = await getPool();
        const sql = `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_tickets')
            BEGIN
                CREATE TABLE tbl_tickets (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    username NVARCHAR(200) NOT NULL,
                    subject NVARCHAR(500) NOT NULL,
                    description NVARCHAR(MAX) NOT NULL,
                    status NVARCHAR(50) DEFAULT 'Pending',
                    created_at DATETIME DEFAULT GETDATE()
                );
                PRINT 'Table tbl_tickets created successfully';
            END
            ELSE
            BEGIN
                PRINT 'Table tbl_tickets already exists';
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
