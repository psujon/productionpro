const express = require('express');
const router = express.Router();
const { getPool } = require('../../config/db');
const { GetSectionItemsList, SectionItemsAdd, SectionItemsUpdate, SectionItemsDelete } = require('../../controllers/section.controller');

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

router.get('/items/list', GetSectionItemsList)
router.post('/items/add', SectionItemsAdd)
router.post('/items/update', SectionItemsUpdate)
router.delete('/items/delete', SectionItemsDelete)
module.exports = router;
