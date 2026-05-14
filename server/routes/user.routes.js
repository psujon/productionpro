const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');

router.post('/login', userController.login);
router.post('/list', userController.getUsers);
router.post('/create', userController.createUser);
router.post('/activity-logs', userController.getActivityLogs);
router.post('/logout', userController.logout);
router.post('/permissions/get', userController.getUserPermissions);
router.post('/permissions/update', userController.updateUserPermissions);

module.exports = router;
