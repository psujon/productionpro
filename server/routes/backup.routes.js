const express = require('express');
const router = express.Router();

const { GetBackupsList, CreateBackup } = require('../controllers/backup.controller');

router.get('/list', GetBackupsList);
router.post('/create', CreateBackup);

module.exports = router;
