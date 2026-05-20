const { getPool, mssql } = require('../server/config/db');

const getTimestamp = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

async function runBackupTest() {
    try {
        console.log('Connecting to MSSQL Database...');
        const pool = await getPool();
        const dbName = process.env.DB_DATABASE || 'BWSL_DB';
        const timestamp = getTimestamp();
        const backupFileName = `${dbName}_backup_${timestamp}.bak`;

        console.log(`Connected! Target database: ${dbName}`);
        
        let backupDir = null;

        // Resolve backup directory
        console.log('Resolving backup directory...');
        try {
            const lastBackupQuery = `
                SELECT TOP 1 bmf.physical_device_name AS LastBackupPath
                FROM msdb.dbo.backupset bs
                JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
                WHERE bs.database_name = @dbName
                ORDER BY bs.backup_finish_date DESC
            `;
            const lastBackupResult = await pool.request()
                .input('dbName', mssql.NVarChar(255), dbName)
                .query(lastBackupQuery);

            if (lastBackupResult.recordset && lastBackupResult.recordset[0] && lastBackupResult.recordset[0].LastBackupPath) {
                const lastPath = lastBackupResult.recordset[0].LastBackupPath;
                const lastBackslashIndex = lastPath.lastIndexOf('\\');
                if (lastBackslashIndex !== -1) {
                    backupDir = lastPath.substring(0, lastBackslashIndex);
                }
            }
        } catch (err) {
            console.warn('Failed to resolve from history:', err.message);
        }

        let fullBackupPath = backupFileName;
        if (backupDir) {
            const separator = backupDir.endsWith('\\') ? '' : '\\';
            fullBackupPath = `${backupDir}${separator}${backupFileName}`;
        }

        console.log(`Selected Backup Path: ${fullBackupPath}`);
        console.log('Executing BACKUP DATABASE statement...');
        
        const backupQuery = `
            DECLARE @Sql NVARCHAR(MAX);
            SET @Sql = N'BACKUP DATABASE [' + REPLACE(@dbName, ']', ']]') + N'] TO DISK = @Path WITH INIT, FORMAT, STATS = 10';
            EXEC sp_executesql @Sql, N'@dbName NVARCHAR(255), @Path NVARCHAR(4000)', @dbName = @dbName, @Path = @Path;
        `;

        const start = Date.now();
        await pool.request()
            .input('dbName', mssql.NVarChar(255), dbName)
            .input('Path', mssql.NVarChar(4000), fullBackupPath)
            .query(backupQuery);
        
        const duration = ((Date.now() - start) / 1000).toFixed(2);
        console.log(`Backup completed successfully in ${duration} seconds!`);
        console.log(`Backup File: ${fullBackupPath}`);
        process.exit(0);
    } catch (err) {
        console.error('Backup failed:', err);
        process.exit(1);
    }
}

runBackupTest();
