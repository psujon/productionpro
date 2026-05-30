const express = require('express');
const router = express.Router();
const { SaveDatabaseLock, GetLockoutDate } = require('../controllers/databaseLock.controller');

router.post('/save', SaveDatabaseLock);
router.get('/getLockoutDate', GetLockoutDate)

module.exports = router;
