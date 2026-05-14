const { getPool, mssql } = require('../config/db');

const recordActivity = async (pool, username, activityType) => {
    try {
        const request = pool.request();
        request.input('username', mssql.NVarChar(200), username);
        request.input('activity_type', mssql.NVarChar(50), activityType);
        const sql = `INSERT INTO tbl_user_activity_logs (username, activity_type, activity_time) 
                     VALUES (@username, @activity_type, GETDATE())`;
        await request.query(sql);
    } catch (err) {
        console.error('Record Activity Error:', err);
    }
};

const login = async (req, res) => {
    try {
        const pool = await getPool();
        const { username, password } = req.body;
        const request = pool.request();
        
        request.input('username', mssql.NVarChar(200), username);
        request.input('password', mssql.NVarChar(200), password);

        const sql = `SELECT TOP (1) name, username, section, role, unit, company FROM dbo.tbl_users 
                     WHERE username = @username AND password = @password`;
        const result = await request.query(sql);

        if (!result.recordset.length) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = result.recordset[0];
        // Record login activity
        await recordActivity(pool, user.username, 'Login');
        
        res.json(user);
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getActivityLogs = async (req, res) => {
    try {
        const pool = await getPool();
        const { limit = 500 } = req.body;
        const sql = `SELECT TOP (${limit}) id, username, activity_type, activity_time 
                     FROM tbl_user_activity_logs ORDER BY activity_time DESC`;
        const result = await pool.request().query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Activity Logs Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const logout = async (req, res) => {
    try {
        const { username } = req.body;
        const pool = await getPool();
        await recordActivity(pool, username, 'Logout');
        res.json({ message: 'Logout activity recorded' });
    } catch (err) {
        console.error('Logout Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getUsers = async (req, res) => {
    try {
        const pool = await getPool();
        const { unit } = req.body;
        const sql = `SELECT id, name as full_name, username, password, section, 
                     CASE WHEN active='1' THEN 'Active' ELSE 'Inactive' END AS status, 
                     role as user_role FROM tbl_users WHERE unit = @unit ORDER BY id DESC`;
        
        const request = pool.request();
        request.input('unit', mssql.NVarChar, unit);
        const result = await request.query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Users Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const createUser = async (req, res) => {
    try {
        const data = req.body;
        const pool = await getPool();
        const request = pool.request();
        
        request.input('name', mssql.NVarChar(200), data.full_name);
        request.input('username', mssql.NVarChar(200), data.username);
        request.input('password', mssql.NVarChar(200), data.password);
        request.input('section', mssql.NVarChar(200), data.section);
        request.input('active', mssql.Bit, data.status === 'Active' ? 1 : 0);
        request.input('role', mssql.NVarChar(50), data.user_role);
        request.input('unit', mssql.NVarChar(200), data.user.unit);

        const sql = `INSERT INTO tbl_users (name, username, password, section, active, role, unit)
                     VALUES (@name, @username, @password, @section, @active, @role, @unit)`;
        await request.query(sql);
        res.status(201).json({ message: 'User successfully created' });
    } catch (err) {
        console.error('Create User Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getUserPermissions = async (req, res) => {
    try {
        const pool = await getPool();
        const { username } = req.body;
        const result = await pool.request()
            .input('username', mssql.NVarChar(200), username)
            .query('SELECT menu_id, has_access FROM tbl_user_permissions WHERE username = @username');
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Permissions Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const updateUserPermissions = async (req, res) => {
    try {
        const pool = await getPool();
        const { username, permissions } = req.body;
        
        const transaction = new mssql.Transaction(pool);
        await transaction.begin();
        
        try {
            await transaction.request()
                .input('username', mssql.NVarChar(200), username)
                .query('DELETE FROM tbl_user_permissions WHERE username = @username');
            
            for (const p of permissions) {
                await transaction.request()
                    .input('username', mssql.NVarChar(200), username)
                    .input('menu_id', mssql.NVarChar(100), p.menu_id)
                    .input('has_access', mssql.Bit, p.has_access ? 1 : 0)
                    .query('INSERT INTO tbl_user_permissions (username, menu_id, has_access) VALUES (@username, @menu_id, @has_access)');
            }
            
            await transaction.commit();
            res.json({ success: true, message: 'Permissions updated successfully' });
        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error('Update Permissions Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

module.exports = {
    login,
    getUsers,
    createUser,
    getActivityLogs,
    logout,
    getUserPermissions,
    updateUserPermissions
};
