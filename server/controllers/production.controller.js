const { getPool, mssql } = require('../config/db');

const searchProduction = async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;
        const request = pool.request();

        request.input('unit', mssql.NVarChar(200), data.login_user.unit);
        request.input('section', mssql.NVarChar(200), data.section || null);
        request.input('fromdate', mssql.Date, data.from_date || null);
        request.input('todate', mssql.Date, data.till_date || null);
        request.input('cardno', mssql.NVarChar(200), data.cardno || null);
        request.input('style', mssql.NVarChar(200), data.style || null);
        request.input('process', mssql.NVarChar(200), data.process || null);

        const result = await request.execute('sp_production_entry_show_data');
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Search Production Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getProductionData = async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;
        const { role, section, unit, limit = 50 } = data;
        const request = pool.request();

        let sql = "";
        if (role === "Operator") {
            sql = `SELECT TOP (${limit}) id, prod_date, cardno, emp_name, style, process, quantity, section 
                   FROM tbl_production_info WHERE section = @section AND unit = @unit ORDER BY id DESC`;
            request.input('section', mssql.NVarChar, section);
            request.input('unit', mssql.NVarChar, unit);
        } else {
            sql = `SELECT TOP (${limit}) id, prod_date, cardno, emp_name, style, process, quantity, section 
                   FROM tbl_production_info WHERE unit = @unit ORDER BY id DESC`;
            request.input('unit', mssql.NVarChar, unit);
        }

        const result = await request.query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Production Data Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const batchInsert = async (req, res) => {
    try {
        const { entries, section, prod_date, style, process, user } = req.body;
        const { username, unit } = user;
        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: 'No production entries provided' });
        }
        const pool = await getPool();

        const promises = entries.map(entry => {
            const request = pool.request();
            request.input('prodId', mssql.Int, 0);
            request.input('unit', mssql.NVarChar(200), unit);
            request.input('section', mssql.NVarChar(200), section);
            request.input('prod_date', mssql.Date, prod_date);
            request.input('style', mssql.NVarChar(200), style);
            request.input('process', mssql.NVarChar(200), process);
            request.input('cardno', mssql.NVarChar(200), entry.cardno);
            request.input('quantity', mssql.Int, entry.quantity);
            request.input('processby', mssql.NVarChar(200), username);
            return request.execute('sp_production_insert_update');
        });

        await Promise.all(promises);
        res.status(201).json({ message: 'Production entries inserted successfully' });
    } catch (err) {
        console.error('Insert Production Error:', err);
        res.status(500).json({ error: err.message || 'Database error' });
    }
};

const updateProduction = async (req, res) => {
    try {
        const { id } = req.params;
        const { entries, section, prod_date, style, process, user } = req.body;
        const { username, unit } = user;
        if (!entries || !Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ error: 'No production entries provided' });
        }
        const pool = await getPool();
        const promises = entries.map(entry => {
            const request = pool.request();
            request.input('prodId', mssql.Int, id);
            request.input('unit', mssql.NVarChar(200), unit);
            request.input('section', mssql.NVarChar(200), section);
            request.input('prod_date', mssql.Date, prod_date);
            request.input('style', mssql.NVarChar(200), style);
            request.input('process', mssql.NVarChar(200), process);
            request.input('cardno', mssql.NVarChar(200), entry.cardno);
            request.input('quantity', mssql.Int, entry.quantity);
            request.input('processby', mssql.NVarChar(200), username);
            return request.execute('sp_production_insert_update');
        });
        await Promise.all(promises);
        res.status(201).json({ message: 'Production entries updated successfully' });
    } catch (err) {
        console.error('Update Production Error:', err);
        res.status(500).json({ error: err.message || 'Database error' });
    }
}
const deleteEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = await getPool();
        const request = pool.request();
        request.input('id', mssql.Int, id);
        await request.execute('sp_production_delete');
        res.status(201).json({ message: 'Production entry deleted successfully' });
    } catch (err) {
        console.error('Delete Production Error:', err);
        res.status(500).json({ error: err.message || 'Database error' });
    }
}

const getMonthlySummary = async (req, res) => {
    try {
        const { unit, year, month } = req.body;
        const pool = await getPool();
        const request = pool.request();

        request.input('unit', mssql.NVarChar(200), unit);
        request.input('year', mssql.Int, year);
        request.input('month', mssql.Int, month);

        const sql = `
            SELECT style, process, SUM(quantity) as Total_Qty, 
                   SUM(quantity) as value, style as label
            FROM tbl_production_info 
            WHERE unit = @unit 
            AND YEAR(prod_date) = @year 
            AND MONTH(prod_date) = @month
            GROUP BY style, process
            ORDER BY Total_Qty DESC
        `;

        const result = await request.query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Monthly Summary Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getProductionList = async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;
        const { role, section, unit, limit = 50 } = data;
        const request = pool.request();

        let sql = "";
        if (role === "Operator") {
            sql = `SELECT TOP (${limit}) id, prod_date, cardno, emp_name, style, process, quantity, section 
                   FROM tbl_production_info WHERE section = @section AND unit = @unit ORDER BY id DESC`;
            request.input('section', mssql.NVarChar, section);
            request.input('unit', mssql.NVarChar, unit);
        } else {
            sql = `SELECT TOP (${limit}) id, prod_date, cardno, emp_name, style, process, quantity, section 
                   FROM tbl_production_info WHERE unit = @unit ORDER BY id DESC`;
            request.input('unit', mssql.NVarChar, unit);
        }

        const result = await request.query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Production List Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
}

const showDataByFilter = async (req, res) => {
    try {
        const pool = await getPool();
        const data = req.body;
        const request = pool.request();
        request.input('unit', mssql.NVarChar, data.login_user.unit);
        request.input('section', mssql.NVarChar, data.section);
        request.input('fromdate', mssql.Date, data.from_date);
        request.input('todate', mssql.Date, data.till_date);
        request.input('cardno', mssql.NVarChar, data.cardno || null);
        request.input('style', mssql.NVarChar, data.style || null);
        request.input('process', mssql.NVarChar, data.process || null);
        const result = await request.execute('sp_production_entry_show_data');
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Production List Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
}

module.exports = {
    searchProduction,
    getProductionData,
    batchInsert,
    getMonthlySummary,
    getProductionList,
    showDataByFilter,
    updateProduction,
    deleteEntry
};
