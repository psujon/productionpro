const express = require('express');
const router = express.Router();
const productionController = require('../controllers/production.controller');

router.post('/search', productionController.searchProduction);
router.post('/get-data', productionController.getProductionData);
router.post('/style/monthlySummary', productionController.getMonthlySummary);
router.post('/style/yearlySummary', productionController.getLast12MonthsSummary);
router.post('/getProduction/list', productionController.getProductionList)
router.post('/showDataByFilter', productionController.showDataByFilter)
router.post('/batch/insert', productionController.batchInsert)
router.put('/update/:id', productionController.updateProduction)
router.delete('/delete/:id', productionController.deleteEntry)

module.exports = router;
