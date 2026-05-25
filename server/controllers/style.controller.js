const { getPool, mssql } = require('../config/db');
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

const getStyles = async (req, res) => {
    try {
        const pool = await getPool();
        const { unit, section, role } = req.body;
        const request = pool.request();

        let sql = "";
        if (role === "Admin") {
            sql = `SELECT id, buyer, section, style, process, 
                   CASE WHEN status=0 THEN 'Active' ELSE 'Inactive' END AS status, 
                   CASE WHEN last_process=1 THEN 'Yes' ELSE 'No' END AS last_process 
                   FROM tbl_style_info WHERE unit='${unit}' ORDER BY id DESC`;
        } else {
            sql = `SELECT id, buyer, section, style, process, 
                   CASE WHEN status=0 THEN 'Active' ELSE 'Inactive' END AS status, 
                   CASE WHEN last_process=1 THEN 'Yes' ELSE 'No' END AS last_process 
                   FROM tbl_style_info WHERE section='${section}' AND unit='${unit}' ORDER BY id DESC`;
        }

        const result = await request.query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Styles Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const saveStyle = async (req, res) => {
    try {
        const data = req.body;
        const pool = await getPool();
        const request = pool.request();

        request.input('unit', mssql.NVarChar(200), data.unit);
        request.input('buyer', mssql.NVarChar(200), data.buyer);
        request.input('section', mssql.NVarChar(200), data.section);
        request.input('style', mssql.NVarChar(200), data.style);
        request.input('process', mssql.NVarChar(50), data.process);
        request.input('last_process', mssql.Bit, data.last_process === 'Yes' ? 1 : 0);
        request.input('status', mssql.Int, data.status === 'Active' ? 1 : 0);
        request.input('process_by', mssql.NVarChar, data.process_user);
        request.output('id', mssql.Int);

        const result = await request.execute('sp_style_insert_update');
        res.status(201).json({ message: 'Style saved', id: result.output.id });
    } catch (err) {
        console.error('Save Style Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getStyleRates = async (req, res) => {
    try {
        const pool = await getPool();
        const { unit } = req.body;
        const sql = `SELECT id, section, style, process,effective_date, price FROM tbl_style_rate WHERE unit='${unit}' ORDER BY id DESC`;
        const result = await pool.request().query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Style Rates Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const insertStyleRate = async (req, res) => {
    try {
        const data = req.body;
        const pool = await getPool();
        const request = pool.request();

        request.input('unit', mssql.NVarChar(200), data.unit);
        request.input('section', mssql.NVarChar(200), data.section);
        request.input('style', mssql.NVarChar(200), data.style);
        request.input('process', mssql.NVarChar(200), data.process);
        request.input('pieceRate', mssql.Decimal(10, 2), data.price);
        request.input('processby', mssql.NVarChar(200), data.username);

        await request.execute('sp_style_piece_rate_insert');
        res.status(201).json({ message: 'Style rate inserted successfully' });
    } catch (err) {
        console.error('Insert Style Rate Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const sectionBuyerWiseStyleList = async (req, res) => {
    try {
        const pool = await getPool();
        const { unit, section, buyer } = req.body;
        const sql = `select style from tbl_style_info where unit=@unit and section =@section and buyer=@buyer GROUP BY STYLE ORDER BY STYLE ASC`;
        const result = await pool.request()
            .input('unit', mssql.NVarChar(200), unit)
            .input('section', mssql.NVarChar(200), section)
            .input('buyer', mssql.NVarChar(200), buyer)
            .query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Style Rates Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

module.exports = {
    getStyles,
    saveStyle,
    getStyleRates,
    insertStyleRate,
    sectionBuyerWiseStyleList
};
