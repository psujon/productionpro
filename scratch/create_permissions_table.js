const { getPool } = require('../server/config/db');

async function createTable() {
    try {
        const pool = await getPool();
        const sql = `
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'tbl_user_permissions')
            BEGIN
                CREATE TABLE tbl_user_permissions (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    username NVARCHAR(200) NOT NULL,
                    menu_id NVARCHAR(100) NOT NULL,
                    has_access BIT DEFAULT 0,
                    UNIQUE(username, menu_id)
                );
                PRINT 'Table tbl_user_permissions created successfully';
            END
            ELSE
            BEGIN
                PRINT 'Table tbl_user_permissions already exists';
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
