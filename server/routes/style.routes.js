const express = require('express');
const router = express.Router();
const styleController = require('../controllers/style.controller');

router.post('/get', styleController.getStyles);
router.post('/update', styleController.saveStyle);
router.post('/rate/get', styleController.getStyleRates);
router.post('/rate/insert', styleController.insertStyleRate);
router.post('/sectionBuyerWiseStyleList', styleController.sectionBuyerWiseStyleList);
module.exports = router;
