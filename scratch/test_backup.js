const { getPool, mssql } = require('../server/config/db');

async function testBackup() {
    try {
        console.log('Connecting to MSSQL Database...');
        const pool = await getPool();
        const dbName = process.env.DB_DATABASE || 'BWSL_DB';
        console.log(`Successfully connected! Target Database: ${dbName}`);

        // Test querying backup history
        console.log('\n--- Querying Backup History ---');
        const listQuery = `
            SELECT TOP 5
                bs.database_name AS DatabaseName,
                bs.backup_start_date AS BackupStartDate,
                bs.backup_finish_date AS BackupFinishDate,
                bmf.physical_device_name AS BackupPath,
                bs.backup_size AS BackupSize,
                bs.user_name AS BackupUser
            FROM msdb.dbo.backupset bs
            JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
            WHERE bs.database_name = @dbName
            ORDER BY bs.backup_finish_date DESC
        `;
        const listResult = await pool.request()
            .input('dbName', mssql.NVarChar(255), dbName)
            .query(listQuery);

        console.log(`Found ${listResult.recordset.length} historical backup records:`);
        listResult.recordset.forEach((r, i) => {
            console.log(`\n[${i+1}] Date: ${r.BackupFinishDate}`);
            console.log(`    User: ${r.BackupUser}`);
            console.log(`    Size: ${(r.BackupSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`    Path: ${r.BackupPath}`);
        });

        // Test registry xp_instance_regread
        console.log('\n--- Testing xp_instance_regread (Default Backup Directory) ---');
        try {
            const regQuery = `
                DECLARE @BackupDirectory NVARCHAR(4000);
                EXEC master.dbo.xp_instance_regread
                    N'HKEY_LOCAL_MACHINE',
                    N'Software\Microsoft\MSSQLServer\MSSQLServer',
                    N'BackupDirectory',
                    @BackupDirectory OUTPUT;
                SELECT @BackupDirectory AS BackupDirectory;
            `;
            const regResult = await pool.request().query(regQuery);
            const dir = regResult.recordset && regResult.recordset[0] && regResult.recordset[0].BackupDirectory;
            console.log(`Registry Default Backup Directory: ${dir || 'Not configured / Null'}`);
        } catch (regErr) {
            console.log(`xp_instance_regread failed (expected if permissions are restricted): ${regErr.message}`);
        }

        process.exit(0);
    } catch (err) {
        console.error('Database connection or query failed:', err);
        process.exit(1);
    }
}

testBackup();
