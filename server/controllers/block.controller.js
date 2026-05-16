const { getPool, mssql } = require('../config/db');

const GetBlockList = async (req, res) => {
    try {
        const pool = await getPool();
        const query = `SELECT id, block FROM tbl_block`;
        const result = await pool.request().query(query);
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const AddBlock = async (req, res) => {
    try {
        const pool = await getPool();
        const query = `INSERT INTO tbl_block (block) VALUES (@block)`;
        const result = await pool.request()
            .input('block', mssql.NVarChar(200), req.body.block)
            .query(query);
        res.json({ success: true, message: 'Block added successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const DeleteBlock = async (req, res) => {
    try {
        const pool = await getPool();
        const query = `DELETE FROM tbl_block WHERE id = @id`;
        const result = await pool.request()
            .input('id', mssql.Int, req.params.id)
            .query(query);
        res.json({ success: true, message: 'Block deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const UpdateBlock = async (req, res) => {
    try {
        const pool = await getPool();
        const query = `UPDATE tbl_block SET block = @block WHERE id = @id`;
        const result = await pool.request()
            .input('block', mssql.NVarChar(200), req.body.block)
            .input('id', mssql.Int, req.body.id)
            .query(query);
        res.json({ success: true, message: 'Block updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    GetBlockList,
    AddBlock,
    DeleteBlock,
    UpdateBlock
}