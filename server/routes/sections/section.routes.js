const express = require('express');
const router = express.Router();
const { getPool } = require('../../config/db');

// Get distinct sections from tbl_style_info
router.get('/list', async (req, res) => {
    try {
        const pool = await getPool();
        const sql = 'select section from tbl_section order by section asc';
        const result = await pool.request().query(sql);
        res.json(result.recordset || []);
    } catch (err) {
        console.error('Get Section List Error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

module.exports = router;
