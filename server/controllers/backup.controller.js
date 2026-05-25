const { getPool, mssql } = require('../config/db');

// Helper to format date as YYYYMMDD_HHMMSS
const getTimestamp = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const GetBackupsList = async (req, res) => {
    try {
        const pool = await getPool();
        const dbName = process.env.DB_DATABASE || 'BWSL_DB';

        // Query the SQL Server backup history
        const query = `
            SELECT top(10)
                bs.database_name AS DatabaseName,
                CONVERT(VARCHAR(19), bs.backup_start_date, 126) AS BackupStartDate,
                CONVERT(VARCHAR(19), bs.backup_finish_date, 126) AS BackupFinishDate,
                bmf.physical_device_name AS BackupPath,
                bs.backup_size AS BackupSize,
                bs.user_name AS BackupUser,
                DATEDIFF(second, bs.backup_start_date, bs.backup_finish_date) AS DurationSeconds
            FROM msdb.dbo.backupset bs
            JOIN msdb.dbo.backupmediafamily bmf ON bs.media_set_id = bmf.media_set_id
            WHERE bs.database_name = @dbName
            ORDER BY bs.backup_finish_date DESC
        `;

        const result = await pool.request()
            .input('dbName', mssql.NVarChar(255), dbName)
            .query(query);

        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching backup list:', err);
        res.status(500).json({ error: 'Failed to retrieve backup history' });
    }
};

const CreateBackup = async (req, res) => {
    try {
        const pool = await getPool();
        const dbName = process.env.DB_DATABASE || 'BWSL_DB';
        const timestamp = getTimestamp();
        const backupFileName = `${dbName}_backup_${timestamp}.bak`;

        let backupDir = null;

        // 1. Try to query the SQL Server registry for the default Backup Directory
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
            if (regResult.recordset && regResult.recordset[0] && regResult.recordset[0].BackupDirectory) {
                backupDir = regResult.recordset[0].BackupDirectory;
            }
        } catch (regErr) {
            console.warn('xp_instance_regread failed, trying alternative path resolution...', regErr.message);
        }

        // 2. If registry query returned nothing or failed, try to get the directory from past backups
        if (!backupDir) {
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
            } catch (historyErr) {
                console.warn('Failed to query past backup paths:', historyErr.message);
            }
        }

        // 3. Construct the full path or fall back to just the file name
        let fullBackupPath = backupFileName;
        if (backupDir) {
            // Ensure backupDir ends with backslash
            const separator = backupDir.endsWith('\\') ? '' : '\\';
            fullBackupPath = `${backupDir}${separator}${backupFileName}`;
        }

        console.log(`Attempting backup of [${dbName}] to [${fullBackupPath}]`);

        // 4. Run the backup query using dynamic SQL to be fully robust and secure
        const backupQuery = `
            DECLARE @Sql NVARCHAR(MAX);
            SET @Sql = N'BACKUP DATABASE [' + REPLACE(@dbName, ']', ']]') + N'] TO DISK = @Path WITH INIT, FORMAT, STATS = 10';
            EXEC sp_executesql @Sql, N'@dbName NVARCHAR(255), @Path NVARCHAR(4000)', @dbName = @dbName, @Path = @Path;
        `;

        await pool.request()
            .input('dbName', mssql.NVarChar(255), dbName)
            .input('Path', mssql.NVarChar(4000), fullBackupPath)
            .query(backupQuery);

        console.log(`Backup completed successfully at ${fullBackupPath}`);

        res.json({
            success: true,
            message: 'Database backup completed successfully',
            fileName: backupFileName,
            fullPath: fullBackupPath
        });
    } catch (err) {
        console.error('Error creating database backup:', err);
        res.status(500).json({ error: 'Failed to create database backup: ' + err.message });
    }
};

module.exports = {
    GetBackupsList,
    CreateBackup
};
