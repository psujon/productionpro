const express = require('express');
const { employeeShowList, insertEmployee, updateEmployee, deleteEmployee, filteredEmployeeShowList } = require('../controllers/employee.controller');
const router = express.Router();

router.post('/get/list', employeeShowList);
router.post('/filtered/show/list', filteredEmployeeShowList);
router.post('/insert', insertEmployee);
router.put('/update/:id', updateEmployee);
router.delete('/delete/:id', deleteEmployee);

module.exports = router;