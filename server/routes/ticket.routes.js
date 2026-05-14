const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticket.controller');

router.post('/create', ticketController.createTicket);
router.post('/list', ticketController.getTickets);
router.post('/update-status', ticketController.updateTicketStatus);
router.get('/unresolved', ticketController.getUnresolvedTickets);

module.exports = router;
