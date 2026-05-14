const { getPool, mssql } = require('../config/db');

const employeeShowList = async (req, res) => {
    try {
        const pool = await getPool();
        const limit = req.body.limit || 10000;
        const result = await pool.request()
            .input('unit', req.body.unit)
            .query(`select top ${limit} id as ID, CARDNO, ACTIVE_STATUS, DEPARTMENT, SECTION, BLOCK, SHIFT, HOLIDAY, EMP_NAME, DESIGNATION, JOINING_DATE from tbl_employee_info where unit=@unit  order by id desc`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Failed to fetch:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const filteredEmployeeShowList = async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('unit', req.body.unit)
            .input('search', '%' + req.body.search + '%')
            .query(`select CARDNO, EMP_NAME from tbl_employee_info where unit=@unit and CARDNO like @search`);
        res.json(result.recordset);
    } catch (err) {
        console.error('Failed to fetch:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const insertEmployee = async (req, res) => {
    try {
        const pool = await getPool();
        const { cardno, emp_name, designation, joining_date, department, section, block, status, user } = req.body;

        await pool.request()
            .input('cardno', cardno)
            .input('emp_name', emp_name)
            .input('designation', designation)
            .input('joining_date', joining_date)
            .input('department', department)
            .input('section', section)
            .input('block', block)
            .input('active_status', status || 'Active')
            .input('unit', user?.unit)
            .query(`INSERT INTO tbl_employee_info (CARDNO, EMP_NAME, DESIGNATION, JOINING_DATE, DEPARTMENT, SECTION, BLOCK, ACTIVE_STATUS, UNIT) 
                    VALUES (@cardno, @emp_name, @designation, @joining_date, @department, @section, @block, @active_status, @unit)`);

        res.json({ message: 'Employee added successfully' });
    } catch (err) {
        console.error('Failed to insert:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const updateEmployee = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        const { cardno, emp_name, designation, joining_date, department, section, block, status } = req.body;

        await pool.request()
            .input('id', id)
            .input('cardno', cardno)
            .input('emp_name', emp_name)
            .input('designation', designation)
            .input('joining_date', joining_date)
            .input('department', department)
            .input('section', section)
            .input('block', block)
            .input('active_status', status)
            .query(`UPDATE tbl_employee_info SET 
                    CARDNO=@cardno, EMP_NAME=@emp_name, DESIGNATION=@designation, JOINING_DATE=@joining_date, 
                    DEPARTMENT=@department, SECTION=@section, BLOCK=@block, ACTIVE_STATUS=@active_status 
                    WHERE id=@id`);

        res.json({ message: 'Employee updated successfully' });
    } catch (err) {
        console.error('Failed to update:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

const deleteEmployee = async (req, res) => {
    try {
        const pool = await getPool();
        const { id } = req.params;
        await pool.request()
            .input('id', id)
            .query('DELETE FROM tbl_employee_info WHERE id=@id');
        res.json({ message: 'Employee deleted successfully' });
    } catch (err) {
        console.error('Failed to delete:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    employeeShowList,
    insertEmployee,
    updateEmployee,
    deleteEmployee,
    filteredEmployeeShowList
}