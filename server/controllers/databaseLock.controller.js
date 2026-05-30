const { getPool, mssql } = require('../config/db');

const GetLockoutDate = async (req, res) => {
    try {
        const pool = await getPool();
        const query = `
            SELECT lockout_date FROM tbl_database_lockout
            `;
        const result = await pool.request().query(query);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error('Error fetching lockout date:', err);
        res.status(500).json({ error: 'Internal server error: ' + err.message });
    }
}

const SaveDatabaseLock = async (req, res) => {
    try {
        const pool = await getPool();
        const { lock_date, login_user } = req.body;
        const query = `
            update tbl_database_lockout set  lock_date = @lockout_date, 
            processdate= getdate(), 
            processby = @username
            `;
        await pool.request()
            .input('lockout_date', mssql.Date, lock_date)
            .input('username', mssql.NVarChar(200), login_user.username)
            .query(query);
        res.json({ success: true, message: 'Database lock configuration updated successfully' });

    } catch (err) {
        console.error('Error saving database lock:', err);
        res.status(500).json({ error: 'Internal server error: ' + err.message });
    }
};



module.exports = {
    SaveDatabaseLock,
    GetLockoutDate
};
