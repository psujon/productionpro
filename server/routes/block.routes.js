const express = require('express');
const router = express.Router();

const { GetBlockList, AddBlock, DeleteBlock, UpdateBlock } = require('../controllers/block.controller');

router.get('/list', GetBlockList);
router.post('/add', AddBlock);
router.put('/update', UpdateBlock);
router.delete('/delete/:id', DeleteBlock);

module.exports = router;