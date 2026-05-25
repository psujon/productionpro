const express = require('express');
const router = express.Router();

const { GlobalSectionList, GlobalBuyerFetch, SectionWiseStyleLoad, StyleWiseProcessLoad, GlobalDepartmentFetch, GlobalBlockFetch, GlobalCountryList, GlobalCountryAdd, GlobalCountryUpdate, GlobalCountryDelete, GlobalDepartmentAdd, GlobalDepartmentUpdate, GlobalDepartmentDelete, GlobalDepartmentWiseSectionList } = require('../controllers/globalFetch.controller');

router.get('/section/list', GlobalSectionList);
router.get('/buyer/getlist', GlobalBuyerFetch)
router.get('/department/list', GlobalDepartmentFetch)
router.get('/block/list', GlobalBlockFetch)
router.post('/sectionWiseStyleLoad/list', SectionWiseStyleLoad)
router.post('/styleWiseProcessLoad/list', StyleWiseProcessLoad)
router.get('/country/list', GlobalCountryList)
router.post('/country/add', GlobalCountryAdd)
router.post('/country/update', GlobalCountryUpdate)
router.post('/country/delete', GlobalCountryDelete)
router.post('/department/add', GlobalDepartmentAdd)
router.post('/department/update', GlobalDepartmentUpdate)
router.post('/department/delete', GlobalDepartmentDelete)
router.post('/departmentWiseSectionList', GlobalDepartmentWiseSectionList)
module.exports = router;