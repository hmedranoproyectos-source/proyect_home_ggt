const express = require('express');
const informesController = require('./informes.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.get('/conciliacion-dian-erp', requireAuth, informesController.conciliacionDianErp);

module.exports = router;
