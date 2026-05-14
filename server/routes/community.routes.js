const express = require('express');
const router = express.Router();
const communityController = require('../controllers/community.controller');

router.post('/send', communityController.sendMessage);
router.post('/list', communityController.getMessages);
router.post('/unread-count', communityController.getUnreadCount);
router.post('/mark-read', communityController.markAsRead);

module.exports = router;
