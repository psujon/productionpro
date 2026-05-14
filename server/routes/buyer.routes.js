const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyer.controller');

router.get('/', buyerController.getBuyers);
router.post('/', buyerController.createBuyer);
router.put('/update/:id', buyerController.updateBuyer);
router.delete('/delete/:id', buyerController.deleteBuyer);
router.post('/order/getData', buyerController.getBuyerOrderList);
router.post('/order/insert', buyerController.createBuyerOrder);
router.put('/order/update/:id', buyerController.updateBuyerOrder);
router.delete('/order/delete/:id', buyerController.deleteBuyerOrder);

module.exports = router;
