const { getPool } = require('../config/db');

const GlobalDepartmentFetch = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT dept_id as id, department FROM tbl_department order by department asc');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching global sections:', error);
        res.status(500).json({ error: 'Failed to fetch global sections' });
    }
}
const GlobalDepartmentWiseSectionList = async (req, res) => {
    try {
        const pool = await getPool();
        const department = req.body.department;
        const result = await pool.request()
            .input('department', department)
            .query('SELECT section FROM tbl_section WHERE department = @department order by section asc');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching global sections:', error);
        res.status(500).json({ error: 'Failed to fetch global sections' });
    }
}

const GlobalSectionList = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT section FROM tbl_section order by section asc');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching global sections:', error);
        res.status(500).json({ error: 'Failed to fetch global sections' });
    }
}

const GlobalBlockFetch = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request().query('SELECT block FROM tbl_block order by block asc');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching global sections:', error);
        res.status(500).json({ error: 'Failed to fetch global sections' });
    }
}

const GlobalBuyerFetch = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT buyer FROM tbl_buyer_info order by buyer asc;');

        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching global buyers:', error);
        res.status(500).json({ error: 'Failed to fetch global buyers' });
    }
}

const SectionWiseStyleLoad = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('section', req.body.section)
            .input('unit', req.body.unit)
            .query('SELECT style FROM tbl_style_info WHERE section = @section and unit=@unit order by style asc;');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching section wise style:', error);
        res.status(500).json({ error: 'Failed to fetch section wise style' });
    }
}

const StyleWiseProcessLoad = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('style', req.body.style)
            .input('section', req.body.section)
            .input('unit', req.body.unit)
            .query('SELECT process FROM tbl_style_info WHERE style = @style and section=@section and unit=@unit order by process asc;');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching style wise process:', error);
        res.status(500).json({ error: 'Failed to fetch style wise process' });
    }
}

const GlobalCountryList = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .query('SELECT id, country, short_code FROM tbl_country order by country asc;');
        res.json(result.recordset);
    } catch (error) {
        console.error('Error fetching global countries:', error);
        res.status(500).json({ error: 'Failed to fetch global countries' });
    }
}

const GlobalCountryAdd = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('country', req.body.country)
            .input('short_code', req.body.short_code)
            .query('INSERT INTO tbl_country (country, short_code) VALUES (@country, @short_code);');
        if (result.rowsAffected[0] > 0) {
            res.json({ success: true, message: 'Country added successfully' });
        } else {
            res.json({ success: false, message: 'Failed to add country' });
        }
    } catch (error) {
        console.error('Error adding country:', error);
        res.status(500).json({ error: 'Failed to add country' });
    }
}

const GlobalCountryUpdate = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('country', req.body.country)
            .input('short_code', req.body.short_code)
            .input('id', req.body.id)
            .query('UPDATE tbl_country SET country = @country, short_code = @short_code WHERE id = @id;');
        res.json({ success: true, message: 'Country updated successfully' });
    } catch (error) {
        console.error('Error updating country:', error);
        res.status(500).json({ error: 'Failed to update country' });
    }
}

const GlobalCountryDelete = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('id', req.body.id)
            .query('DELETE FROM tbl_country WHERE id = @id;');
        res.json({ success: true, message: 'Country deleted successfully' });
    } catch (error) {
        console.error('Error deleting country:', error);
        res.status(500).json({ error: 'Failed to delete country' });
    }
}

const GlobalDepartmentAdd = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('department', req.body.department)
            .query('INSERT INTO tbl_department (department) VALUES (@department);');
        if (result.rowsAffected[0] > 0) {
            res.json({ success: true, message: 'Department added successfully' });
        } else {
            res.json({ success: false, message: 'Failed to add department' });
        }
    } catch (error) {
        console.error('Error adding department:', error);
        res.status(500).json({ error: 'Failed to add department' });
    }
}

const GlobalDepartmentUpdate = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('department', req.body.department)
            .input('dept_id', req.body.id)
            .query('UPDATE tbl_department SET department = @department WHERE dept_id = @dept_id;');
        if (result.rowsAffected[0] > 0) {
            res.json({ success: true, message: 'Department updated successfully' });
        } else {
            res.json({ success: false, message: 'Failed to update department' });
        }
    } catch (error) {
        console.error('Error updating department:', error);
        res.status(500).json({ error: 'Failed to update department' });
    }
}

const GlobalDepartmentDelete = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('dept_id', req.body.id)
            .query('DELETE FROM tbl_department WHERE dept_id = @dept_id;');
        if (result.rowsAffected[0] > 0) {
            res.json({ success: true, message: 'Department deleted successfully' });
        } else {
            res.json({ success: false, message: 'Failed to delete department' });
        }
    } catch (error) {
        console.error('Error deleting department:', error);
        res.status(500).json({ error: 'Failed to delete department' });
    }
}

module.exports = {
    GlobalSectionList,
    GlobalBuyerFetch,
    SectionWiseStyleLoad,
    StyleWiseProcessLoad,
    GlobalDepartmentFetch,
    GlobalBlockFetch,
    GlobalCountryList,
    GlobalCountryAdd,
    GlobalCountryUpdate,
    GlobalCountryDelete,
    GlobalDepartmentAdd,
    GlobalDepartmentUpdate,
    GlobalDepartmentDelete,
    GlobalDepartmentWiseSectionList
};
