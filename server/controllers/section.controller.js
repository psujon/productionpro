const { getPool } = require('../config/db');

const GetSectionItemsList = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT sec_id as id, section, department FROM tbl_section order by section asc');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching section items list:', error);
        res.status(500).json({ error: 'Failed to fetch section items list' });
    }
}

const SectionItemsAdd = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('section', req.body.section)
            .input('department', req.body.department)
            .query('INSERT INTO tbl_section (section, department) VALUES (@section, @department)');
        res.json({ success: true, message: 'Section added successfully' });
    } catch (error) {
        console.error('Error adding section:', error);
        res.status(500).json({ error: 'Failed to add section' });
    }
}

const SectionItemsUpdate = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('section', req.body.section)
            .input('department', req.body.department)
            .input('id', req.body.id)
            .query('UPDATE tbl_section SET department = @department, section = @section WHERE sec_id = @id');
        res.json({ success: true, message: 'Section updated successfully' });
    } catch (error) {
        console.error('Error updating section:', error);
        res.status(500).json({ error: 'Failed to update section' });
    }
}

const SectionItemsDelete = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', req.body.id)
            .query('DELETE FROM tbl_section WHERE sec_id = @id');
        res.json({ success: true, message: 'Section deleted successfully' });
    } catch (error) {
        console.error('Error deleting section:', error);
        res.status(500).json({ error: 'Failed to delete section' });
    }
}

module.exports = {
    GetSectionItemsList,
    SectionItemsAdd,
    SectionItemsUpdate,
    SectionItemsDelete
}